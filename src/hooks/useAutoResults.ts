'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useWC2026Store } from '@/store/wc2026-store';
import { fetchResults, fetchLiveMatches, processFixtures, isMatchFinished, isMatchLive, type MatchStatusAPI, type APIFixture } from '@/lib/auto-results';
import { MATCHES } from '@/lib/wc2026-data';
import type { LiveScore, MatchEvent, MatchLineup, MatchStats } from '@/store/wc2026-store';

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

export function useAutoResults() {
  const {
    autoResultsEnabled, isFetching, fetchError, lastFetchTime,
    setAutoResults, setAutoResultsEnabled, setFetchState,
    setLiveMatchStatuses, setLiveScores,
    setMatchEvents, setMatchLineups, setMatchStats,
    setApiStandings, setApiFixtureIds,
  } = useWC2026Store();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const liveCheckRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(false);
  const apiKeyConfiguredRef = useRef<boolean | null>(null);

  // Fetch and process results
  const fetchAndProcess = useCallback(async () => {
    if (isFetching) return;
    setFetchState(true, null, null);

    try {
      const now = new Date();
      const saudiDate = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' });

      // Fetch results with standings (every 5 min fetch)
      const response = await fetchResults(saudiDate, true);

      if (response.error === 'API_KEY_NOT_CONFIGURED') {
        apiKeyConfiguredRef.current = false;
        setFetchState(false, 'مفتاح API غير مُعد - يرجى إعداد API_FOOTBALL_KEY في Netlify', null);
        return;
      }
      if (response.error === 'INVALID_RESPONSE') {
        apiKeyConfiguredRef.current = null;
        setFetchState(false, 'Netlify Functions غير منشورة', null);
        return;
      }
      if (response.error === 'NETWORK_ERROR') {
        setFetchState(false, 'خطأ في الاتصال بالخادم', null);
        return;
      }

      apiKeyConfiguredRef.current = true;

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

          if (isMatchFinished(data.status as MatchStatusAPI)) {
            autoResults[matchId] = data.result;
          }
          if (isMatchLive(data.status as MatchStatusAPI)) {
            liveStatuses[matchId] = data.status;
            liveScoreMap[matchId] = fixtureToLiveScore(data.fixture);
          }

          // Store fixture ID mapping
          fixtureIdMap[matchId] = data.fixture.id;

          // Store events from fixture if available
          if (data.fixture.events && data.fixture.events.length > 0) {
            eventsMap[matchId] = data.fixture.events;
          }
          if (data.fixture.lineups && data.fixture.lineups.length > 0) {
            lineupsMap[matchId] = data.fixture.lineups;
          }
          if (data.fixture.statistics && data.fixture.statistics.length > 0) {
            statsMap[matchId] = data.fixture.statistics;
          }
        }

        if (Object.keys(autoResults).length > 0) setAutoResults(autoResults);
        setLiveMatchStatuses(liveStatuses);
        setLiveScores(liveScoreMap);
        if (Object.keys(eventsMap).length > 0) setMatchEvents(eventsMap);
        if (Object.keys(lineupsMap).length > 0) setMatchLineups(lineupsMap);
        if (Object.keys(statsMap).length > 0) setMatchStats(statsMap);
        setApiFixtureIds(fixtureIdMap);
      }

      // Store standings
      if (response.standings) {
        setApiStandings(response.standings);
      }

      setFetchState(false, null, Date.now());
    } catch (error) {
      setFetchState(false, 'فشل في جلب النتائج', null);
    }
  }, [isFetching, setAutoResults, setFetchState, setLiveMatchStatuses, setLiveScores, setMatchEvents, setMatchLineups, setMatchStats, setApiStandings, setApiFixtureIds]);

  // Fetch live matches specifically (includes events)
  const fetchLive = useCallback(async () => {
    try {
      const response = await fetchLiveMatches();
      if (response.error === 'API_KEY_NOT_CONFIGURED' || response.error === 'INVALID_RESPONSE') return;

      if (response.success && response.fixtures.length > 0) {
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

          if (isMatchFinished(data.status as MatchStatusAPI)) {
            autoResults[matchId] = data.result;
          }
          liveStatuses[matchId] = data.status;
          fixtureIdMap[matchId] = data.fixture.id;

          // Always update live score for live matches
          if (isMatchLive(data.status as MatchStatusAPI)) {
            liveScoreMap[matchId] = fixtureToLiveScore(data.fixture);
          }

          // Store enhanced data from live fetch
          if (data.fixture.events && data.fixture.events.length > 0) {
            eventsMap[matchId] = data.fixture.events;
          }
          if (data.fixture.lineups && data.fixture.lineups.length > 0) {
            lineupsMap[matchId] = data.fixture.lineups;
          }
          if (data.fixture.statistics && data.fixture.statistics.length > 0) {
            statsMap[matchId] = data.fixture.statistics;
          }
        }

        if (Object.keys(autoResults).length > 0) setAutoResults(autoResults);
        setLiveMatchStatuses(liveStatuses);
        setLiveScores(liveScoreMap);
        if (Object.keys(eventsMap).length > 0) setMatchEvents(eventsMap);
        if (Object.keys(lineupsMap).length > 0) setMatchLineups(lineupsMap);
        if (Object.keys(statsMap).length > 0) setMatchStats(statsMap);
        setApiFixtureIds(fixtureIdMap);
      }
    } catch {
      // Silently fail for live checks
    }
  }, [setAutoResults, setLiveMatchStatuses, setLiveScores, setMatchEvents, setMatchLineups, setMatchStats, setApiFixtureIds]);

  useEffect(() => {
    if (!autoResultsEnabled || !mountedRef.current) return;

    fetchAndProcess();
    intervalRef.current = setInterval(() => fetchAndProcess(), 5 * 60 * 1000);
    liveCheckRef.current = setInterval(() => {
      if (hasActiveOrUpcomingMatches()) fetchLive();
    }, 60 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (liveCheckRef.current) clearInterval(liveCheckRef.current);
    };
  }, [autoResultsEnabled, fetchAndProcess, fetchLive]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  return {
    autoResultsEnabled,
    isFetching,
    fetchError,
    lastFetchTime,
    apiKeyConfigured: apiKeyConfiguredRef.current,
    toggleAutoResults: (enabled: boolean) => {
      setAutoResultsEnabled(enabled);
      if (enabled) fetchAndProcess();
    },
    refreshNow: fetchAndProcess,
  };
}
