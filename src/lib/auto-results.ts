// Auto-Results Service: Fetches match results from API-Football via Netlify function
// and maps them to our local match data

import { MATCHES, TEAMS } from './wc2026-data';
import { MatchResult } from './wc2026-logic';

// API fixture status codes
// NS = Not Started, 1H = First Half, HT = Halftime, 2H = Second Half
// ET = Extra Time, BT = Break Time, P = Penalty, SUSP = Suspended
// INT = Interrupted, FT = Full Time, AET = After Extra Time, PEN = After Penalty
// PST = Postponed, CANC = Cancelled, ABD = Abandoned, AWD = Awarded, WO = WalkOver
// LIVE = In Progress

export type MatchStatusAPI = 'NS' | '1H' | 'HT' | '2H' | 'ET' | 'BT' | 'P' | 'SUSP' | 'INT' | 'FT' | 'AET' | 'PEN' | 'PST' | 'CANC' | 'ABD' | 'AWD' | 'WO' | 'LIVE';

export interface APIFixture {
  id: number;
  date: string;
  status: MatchStatusAPI;
  statusLong?: string;
  elapsed?: number;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  goalsHome: number | null;
  goalsAway: number | null;
  scoreFulltimeHome: number | null;
  scoreFulltimeAway: number | null;
  scoreExtratimeHome: number | null;
  scoreExtratimeAway: number | null;
  scorePenaltyHome: number | null;
  scorePenaltyAway: number | null;
  round?: string;
  venue?: string;
}

export interface APIResponse {
  success: boolean;
  count: number;
  fixtures: APIFixture[];
  error?: string;
  message?: string;
}

// Team name mapping: our name → possible API names
const TEAM_NAME_ALIASES: Record<string, string[]> = {
  'Korea Republic': ['South Korea', 'Korea Republic', 'Korea Rep.'],
  'IR Iran': ['Iran', 'IR Iran', 'Islamic Rep. of Iran'],
  "Côte d'Ivoire": ["Cote d'Ivoire", 'Ivory Coast', "Côte d'Ivoire"],
  'Curaçao': ['Curacao', 'Curaçao'],
  'Cabo Verde': ['Cape Verde', 'Cabo Verde'],
  'Congo DR': ['DR Congo', 'Congo DR', 'Dem. Rep. Congo'],
  'United States': ['USA', 'United States', 'United States of America'],
  'Türkiye': ['Turkey', 'Türkiye'],
  'Scotland': ['Scotland'],
  'England': ['England'],
  'Bosnia and Herzegovina': ['Bosnia and Herz.', 'Bosnia and Herzegovina', 'Bosnia'],
};

// Build reverse mapping: API name → our name
const API_TO_OUR_NAME: Record<string, string> = {};
for (const [ourName, aliases] of Object.entries(TEAM_NAME_ALIASES)) {
  for (const alias of aliases) {
    API_TO_OUR_NAME[alias.toLowerCase()] = ourName;
  }
}
// Also add direct mappings for all teams
for (const teamName of Object.keys(TEAMS)) {
  API_TO_OUR_NAME[teamName.toLowerCase()] = teamName;
}

function normalizeTeamName(apiName: string): string | null {
  const lower = apiName.toLowerCase().trim();
  if (API_TO_OUR_NAME[lower]) return API_TO_OUR_NAME[lower];

  // Try partial matching
  for (const [key, value] of Object.entries(API_TO_OUR_NAME)) {
    if (lower.includes(key) || key.includes(lower)) return value;
  }

  return null;
}

// Check if a match is finished based on API status
export function isMatchFinished(status: MatchStatusAPI): boolean {
  return ['FT', 'AET', 'PEN', 'AWD', 'WO'].includes(status);
}

// Check if a match is live
export function isMatchLive(status: MatchStatusAPI): boolean {
  return ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE'].includes(status);
}

// Map API fixture to our match ID
export function matchFixtureToOurMatch(fixture: APIFixture): number | null {
  const homeTeam = normalizeTeamName(fixture.homeTeam);
  const awayTeam = normalizeTeamName(fixture.awayTeam);

  if (!homeTeam || !awayTeam) return null;

  // Find match by team names
  const match = MATCHES.find(m => {
    // For group stage, direct match
    if (m.round === 'group') {
      return m.team1 === homeTeam && m.team2 === awayTeam;
    }
    // For knockout, we can't easily match since teams aren't determined yet
    // But if both teams are actual team names (not refs), try to match
    return m.team1 === homeTeam && m.team2 === awayTeam;
  });

  return match?.id || null;
}

// Extract match result from API fixture
export function extractResult(fixture: APIFixture): MatchResult | null {
  if (!isMatchFinished(fixture.status)) return null;

  let homeGoals = fixture.scoreFulltimeHome;
  let awayGoals = fixture.scoreFulltimeAway;

  // If full time score is null but goals are available
  if (homeGoals === null || awayGoals === null) {
    homeGoals = fixture.goalsHome;
    awayGoals = fixture.goalsAway;
  }

  if (homeGoals === null || awayGoals === null) return null;

  const result: MatchResult = {
    homeGoals,
    awayGoals,
  };

  // Add penalty scores if applicable
  if (fixture.status === 'PEN' || fixture.scorePenaltyHome !== null) {
    if (fixture.scorePenaltyHome !== null && fixture.scorePenaltyAway !== null) {
      result.homePenalties = fixture.scorePenaltyHome;
      result.awayPenalties = fixture.scorePenaltyAway;
    }
  }

  return result;
}

/**
 * Safely parse JSON from a fetch response.
 * Returns null if the response is not valid JSON (e.g., HTML error page).
 */
async function safeParseJSON(response: Response): Promise<APIResponse | null> {
  try {
    const text = await response.text();
    // Quick check: if it starts with '<', it's HTML, not JSON
    const trimmed = text.trim();
    if (trimmed.startsWith('<') || trimmed.startsWith('<!DOCTYPE')) {
      console.warn('[auto-results] Received HTML instead of JSON - API endpoint may not be deployed');
      return null;
    }
    return JSON.parse(trimmed) as APIResponse;
  } catch {
    console.warn('[auto-results] Failed to parse response as JSON');
    return null;
  }
}

// Fetch results from Netlify function
export async function fetchResults(date?: string): Promise<APIResponse> {
  try {
    let url = '/.netlify/functions/fetch-results';
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url);

    // Check if response is OK and is JSON
    if (!response.ok) {
      console.warn('[auto-results] fetch-results returned status:', response.status);
      return { success: false, count: 0, fixtures: [], error: `HTTP_${response.status}` };
    }

    const data = await safeParseJSON(response);
    if (!data) {
      return { success: false, count: 0, fixtures: [], error: 'INVALID_RESPONSE', message: 'الخادم لم يُعد بشكل صحيح - تأكد من نشر Netlify Functions' };
    }

    return data;
  } catch (error) {
    console.error('[auto-results] Failed to fetch results:', error);
    return { success: false, count: 0, fixtures: [], error: 'NETWORK_ERROR', message: 'خطأ في الاتصال' };
  }
}

// Fetch live matches from Netlify function
export async function fetchLiveMatches(): Promise<APIResponse> {
  try {
    const url = '/.netlify/functions/fetch-live';
    const response = await fetch(url);

    if (!response.ok) {
      console.warn('[auto-results] fetch-live returned status:', response.status);
      return { success: false, count: 0, fixtures: [], error: `HTTP_${response.status}` };
    }

    const data = await safeParseJSON(response);
    if (!data) {
      return { success: false, count: 0, fixtures: [], error: 'INVALID_RESPONSE', message: 'الخادم لم يُعد بشكل صحيح' };
    }

    return data;
  } catch (error) {
    console.error('[auto-results] Failed to fetch live matches:', error);
    return { success: false, count: 0, fixtures: [], error: 'NETWORK_ERROR', message: 'خطأ في الاتصال' };
  }
}

// Process all fixtures and return mapped results
export function processFixtures(fixtures: APIFixture[]): Record<number, { result: MatchResult; status: MatchStatusAPI; fixture: APIFixture }> {
  const mapped: Record<number, { result: MatchResult; status: MatchStatusAPI; fixture: APIFixture }> = {};

  for (const fixture of fixtures) {
    const matchId = matchFixtureToOurMatch(fixture);
    if (matchId === null) continue;

    const result = extractResult(fixture);
    if (result || isMatchLive(fixture.status)) {
      mapped[matchId] = {
        result: result || { homeGoals: fixture.goalsHome || 0, awayGoals: fixture.goalsAway || 0 },
        status: fixture.status,
        fixture,
      };
    }
  }

  return mapped;
}
