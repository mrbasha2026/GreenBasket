'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useWC2026Store } from '@/store/wc2026-store';
import { fetchResults, fetchLiveMatches, processFixtures, isMatchFinished, isMatchLive, type MatchStatusAPI, type APIFixture, type MatchEvent } from '@/lib/auto-results';
import { MATCHES, TEAMS } from '@/lib/wc2026-data';
import type { LiveScore, MatchLineup, MatchStats } from '@/store/wc2026-store';

// Venue timezone offsets
const VENUE_TZ_OFFSETS: Record<string, number> = {
  'Mexico City Stadium': -5, 'Estadio Guadalajara': -5, 'Estadio Monterrey': -5,
  'Boston Stadium': -4, 'New York New Jersey Stadium': -4, 'Philadelphia Stadium': -4,
  'Miami Stadium': -4, 'Atlanta Stadium': -4, 'Houston Stadium': -5, 'Dallas Stadium': -5,
  'Kansas City Stadium': -5, 'Los Angeles Stadium': -7, 'San Francisco Bay Area Stadium': -7,
  'Seattle Stadium': -7, 'Toronto Stadium': -4, 'BC Place Vancouver': -7,
};

function getMatchUTCDate(date: string, time: string, venue: string): Date | null {
  const venueOffset = VENUE_TZ_OFFSETS[venue];
  if (venueOffset === undefined) return null;
  try {
    const [hours, minutes] = time.split(':').map(Number);
    const utcHours = hours - venueOffset;
    return new Date(Date.UTC(parseInt(date.substring(0, 4)), parseInt(date.substring(5, 7)) - 1, parseInt(date.substring(8, 10)), utcHours, minutes, 0));
  } catch { return null; }
}

function hasActiveOrUpcomingMatches(): boolean {
  const now = Date.now();
  for (const match of MATCHES) {
    if (!match.time) continue;
    const utcDate = getMatchUTCDate(match.date, match.time, match.venue);
    if (!utcDate) continue;
    const matchTime = utcDate.getTime();
    if ((matchTime > now && matchTime - now < 30 * 60 * 1000) || (matchTime <= now && now - matchTime < 2 * 60 * 60 * 1000)) return true;
  }
  return false;
}

function fixtureToLiveScore(fixture: APIFixture): LiveScore {
  return {
    homeGoals: fixture.goalsHome ?? 0,
    awayGoals: fixture.goalsAway ?? 0,
    status: fixture.status,
    elapsed: fixture.elapsed ?? null,
    homePenalties: fixture.scorePenaltyHome ?? undefined,
    awayPenalties: fixture.scorePenaltyAway ?? undefined,
    scoreHalftimeHome: fixture.scoreHalftimeHome ?? undefined,
    scoreHalftimeAway: fixture.scoreHalftimeAway ?? undefined,
    referee: fixture.referee,
  };
}

// Send a browser notification for match events
function sendEventNotification(title: string, body: string, tag: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const notif = new Notification(title, {
      body,
      icon: '/wc2026-icon-192.png',
      badge: '/wc2026-favicon.png',
      tag,
      dir: 'rtl',
      lang: 'ar',
    });
    notif.onclick = () => { window.focus(); notif.close(); };
  } catch {
    // Try service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, { body, icon: '/wc2026-icon-192.png', tag, dir: 'rtl', lang: 'ar' });
      });
    }
  }
}

export function useAutoResults() {
  const {
    autoResultsEnabled, isFetching, fetchError, lastFetchTime,
    matchEvents, liveScores,
    setAutoResults, setAutoResultsEnabled, setFetchState,
    setLiveMatchStatuses, setLiveScores,
    setMatchEvents, setMatchLineups, setMatchStats,
    setApiStandings, setApiFixtureIds,
  } = useWC2026Store();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const liveCheckRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(false);
  const previousEventsRef = useRef<Record<number, string>>({}); // matchId → last event hash

  // Check for new events and send notifications
  const checkAndNotifyNewEvents = useCallback((newEventsMap: Record<number, MatchEvent[]>) => {
    for (const [matchIdStr, events] of Object.entries(newEventsMap)) {
      const matchId = parseInt(matchIdStr);
      const match = MATCHES.find(m => m.id === matchId);
      if (!match) continue;

      const team1Ar = TEAMS[match.team1]?.nameAr || match.team1;
      const team2Ar = TEAMS[match.team2]?.nameAr || match.team2;

      for (const event of events) {
        // Create a unique hash for this event
        const eventHash = `${event.time.elapsed}-${event.type}-${event.detail}-${event.player.name}-${event.team.name}`;

        // Skip if we already notified about this event
        const prevHash = previousEventsRef.current[matchId];
        if (prevHash === eventHash) continue;

        // Only notify for goals, red cards, and match start
        if (event.type === 'Goal') {
          const goalType = event.detail === 'Penalty' ? '(ركلة جزاء)' : event.detail === 'Own Goal' ? '(هدف عكسي)' : '';
          sendEventNotification(
            `⚽ هدف! ${team1Ar} ضد ${team2Ar}`,
            `${event.player.name || 'هدف'} ${goalType} - الدقيقة ${event.time.elapsed}'`,
            `goal-${matchId}-${event.time.elapsed}`
          );
          previousEventsRef.current[matchId] = eventHash;
        } else if (event.type === 'Card' && (event.detail === 'Red Card' || event.detail === 'Second Yellow Card')) {
          sendEventNotification(
            `🟥 بطاقة حمراء! ${team1Ar} ضد ${team2Ar}`,
            `${event.player.name} - الدقيقة ${event.time.elapsed}'`,
            `card-${matchId}-${event.time.elapsed}`
          );
          previousEventsRef.current[matchId] = eventHash;
        }
      }
    }
  }, []);

  // Check for score changes and notify
  const checkAndNotifyScoreChange = useCallback(
    (newScores: Record<number, LiveScore>) => {
      for (const [matchIdStr, newScore] of Object.entries(newScores)) {
        const matchId = parseInt(matchIdStr);
        const match = MATCHES.find(m => m.id === matchId);
        if (!match) continue;

        const team1Ar = TEAMS[match.team1]?.nameAr || match.team1;
        const team2Ar = TEAMS[match.team2]?.nameAr || match.team2;
        const prevScore = liveScores[matchId];

        // Check if score changed
        if (prevScore && (prevScore.homeGoals !== newScore.homeGoals || prevScore.awayGoals !== newScore.awayGoals)) {
          sendEventNotification(
            `⚽ تحديث النتيجة! ${team1Ar} ${newScore.homeGoals} - ${newScore.awayGoals} ${team2Ar}`,
            `الدقيقة ${newScore.elapsed || '?'}'`,
            `score-${matchId}-${newScore.homeGoals}-${newScore.awayGoals}`
          );
        }

        // Notify when match goes to halftime
        if (prevScore && prevScore.status !== 'HT' && newScore.status === 'HT') {
          sendEventNotification(
            `⏸️ نهاية الشوط الأول - ${team1Ar} ${newScore.homeGoals} - ${newScore.awayGoals} ${team2Ar}`,
            `استراحة`,
            `ht-${matchId}`
          );
        }

        // Notify when match finishes
        if (prevScore && !isMatchFinished(prevScore.status as MatchStatusAPI) && isMatchFinished(newScore.status as MatchStatusAPI)) {
          sendEventNotification(
            `🏁 انتهت المباراة! ${team1Ar} ${newScore.homeGoals} - ${newScore.awayGoals} ${team2Ar}`,
            `النتيجة النهائية`,
            `ft-${matchId}`
          );
        }

        // Notify when match starts (was upcoming, now live)
        if ((!prevScore || prevScore.status === 'NS') && isMatchLive(newScore.status as MatchStatusAPI)) {
          sendEventNotification(
            `⚽ بدأت المباراة! ${team1Ar} ضد ${team2Ar}`,
            `المباراة جارية الآن`,
            `start-${matchId}`
          );
        }
      }
    },
    [liveScores]
  );

  // Fetch and process results
  const fetchAndProcess = useCallback(async () => {
    if (isFetching) return;
    setFetchState(true, null, null);

    try {
      const now = new Date();
      const saudiDate = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' });
      const response = await fetchResults(saudiDate, true);

      if (response.error === 'API_KEY_NOT_CONFIGURED') {
        setFetchState(false, 'مفتاح API غير مُعد', null);
        return;
      }
      if (response.error === 'INVALID_RESPONSE' || response.error === 'NETWORK_ERROR' || response.error === 'API_ERROR') {
        setFetchState(false, 'لا يمكن الاتصال بالخادم', null);
        return;
      }

      if (response.success && response.fixtures.length > 0) {
        const processed = processFixtures(response.fixtures);
        const autoResults: Record<number, { homeGoals: number; awayGoals: number; homePenalties?: number; awayPenalties?: number }> = {};
        const liveStatuses: Record<number, string> = {};
        const liveScoreMap: Record<number, LiveScore> = {};
        const eventsMap: Record<number, MatchEvent[]> = {};
        const lineupsMap: Record<number, MatchLineup[]> = {};
        const statsMap: Record<number, MatchStats[]> = {};
        const fixtureIdMap: Record<number, number> = {};

        for (const [matchIdStr, data] of Object.entries(processed)) {
          const matchId = parseInt(matchIdStr);
          if (isMatchFinished(data.status as MatchStatusAPI)) autoResults[matchId] = data.result;
          if (isMatchLive(data.status as MatchStatusAPI)) {
            liveStatuses[matchId] = data.status;
            liveScoreMap[matchId] = fixtureToLiveScore(data.fixture);
          }
          fixtureIdMap[matchId] = data.fixture.id;
          if (data.fixture.events?.length) eventsMap[matchId] = data.fixture.events;
          if (data.fixture.lineups?.length) lineupsMap[matchId] = data.fixture.lineups;
          if (data.fixture.statistics?.length) statsMap[matchId] = data.fixture.statistics;
        }

        if (Object.keys(autoResults).length) setAutoResults(autoResults);
        setLiveMatchStatuses(liveStatuses);
        setLiveScores(liveScoreMap);
        if (Object.keys(eventsMap).length) { setMatchEvents(eventsMap); checkAndNotifyNewEvents(eventsMap); }
        if (Object.keys(lineupsMap).length) setMatchLineups(lineupsMap);
        if (Object.keys(statsMap).length) setMatchStats(statsMap);
        setApiFixtureIds(fixtureIdMap);

        // Check for score changes
        if (Object.keys(liveScoreMap).length) checkAndNotifyScoreChange(liveScoreMap);
      }

      if (response.standings) setApiStandings(response.standings);
      setFetchState(false, null, Date.now());
    } catch (error) {
      setFetchState(false, 'فشل في جلب النتائج', null);
    }
  }, [isFetching, setAutoResults, setFetchState, setLiveMatchStatuses, setLiveScores, setMatchEvents, setMatchLineups, setMatchStats, setApiStandings, setApiFixtureIds, checkAndNotifyNewEvents, checkAndNotifyScoreChange]);

  // Fetch live matches (with events for goal notifications)
  const fetchLive = useCallback(async () => {
    try {
      const response = await fetchLiveMatches();
      if (response.error) return;
      if (!response.success || !response.fixtures.length) return;

      const processed = processFixtures(response.fixtures);
      const liveStatuses: Record<number, string> = {};
      const autoResults: Record<number, any> = {};
      const liveScoreMap: Record<number, LiveScore> = {};
      const eventsMap: Record<number, MatchEvent[]> = {};
      const lineupsMap: Record<number, MatchLineup[]> = {};
      const statsMap: Record<number, MatchStats[]> = {};
      const fixtureIdMap: Record<number, number> = {};

      for (const [matchIdStr, data] of Object.entries(processed)) {
        const matchId = parseInt(matchIdStr);
        if (isMatchFinished(data.status as MatchStatusAPI)) autoResults[matchId] = data.result;
        liveStatuses[matchId] = data.status;
        fixtureIdMap[matchId] = data.fixture.id;
        if (isMatchLive(data.status as MatchStatusAPI)) liveScoreMap[matchId] = fixtureToLiveScore(data.fixture);
        if (data.fixture.events?.length) eventsMap[matchId] = data.fixture.events;
        if (data.fixture.lineups?.length) lineupsMap[matchId] = data.fixture.lineups;
        if (data.fixture.statistics?.length) statsMap[matchId] = data.fixture.statistics;
      }

      if (Object.keys(autoResults).length) setAutoResults(autoResults);
      setLiveMatchStatuses(liveStatuses);
      setLiveScores(liveScoreMap);
      if (Object.keys(eventsMap).length) { setMatchEvents(eventsMap); checkAndNotifyNewEvents(eventsMap); }
      if (Object.keys(lineupsMap).length) setMatchLineups(lineupsMap);
      if (Object.keys(statsMap).length) setMatchStats(statsMap);
      setApiFixtureIds(fixtureIdMap);

      // Check for score changes
      if (Object.keys(liveScoreMap).length) checkAndNotifyScoreChange(liveScoreMap);
    } catch { /* Silent */ }
  }, [setAutoResults, setLiveMatchStatuses, setLiveScores, setMatchEvents, setMatchLineups, setMatchStats, setApiFixtureIds, checkAndNotifyNewEvents, checkAndNotifyScoreChange]);

  // Auto-enable and start fetching on mount
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      // Auto-enable if not already set
      if (!autoResultsEnabled) {
        setAutoResultsEnabled(true);
      }
    }

    // Always run if enabled (default true)
    if (!autoResultsEnabled) return;

    // Initial fetch
    fetchAndProcess();

    // Periodic fetch every 5 minutes
    intervalRef.current = setInterval(() => fetchAndProcess(), 5 * 60 * 1000);

    // Live check every 60 seconds when matches are active
    liveCheckRef.current = setInterval(() => {
      if (hasActiveOrUpcomingMatches()) fetchLive();
    }, 60 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (liveCheckRef.current) clearInterval(liveCheckRef.current);
    };
  }, [autoResultsEnabled, fetchAndProcess, fetchLive]);

  return {
    autoResultsEnabled,
    isFetching,
    fetchError,
    lastFetchTime,
    toggleAutoResults: (enabled: boolean) => {
      setAutoResultsEnabled(enabled);
    },
    refreshNow: fetchAndProcess,
  };
}
