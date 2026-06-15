// Auto-Results Service: Fetches comprehensive match data from API-Football
// Supports: Netlify Functions proxy OR direct API calls (for local dev)

import { MATCHES, TEAMS } from './wc2026-data';
import { MatchResult } from './wc2026-logic';

// API fixture status codes
export type MatchStatusAPI = 'NS' | '1H' | 'HT' | '2H' | 'ET' | 'BT' | 'P' | 'SUSP' | 'INT' | 'FT' | 'AET' | 'PEN' | 'PST' | 'CANC' | 'ABD' | 'AWD' | 'WO' | 'LIVE';

export interface MatchEvent {
  time: { elapsed: number; extra: number | null };
  type: string;
  detail: string;
  team: { name: string; id: number; logo?: string };
  player: { name: string | null; id: number | null };
  assist: { name: string | null; id: number | null };
  comments?: string;
}

export interface MatchLineup {
  team: { name: string; id: number; logo?: string };
  formation: string;
  startXI: { player: { name: string; number: number; pos: string; grid?: string } }[];
  substitutes: { player: { name: string; number: number; pos: string; grid?: string } }[];
  coach?: string;
}

export interface MatchStats {
  team: { name: string; id: number; logo?: string };
  statistics: { type: string; value: string | number | null }[];
}

export interface APIFixture {
  id: number;
  date: string;
  timestamp?: number;
  status: MatchStatusAPI;
  statusLong?: string;
  elapsed?: number;
  homeTeam: string;
  awayTeam: string;
  homeTeamId?: number;
  awayTeamId?: number;
  homeLogo?: string;
  awayLogo?: string;
  homeWinner?: boolean | null;
  awayWinner?: boolean | null;
  goalsHome: number | null;
  goalsAway: number | null;
  scoreHalftimeHome?: number | null;
  scoreHalftimeAway?: number | null;
  scoreFulltimeHome: number | null;
  scoreFulltimeAway: number | null;
  scoreExtratimeHome: number | null;
  scoreExtratimeAway: number | null;
  scorePenaltyHome: number | null;
  scorePenaltyAway: number | null;
  round?: string;
  venueName?: string;
  venueCity?: string;
  venueId?: number;
  referee?: string;
  leagueId?: number;
  leagueName?: string;
  events?: MatchEvent[];
  lineups?: MatchLineup[];
  statistics?: MatchStats[];
}

export interface APIStandingsGroup {
  rank: number;
  team: { name: string; id: number; logo: string };
  points: number;
  all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
  form: string;
  goalsDiff: number;
  description: string | null;
}

export interface APIStandings {
  league: { id: number; name: string; logo: string; flag: string };
  groups: APIStandingsGroup[][];
}

export interface APIResponse {
  success: boolean;
  count: number;
  fixtures: APIFixture[];
  error?: string;
  message?: string;
  standings?: APIStandings | null;
}

export interface APIFixtureDetail {
  success: boolean;
  fixture: APIFixture | null;
  events: MatchEvent[];
  lineups: MatchLineup[];
  statistics: MatchStats[];
  error?: string;
  message?: string;
}

// Team name mapping
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

const API_TO_OUR_NAME: Record<string, string> = {};
for (const [ourName, aliases] of Object.entries(TEAM_NAME_ALIASES)) {
  for (const alias of aliases) API_TO_OUR_NAME[alias.toLowerCase()] = ourName;
}
for (const teamName of Object.keys(TEAMS)) API_TO_OUR_NAME[teamName.toLowerCase()] = teamName;

function normalizeTeamName(apiName: string): string | null {
  const lower = apiName.toLowerCase().trim();
  if (API_TO_OUR_NAME[lower]) return API_TO_OUR_NAME[lower];
  for (const [key, value] of Object.entries(API_TO_OUR_NAME)) {
    if (lower.includes(key) || key.includes(lower)) return value;
  }
  return null;
}

export function isMatchFinished(status: MatchStatusAPI): boolean {
  return ['FT', 'AET', 'PEN', 'AWD', 'WO'].includes(status);
}

export function isMatchLive(status: MatchStatusAPI): boolean {
  return ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE'].includes(status);
}

export function matchFixtureToOurMatch(fixture: APIFixture): number | null {
  const homeTeam = normalizeTeamName(fixture.homeTeam);
  const awayTeam = normalizeTeamName(fixture.awayTeam);
  if (!homeTeam || !awayTeam) return null;
  const match = MATCHES.find(m => m.team1 === homeTeam && m.team2 === awayTeam);
  return match?.id || null;
}

export function extractResult(fixture: APIFixture): MatchResult | null {
  if (!isMatchFinished(fixture.status)) return null;
  let homeGoals = fixture.scoreFulltimeHome;
  let awayGoals = fixture.scoreFulltimeAway;
  if (homeGoals === null || awayGoals === null) { homeGoals = fixture.goalsHome; awayGoals = fixture.goalsAway; }
  if (homeGoals === null || awayGoals === null) return null;
  const result: MatchResult = { homeGoals, awayGoals };
  if (fixture.status === 'PEN' || fixture.scorePenaltyHome !== null) {
    if (fixture.scorePenaltyHome !== null && fixture.scorePenaltyAway !== null) {
      result.homePenalties = fixture.scorePenaltyHome;
      result.awayPenalties = fixture.scorePenaltyAway;
    }
  }
  return result;
}

async function safeParseJSON<T>(response: Response): Promise<T | null> {
  try {
    const text = await response.text();
    const trimmed = text.trim();
    if (trimmed.startsWith('<') || trimmed.startsWith('<!DOCTYPE')) return null;
    return JSON.parse(trimmed) as T;
  } catch { return null; }
}

// === DIRECT API ACCESS (for local dev when Netlify Functions are unavailable) ===

const API_DIRECT_BASE = 'https://v3.football.api-sports.io';
const API_RAPIDAPI_BASE = 'https://api-football-v1.p.rapidapi.com/v3';
const API_HOST = 'v3.football.api-sports.io';

// Key type stored alongside the key in localStorage
export type ApiKeyType = 'apisports' | 'rapidapi';

export interface ApiKeyInfo {
  key: string;
  type: ApiKeyType;
}

function getDirectApiKeyInfo(): ApiKeyInfo | null {
  if (typeof window === 'undefined') return null;
  // Priority: localStorage user-entered key > env var
  const localKey = localStorage.getItem('wc2026-api-key');
  if (localKey) {
    const keyType = (localStorage.getItem('wc2026-api-key-type') || 'apisports') as ApiKeyType;
    return { key: localKey, type: keyType };
  }
  const envKey = process.env.NEXT_PUBLIC_API_FOOTBALL_KEY || null;
  if (envKey) return { key: envKey, type: 'apisports' };
  return null;
}

function getDirectApiKey(): string | null {
  const info = getDirectApiKeyInfo();
  return info?.key || null;
}

function isNetlifyFunctionsAvailable(): boolean {
  return typeof window !== 'undefined';
}

// Result from direct API fetch - includes error info instead of silently returning null
export interface DirectApiResult {
  data: any;
  error: string | null;
  httpStatus?: number;
}

// Direct API fetch (bypasses Netlify Functions) - now returns errors instead of null
async function directApiFetch(endpoint: string, keyInfo?: ApiKeyInfo | null): Promise<DirectApiResult> {
  const info = keyInfo !== undefined ? keyInfo : getDirectApiKeyInfo();
  if (!info) return { data: null, error: 'NO_API_KEY' };

  const isRapidApi = info.type === 'rapidapi';
  const baseUrl = isRapidApi ? API_RAPIDAPI_BASE : API_DIRECT_BASE;

  const headers: Record<string, string> = {};
  if (isRapidApi) {
    headers['X-RapidAPI-Key'] = info.key;
    headers['X-RapidAPI-Host'] = 'api-football-v1.p.rapidapi.com';
  } else {
    headers['x-apisports-key'] = info.key;
  }

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      let errorBody = '';
      try { errorBody = await response.text(); } catch { /* ignore */ }
      const errorMsg = errorBody.substring(0, 300);

      // If api-sports.io returns 403, try RapidAPI automatically (only for /status test)
      if (!isRapidApi && response.status === 403 && endpoint === '/status') {
        console.log('[auto-results] api-sports.io returned 403, trying RapidAPI...');
        const rapidResult = await directApiFetch(endpoint, { key: info.key, type: 'rapidapi' });
        if (rapidResult.data && !rapidResult.error) {
          localStorage.setItem('wc2026-api-key-type', 'rapidapi');
          return rapidResult;
        }
      }

      // Parse the error for common messages
      if (response.status === 403) {
        return { data: null, error: 'SUBSCRIPTION_ERROR: المفتاح غير مفعّل أو غير مشترك في API-Football. تأكد من تفعيل الاشتراك المجاني على api-sports.io', httpStatus: 403 };
      }
      if (response.status === 401) {
        return { data: null, error: 'INVALID_KEY: مفتاح API غير صحيح. تحقق من نسخ المفتاح بالكامل', httpStatus: 401 };
      }
      if (response.status === 429) {
        return { data: null, error: 'RATE_LIMIT: تم تجاوز حد الطلبات (100/يوم). حاول غداً', httpStatus: 429 };
      }

      return { data: null, error: `HTTP_${response.status}: ${errorMsg}`, httpStatus: response.status };
    }

    const data = await response.json();
    // Check for API-level errors
    if (data.errors && Object.keys(data.errors).length > 0) {
      const errMsg = Object.values(data.errors).join(', ');
      console.error('[auto-results] API errors:', errMsg);

      if (errMsg.includes('not subscribed') || errMsg.includes('plan')) {
        return { data: null, error: 'SUBSCRIPTION_ERROR: الاشتراك لا يشمل هذا API. فعّل الاشتراك المجاني على api-sports.io أو استخدم مفتاح RapidAPI', httpStatus: 403 };
      }
      if (errMsg.includes('season')) {
        return { data: null, error: `SEASON_NOT_ACCESSIBLE: ${errMsg}`, httpStatus: 200 };
      }

      return { data: null, error: errMsg };
    }
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: `NETWORK_ERROR: ${err.message || 'فشل الاتصال'}` };
  }
}

// Test API key - validates that the key works
export async function testApiKey(key: string, keyType: ApiKeyType = 'apisports'): Promise<{ valid: boolean; error: string | null; accountInfo?: any; detectedType?: ApiKeyType }> {
  const isRapidApi = keyType === 'rapidapi';
  const baseUrl = isRapidApi ? API_RAPIDAPI_BASE : API_DIRECT_BASE;

  const headers: Record<string, string> = {};
  if (isRapidApi) {
    headers['X-RapidAPI-Key'] = key;
    headers['X-RapidAPI-Host'] = 'api-football-v1.p.rapidapi.com';
  } else {
    headers['x-apisports-key'] = key;
  }

  try {
    const response = await fetch(`${baseUrl}/status`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      // If api-sports.io fails, auto-try RapidAPI
      if (!isRapidApi && (response.status === 403 || response.status === 401)) {
        const rapidTest = await testApiKey(key, 'rapidapi');
        if (rapidTest.valid) {
          rapidTest.detectedType = 'rapidapi';
          return rapidTest;
        }
      }
      if (response.status === 403) return { valid: false, error: 'المفتاح غير مشترك في API-Football. فعّل الاشتراك المجاني على api-sports.io' };
      if (response.status === 401) return { valid: false, error: 'مفتاح API غير صحيح' };
      return { valid: false, error: `خطأ HTTP ${response.status}` };
    }

    const data = await response.json();
    if (data.errors && Object.keys(data.errors).length > 0) {
      const errMsg = Object.values(data.errors).join(', ');
      // If api-sports.io has subscription error, try RapidAPI
      if (!isRapidApi && (errMsg.includes('not subscribed') || errMsg.includes('plan'))) {
        const rapidTest = await testApiKey(key, 'rapidapi');
        if (rapidTest.valid) {
          rapidTest.detectedType = 'rapidapi';
          return rapidTest;
        }
      }
      return { valid: false, error: errMsg };
    }

    const account = data.response?.account;
    const subscription = data.response?.subscription;
    const requests = data.response?.requests;

    return {
      valid: true,
      error: null,
      accountInfo: {
        firstName: account?.firstname,
        lastName: account?.lastname,
        plan: subscription?.plan,
        endDate: subscription?.end,
        requestsToday: requests?.current,
        requestsLimit: requests?.limit_day,
      },
    };
  } catch (err: any) {
    return { valid: false, error: `فشل الاتصال: ${err.message}` };
  }
}

// Save API key to localStorage
export function saveApiKey(key: string, keyType: ApiKeyType = 'apisports'): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('wc2026-api-key', key);
  localStorage.setItem('wc2026-api-key-type', keyType);
}

// Remove API key from localStorage
export function removeApiKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('wc2026-api-key');
  localStorage.removeItem('wc2026-api-key-type');
}

// Get current API key info
export function getApiKeyInfo(): ApiKeyInfo | null {
  return getDirectApiKeyInfo();
}

function mapDirectFixture(fixture: any): APIFixture {
  const f = fixture.fixture;
  const teams = fixture.teams;
  const goals = fixture.goals;
  const score = fixture.score;
  return {
    id: f.id,
    date: f.date,
    timestamp: f.timestamp,
    status: f.status.short,
    statusLong: f.status.long,
    elapsed: f.status.elapsed,
    homeTeam: teams.home.name,
    awayTeam: teams.away.name,
    homeTeamId: teams.home.id,
    awayTeamId: teams.away.id,
    homeLogo: teams.home.logo,
    awayLogo: teams.away.logo,
    homeWinner: teams.home.winner,
    awayWinner: teams.away.winner,
    goalsHome: goals.home,
    goalsAway: goals.away,
    scoreHalftimeHome: score.halftime?.home ?? null,
    scoreHalftimeAway: score.halftime?.away ?? null,
    scoreFulltimeHome: score.fulltime.home,
    scoreFulltimeAway: score.fulltime.away,
    scoreExtratimeHome: score.extratime?.home ?? null,
    scoreExtratimeAway: score.extratime?.away ?? null,
    scorePenaltyHome: score.penalty?.home ?? null,
    scorePenaltyAway: score.penalty?.away ?? null,
    round: fixture.league.round,
    venueName: f.venue?.name,
    venueCity: f.venue?.city,
    referee: f.referee,
    leagueId: fixture.league.id,
    leagueName: fixture.league.name,
  };
}

// Fetch results - tries direct API first, then Netlify Functions
export async function fetchResults(date?: string, includeStandings?: boolean): Promise<APIResponse> {
  const apiKeyInfo = getDirectApiKeyInfo();
  if (apiKeyInfo) {
    try {
      let endpoint: string;
      if (date) {
        endpoint = `/fixtures?date=${date}`;
      } else {
        endpoint = `/fixtures?league=1&season=2026`;
      }
      const result = await directApiFetch(endpoint);

      // If direct API returned an error, propagate it
      if (result.error) {
        if (result.error === 'NO_API_KEY') {
          // Fall through to Netlify Functions
        } else if (result.error.startsWith('SUBSCRIPTION_ERROR')) {
          return { success: false, count: 0, fixtures: [], error: 'SUBSCRIPTION_ERROR', message: result.error.replace('SUBSCRIPTION_ERROR: ', '') };
        } else if (result.error.startsWith('INVALID_KEY')) {
          return { success: false, count: 0, fixtures: [], error: 'INVALID_KEY', message: result.error.replace('INVALID_KEY: ', '') };
        } else if (result.error.startsWith('RATE_LIMIT')) {
          return { success: false, count: 0, fixtures: [], error: 'RATE_LIMIT', message: result.error.replace('RATE_LIMIT: ', '') };
        } else if (result.error.startsWith('SEASON_NOT_ACCESSIBLE')) {
          return { success: false, count: 0, fixtures: [], error: 'SEASON_NOT_ACCESSIBLE', message: result.error.replace('SEASON_NOT_ACCESSIBLE: ', '') };
        } else if (result.error.startsWith('NETWORK_ERROR')) {
          // Fall through to try Netlify Functions
        } else {
          return { success: false, count: 0, fixtures: [], error: 'API_ERROR', message: result.error };
        }
      }

      if (result.data) {
        // If date-based query, filter for World Cup league only
        let rawFixtures = result.data.response || [];
        if (date && rawFixtures.length > 0) {
          rawFixtures = rawFixtures.filter((f: any) => f.league?.id === 1);
        }
        const fixtures = rawFixtures.map(mapDirectFixture);

        // Fetch standings if requested (may fail on free plan)
        let standings = null;
        if (includeStandings) {
          try {
            const standingsResult = await directApiFetch('/standings?league=1&season=2026');
            if (standingsResult.data?.response?.[0]?.league) {
              const league = standingsResult.data.response[0].league;
              standings = {
                league: { id: league.id, name: league.name, logo: league.logo, flag: league.flag },
                groups: (league.standings || []).map((group: any) => group.map((team: any) => ({
                  rank: team.rank,
                  team: { name: team.team.name, id: team.team.id, logo: team.team.logo },
                  points: team.points,
                  all: team.all,
                  form: team.form,
                  goalsDiff: team.goalsDiff,
                  description: team.description,
                }))),
              };
            }
          } catch { /* standings not available on free plan */ }
        }

        return { success: true, count: fixtures.length, fixtures, standings };
      }
    } catch (error) {
      console.error('[auto-results] Direct API fetch failed:', error);
    }
  }

  // Try Netlify Functions as fallback
  try {
    let url = '/.netlify/functions/fetch-results';
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    if (includeStandings) params.set('include', 'standings');
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (response.ok) {
      const data = await safeParseJSON<APIResponse>(response);
      if (data) {
        if (data.success || data.error) return data;
      }
    }
  } catch { /* Fall through */ }

  // No API key and no Netlify Functions
  return { success: false, count: 0, fixtures: [], error: 'API_KEY_NOT_CONFIGURED', message: 'أضف مفتاح API-Football في الإعدادات للاتصال المباشر' };
}

// Fetch live matches - tries direct API first, then Netlify Functions
export async function fetchLiveMatches(): Promise<APIResponse> {
  const apiKeyInfo = getDirectApiKeyInfo();
  if (apiKeyInfo) {
    try {
      const now = new Date();
      const today = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' });
      const result = await directApiFetch(`/fixtures?date=${today}`);

      // If direct API returned an error, propagate it
      if (result.error && result.error !== 'NO_API_KEY') {
        if (result.error.startsWith('SUBSCRIPTION_ERROR')) {
          return { success: false, count: 0, fixtures: [], error: 'SUBSCRIPTION_ERROR', message: result.error.replace('SUBSCRIPTION_ERROR: ', '') };
        }
        if (result.error.startsWith('INVALID_KEY')) {
          return { success: false, count: 0, fixtures: [], error: 'INVALID_KEY', message: result.error.replace('INVALID_KEY: ', '') };
        }
        // For other errors, fall through to Netlify Functions
      }

      if (result.data) {
        // Filter for World Cup league AND live status
        const liveStatuses = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE'];
        const wcLive = (result.data.response || [])
          .filter((f: any) => f.league?.id === 1 && liveStatuses.includes(f.fixture?.status?.short))
          .map(mapDirectFixture);

        // Also fetch events for each live fixture (up to 5)
        for (const fixture of wcLive.slice(0, 5)) {
          try {
            const eventsResult = await directApiFetch(`/fixtures/events?fixture=${fixture.id}`);
            if (eventsResult.data?.response) {
              fixture.events = eventsResult.data.response.map((e: any) => ({
                time: { elapsed: e.time.elapsed, extra: e.time.extra },
                type: e.type,
                detail: e.detail,
                team: { name: e.team.name, id: e.team.id, logo: e.team.logo },
                player: { name: e.player.name, id: e.player.id },
                assist: { name: e.assist.name, id: e.assist.id },
                comments: e.comments,
              }));
            }
          } catch { /* Skip events for this fixture */ }
        }

        return { success: true, count: wcLive.length, fixtures: wcLive };
      }
    } catch (error) {
      console.error('[auto-results] Direct live fetch failed:', error);
    }
  }

  // Try Netlify Functions as fallback
  try {
    const url = '/.netlify/functions/fetch-live?stats=true';
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (response.ok) {
      const data = await safeParseJSON<APIResponse>(response);
      if (data && (data.success || data.error)) return data;
    }
  } catch { /* Fall through */ }

  if (!apiKeyInfo) return { success: false, count: 0, fixtures: [], error: 'API_KEY_NOT_CONFIGURED' };
  return { success: false, count: 0, fixtures: [], error: 'API_ERROR' };
}

// Fetch single fixture detail - tries Netlify Functions first, falls back to direct API
export async function fetchFixtureDetail(fixtureId: number): Promise<APIFixtureDetail> {
  // Try Netlify Functions first
  try {
    const url = `/.netlify/functions/fetch-results?fixture=${fixtureId}&include=events,lineups,statistics`;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (response.ok) {
      const data = await safeParseJSON<APIFixtureDetail>(response);
      if (data && data.success) return data;
    }
  } catch { /* Fall through */ }

  // Direct API fallback
  const apiKeyInfo = getDirectApiKeyInfo();
  if (!apiKeyInfo) return { success: false, fixture: null, events: [], lineups: [], statistics: [], error: 'API_KEY_NOT_CONFIGURED' };

  try {
    const fixtureResult = await directApiFetch(`/fixtures?id=${fixtureId}`);
    if (fixtureResult.error) {
      return { success: false, fixture: null, events: [], lineups: [], statistics: [], error: fixtureResult.error };
    }
    if (!fixtureResult.data?.response?.[0]) return { success: false, fixture: null, events: [], lineups: [], statistics: [], error: 'NOT_FOUND' };

    const fixture = mapDirectFixture(fixtureResult.data.response[0]);

    // Fetch events
    try {
      const eventsResult = await directApiFetch(`/fixtures/events?fixture=${fixtureId}`);
      if (eventsResult.data?.response) {
        fixture.events = eventsResult.data.response.map((e: any) => ({
          time: { elapsed: e.time.elapsed, extra: e.time.extra },
          type: e.type, detail: e.detail,
          team: { name: e.team.name, id: e.team.id, logo: e.team.logo },
          player: { name: e.player.name, id: e.player.id },
          assist: { name: e.assist.name, id: e.assist.id },
          comments: e.comments,
        }));
      }
    } catch { /* Skip */ }

    // Fetch lineups
    try {
      const lineupsResult = await directApiFetch(`/fixtures/lineups?fixture=${fixtureId}`);
      if (lineupsResult.data?.response) {
        fixture.lineups = lineupsResult.data.response.map((l: any) => ({
          team: { name: l.team.name, id: l.team.id, logo: l.team.logo },
          formation: l.formation,
          startXI: l.startXI.map((p: any) => ({ player: { name: p.player.name, number: p.player.number, pos: p.player.pos, grid: p.player.grid } })),
          substitutes: l.substitutes.map((p: any) => ({ player: { name: p.player.name, number: p.player.number, pos: p.player.pos, grid: p.player.grid } })),
          coach: l.coach?.name,
        }));
      }
    } catch { /* Skip */ }

    // Fetch statistics
    try {
      const statsResult = await directApiFetch(`/fixtures/statistics?fixture=${fixtureId}`);
      if (statsResult.data?.response) {
        fixture.statistics = statsResult.data.response.map((s: any) => ({
          team: { name: s.team.name, id: s.team.id, logo: s.team.logo },
          statistics: s.statistics.map((st: any) => ({ type: st.type, value: st.value })),
        }));
      }
    } catch { /* Skip */ }

    return {
      success: true, fixture, events: fixture.events || [],
      lineups: fixture.lineups || [], statistics: fixture.statistics || [],
    };
  } catch (error) {
    return { success: false, fixture: null, events: [], lineups: [], statistics: [], error: 'NETWORK_ERROR' };
  }
}

// Process all fixtures
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

export function getEventTypeAr(event: MatchEvent): string {
  if (event.type === 'Goal') {
    if (event.detail === 'Normal Goal') return 'هدف';
    if (event.detail === 'Own Goal') return 'هدف عكسي';
    if (event.detail === 'Penalty') return 'ركلة جزاء';
    if (event.detail === 'Missed Penalty') return 'ركلة جزاء ضائعة';
    return 'هدف';
  }
  if (event.type === 'Card') {
    if (event.detail === 'Yellow Card') return 'بطاقة صفراء';
    if (event.detail === 'Red Card') return 'بطاقة حمراء';
    if (event.detail === 'Second Yellow Card') return 'بطاقة صفراء ثانية';
    return 'بطاقة';
  }
  if (event.type === 'subst') return 'تبديل';
  if (event.type === 'Var') return 'VAR';
  return event.type;
}

export function getEventIcon(event: MatchEvent): string {
  if (event.type === 'Goal') return '⚽';
  if (event.type === 'Card') {
    if (event.detail === 'Red Card' || event.detail === 'Second Yellow Card') return '🟥';
    return '🟨';
  }
  if (event.type === 'subst') return '🔄';
  if (event.type === 'Var') return '📺';
  return '📌';
}

export function getStatTypeAr(type: string): string {
  const map: Record<string, string> = {
    'Shots on Goal': 'تسديدات على المرمى', 'Shots off Goal': 'تسديدات خارج المرمى',
    'Total Shots': 'إجمالي التسديدات', 'Blocked Shots': 'تسديدات محظورة',
    'Fouls': 'أخطاء', 'Corner Kicks': 'ركنيات', 'Offsides': 'تسلل',
    'Ball Possession': 'الاستحواذ', 'Yellow Cards': 'بطاقات صفراء',
    'Red Cards': 'بطاقات حمراء', 'Goalkeeper Saves': 'تصديات الحارس',
    'Total passes': 'إجمالي التمريرات', 'Passes accurate': 'تمريرات دقيقة',
    'Passes %': 'نسبة التمرير',
  };
  return map[type] || type;
}
