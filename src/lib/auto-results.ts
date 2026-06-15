// Auto-Results Service: Fetches comprehensive match data from API-Football via Netlify function
// Includes: results, events (goals/cards/subs), lineups, statistics, standings

import { MATCHES, TEAMS } from './wc2026-data';
import { MatchResult } from './wc2026-logic';

// API fixture status codes
export type MatchStatusAPI = 'NS' | '1H' | 'HT' | '2H' | 'ET' | 'BT' | 'P' | 'SUSP' | 'INT' | 'FT' | 'AET' | 'PEN' | 'PST' | 'CANC' | 'ABD' | 'AWD' | 'WO' | 'LIVE';

// === API Data Types ===

export interface MatchEvent {
  time: { elapsed: number; extra: number | null };
  type: string;       // Goal, Card, subst
  detail: string;     // Normal Goal, Own Goal, Penalty, Yellow Card, Red Card, etc.
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
  // Enhanced data (from live/detail fetch)
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

// Single fixture detail response
export interface APIFixtureDetail {
  success: boolean;
  fixture: APIFixture | null;
  events: MatchEvent[];
  lineups: MatchLineup[];
  statistics: MatchStats[];
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
for (const teamName of Object.keys(TEAMS)) {
  API_TO_OUR_NAME[teamName.toLowerCase()] = teamName;
}

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

  const match = MATCHES.find(m => {
    if (m.round === 'group') {
      return m.team1 === homeTeam && m.team2 === awayTeam;
    }
    return m.team1 === homeTeam && m.team2 === awayTeam;
  });
  return match?.id || null;
}

export function extractResult(fixture: APIFixture): MatchResult | null {
  if (!isMatchFinished(fixture.status)) return null;

  let homeGoals = fixture.scoreFulltimeHome;
  let awayGoals = fixture.scoreFulltimeAway;
  if (homeGoals === null || awayGoals === null) {
    homeGoals = fixture.goalsHome;
    awayGoals = fixture.goalsAway;
  }
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
    if (trimmed.startsWith('<') || trimmed.startsWith('<!DOCTYPE')) {
      console.warn('[auto-results] Received HTML instead of JSON');
      return null;
    }
    return JSON.parse(trimmed) as T;
  } catch {
    console.warn('[auto-results] Failed to parse response as JSON');
    return null;
  }
}

// Fetch results from Netlify function (with optional standings)
export async function fetchResults(date?: string, includeStandings?: boolean): Promise<APIResponse> {
  try {
    let url = '/.netlify/functions/fetch-results';
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    if (includeStandings) params.set('include', 'standings');
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) {
      return { success: false, count: 0, fixtures: [], error: `HTTP_${response.status}` };
    }
    const data = await safeParseJSON<APIResponse>(response);
    if (!data) {
      return { success: false, count: 0, fixtures: [], error: 'INVALID_RESPONSE', message: 'Netlify Functions غير منشورة' };
    }
    return data;
  } catch (error) {
    console.error('[auto-results] Failed to fetch results:', error);
    return { success: false, count: 0, fixtures: [], error: 'NETWORK_ERROR', message: 'خطأ في الاتصال' };
  }
}

// Fetch live matches from Netlify function (includes events by default)
export async function fetchLiveMatches(): Promise<APIResponse> {
  try {
    const url = '/.netlify/functions/fetch-live?stats=true';
    const response = await fetch(url);
    if (!response.ok) {
      return { success: false, count: 0, fixtures: [], error: `HTTP_${response.status}` };
    }
    const data = await safeParseJSON<APIResponse>(response);
    if (!data) {
      return { success: false, count: 0, fixtures: [], error: 'INVALID_RESPONSE', message: 'Netlify Functions غير منشورة' };
    }
    return data;
  } catch (error) {
    console.error('[auto-results] Failed to fetch live matches:', error);
    return { success: false, count: 0, fixtures: [], error: 'NETWORK_ERROR', message: 'خطأ في الاتصال' };
  }
}

// Fetch single fixture detail (events, lineups, statistics)
export async function fetchFixtureDetail(fixtureId: number): Promise<APIFixtureDetail> {
  try {
    const url = `/.netlify/functions/fetch-results?fixture=${fixtureId}&include=events,lineups,statistics`;
    const response = await fetch(url);
    if (!response.ok) {
      return { success: false, fixture: null, events: [], lineups: [], statistics: [], error: `HTTP_${response.status}` };
    }
    const data = await safeParseJSON<APIFixtureDetail>(response);
    if (!data) {
      return { success: false, fixture: null, events: [], lineups: [], statistics: [], error: 'INVALID_RESPONSE' };
    }
    return data;
  } catch (error) {
    console.error('[auto-results] Failed to fetch fixture detail:', error);
    return { success: false, fixture: null, events: [], lineups: [], statistics: [], error: 'NETWORK_ERROR' };
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

// Map Arabic event type names
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

// Map Arabic stat type names
export function getStatTypeAr(type: string): string {
  const map: Record<string, string> = {
    'Shots on Goal': 'تسديدات على المرمى',
    'Shots off Goal': 'تسديدات خارج المرمى',
    'Total Shots': 'إجمالي التسديدات',
    'Blocked Shots': 'تسديدات محظورة',
    'Shots insidebox': 'تسديدات داخل الصندوق',
    'Shots outsidebox': 'تسديدات خارج الصندوق',
    'Fouls': 'أخطاء',
    'Corner Kicks': 'ركنيات',
    'Offsides': 'تسلل',
    'Ball Possession': 'الاستحواذ',
    'Yellow Cards': 'بطاقات صفراء',
    'Red Cards': 'بطاقات حمراء',
    'Goalkeeper Saves': 'تصديات الحارس',
    'Total passes': 'إجمالي التمريرات',
    'Passes accurate': 'تمريرات دقيقة',
    'Passes %': 'نسبة التمرير',
  };
  return map[type] || type;
}
