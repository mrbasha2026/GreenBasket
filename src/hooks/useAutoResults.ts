'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useWC2026Store } from '@/store/wc2026-store';
import { fetchResults, fetchLiveMatches, processFixtures, isMatchFinished, isMatchLive, type MatchStatusAPI, type APIFixture } from '@/lib/auto-results';
import { MATCHES } from '@/lib/wc2026-data';
import type { LiveScore } from '@/store/wc2026-store';

// Venue timezone offsets for determining if a match is happening now
const VENUE_TZ_OFFSETS: Record<string, number> = {
  'Mexico City Stadium': -5,
  'Estadio Guadalajara': -5,
  'Estadio Monterrey': -5,
  'Boston Stadium': -4,
  'New York New Jersey Stadium': -4,
  'Philadelphia Stadium': -4,
  'Miami Stadium': -4,
  'Atlanta Stadium': -4,
  'Houston Stadium': -5,
  'Dallas Stadium': -5,
  'Kansas City Stadium': -5,
  'Los Angeles Stadium': -7,
  'San Francisco Bay Area Stadium': -7,
  'Seattle Stadium': -7,
  'Toronto Stadium': -4,
  'BC Place Vancouver': -7,
};

function getMatchUTCDate(date: string, time: string, venue: string): Date | null {
  const venueOffset = VENUE_TZ_OFFSETS[venue];
  if (venueOffset === undefined) return null;
  try {
    const [hours, minutes] = time.split(':').map(Number);
    const utcHours = hours - venueOffset;
    return new Date(Date.UTC(
      parseInt(date.substring(0, 4)),
      parseInt(date.substring(5, 7)) - 1,
      parseInt(date.substring(8, 10)),
      utcHours,
      minutes,
      0
    ));
  } catch {
    return null;
  }
}

// Check if there are any matches happening now or about to start
function hasActiveOrUpcomingMatches(): boolean {
  const now = Date.now();
  const TWO_HOURS = 2 * 60 * 60 * 1000;
  const THIRTY_MIN = 30 * 60 * 1000;

  for (const match of MATCHES) {
    if (!match.time) continue;
    const utcDate = getMatchUTCDate(match.date, match.time, match.venue);
    if (!utcDate) continue;

    const matchTime = utcDate.getTime();
    // Match is within next 30 minutes or currently happening (within 2 hours)
    if ((matchTime > now && matchTime - now < THIRTY_MIN) || (matchTime <= now && now - matchTime < TWO_HOURS)) {
      return true;
    }
  }
  return false;
}

// Extract live score from a fixture
function fixtureToLiveScore(fixture: APIFixture): LiveScore {
  return {
    homeGoals: fixture.goalsHome ?? 0,
    awayGoals: fixture.goalsAway ?? 0,
    status: fixture.status,
    elapsed: fixture.elapsed ?? null,
    homePenalties: fixture.scorePenaltyHome ?? undefined,
    awayPenalties: fixture.scorePenaltyAway ?? undefined,
  };
}

export function useAutoResults() {
  const {
    autoResultsEnabled,
    isFetching,
    fetchError,
    lastFetchTime,
    setAutoResults,
    setAutoResultsEnabled,
    setFetchState,
    setLiveMatchStatuses,
    setLiveScores,
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
      // Get today's date in Saudi timezone
      const now = new Date();
      const saudiDate = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' });

      // Fetch results for today
      const response = await fetchResults(saudiDate);

      // Check for API key not configured
      if (response.error === 'API_KEY_NOT_CONFIGURED') {
        apiKeyConfiguredRef.current = false;
        setFetchState(false, 'مفتاح API غير مُعد - يرجى إعداد API_FOOTBALL_KEY في Netlify', null);
        return;
      }

      // Check for invalid response (Netlify functions not deployed)
      if (response.error === 'INVALID_RESPONSE') {
        apiKeyConfiguredRef.current = null;
        setFetchState(false, 'Netlify Functions غير منشورة - تأكد من نشر الموقع مع Functions', null);
        return;
      }

      if (response.error === 'NETWORK_ERROR') {
        setFetchState(false, 'خطأ في الاتصال بالخادم', null);
        return;
      }

      apiKeyConfiguredRef.current = true;

      if (response.success && response.fixtures.length > 0) {
        const processed = processFixtures(response.fixtures);

        // Extract only finished match results
        const autoResults: Record<number, { homeGoals: number; awayGoals: number; homePenalties?: number; awayPenalties?: number }> = {};
        const liveStatuses: Record<number, string> = {};
        const liveScoreMap: Record<number, LiveScore> = {};

        for (const [matchIdStr, data] of Object.entries(processed)) {
          const matchId = parseInt(matchIdStr);
          if (isMatchFinished(data.status as MatchStatusAPI)) {
            autoResults[matchId] = data.result;
          }
          if (isMatchLive(data.status as MatchStatusAPI)) {
            liveStatuses[matchId] = data.status;
            // Store live score from fixture data
            liveScoreMap[matchId] = fixtureToLiveScore(data.fixture);
          }
        }

        // Apply auto-results
        if (Object.keys(autoResults).length > 0) {
          setAutoResults(autoResults);
        }
        setLiveMatchStatuses(liveStatuses);
        setLiveScores(liveScoreMap);
      }

      setFetchState(false, null, Date.now());
    } catch (error) {
      setFetchState(false, 'فشل في جلب النتائج', null);
    }
  }, [isFetching, setAutoResults, setFetchState, setLiveMatchStatuses, setLiveScores]);

  // Fetch live matches specifically
  const fetchLive = useCallback(async () => {
    try {
      const response = await fetchLiveMatches();

      // Don't update state if API key not configured
      if (response.error === 'API_KEY_NOT_CONFIGURED' || response.error === 'INVALID_RESPONSE') {
        return;
      }

      if (response.success && response.fixtures.length > 0) {
        const processed = processFixtures(response.fixtures);
        const liveStatuses: Record<number, string> = {};
        const autoResults: Record<number, any> = {};
        const liveScoreMap: Record<number, LiveScore> = {};

        for (const [matchIdStr, data] of Object.entries(processed)) {
          const matchId = parseInt(matchIdStr);
          if (isMatchFinished(data.status as MatchStatusAPI)) {
            autoResults[matchId] = data.result;
          }
          // Store status for both live AND recently finished matches
          liveStatuses[matchId] = data.status;
          // Store live score for live matches
          if (isMatchLive(data.status as MatchStatusAPI)) {
            liveScoreMap[matchId] = fixtureToLiveScore(data.fixture);
          }
        }

        if (Object.keys(autoResults).length > 0) {
          setAutoResults(autoResults);
        }
        setLiveMatchStatuses(liveStatuses);
        setLiveScores(liveScoreMap);
      }
    } catch {
      // Silently fail for live checks
    }
  }, [setAutoResults, setLiveMatchStatuses, setLiveScores]);

  // Start/stop auto-fetching based on enabled state
  useEffect(() => {
    if (!autoResultsEnabled || !mountedRef.current) return;

    // Initial fetch
    fetchAndProcess();

    // Set up periodic fetching
    // Full fetch every 5 minutes
    intervalRef.current = setInterval(() => {
      fetchAndProcess();
    }, 5 * 60 * 1000);

    // Live check every 60 seconds when matches are active
    liveCheckRef.current = setInterval(() => {
      if (hasActiveOrUpcomingMatches()) {
        fetchLive();
      }
    }, 60 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (liveCheckRef.current) clearInterval(liveCheckRef.current);
    };
  }, [autoResultsEnabled, fetchAndProcess, fetchLive]);

  // Mark as mounted
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
      if (enabled) {
        fetchAndProcess();
      }
    },
    refreshNow: fetchAndProcess,
  };
}
