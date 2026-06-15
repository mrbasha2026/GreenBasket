// FIFA World Cup 2026 Logic - Standings Calculation, Qualification Logic
import { GroupStanding, MATCHES, TEAMS, getTeamsInGroup, THIRD_PLACE_ELIGIBLE_GROUPS } from './wc2026-data';

export interface MatchResult {
  homeGoals: number;
  awayGoals: number;
  homePenalties?: number;
  awayPenalties?: number;
}

/**
 * Calculate group standings from match results
 */
export function calculateGroupStandings(
  results: Record<number, MatchResult>
): Record<string, GroupStanding[]> {
  const standings: Record<string, GroupStanding[]> = {};

  // Initialize standings for all groups
  for (const group of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']) {
    const teams = getTeamsInGroup(group);
    standings[group] = teams.map(team => ({
      team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    }));
  }

  // Process group stage matches
  const groupMatches = MATCHES.filter(m => m.round === 'group');
  for (const match of groupMatches) {
    const result = results[match.id];
    if (!result) continue;

    const group = match.group!;
    const homeTeam = match.team1;
    const awayTeam = match.team2;

    const homeStanding = standings[group].find(s => s.team === homeTeam);
    const awayStanding = standings[group].find(s => s.team === awayTeam);

    if (!homeStanding || !awayStanding) continue;

    // Update played
    homeStanding.played++;
    awayStanding.played++;

    // Update goals
    homeStanding.goalsFor += result.homeGoals;
    homeStanding.goalsAgainst += result.awayGoals;
    awayStanding.goalsFor += result.awayGoals;
    awayStanding.goalsAgainst += result.homeGoals;

    // Update results
    if (result.homeGoals > result.awayGoals) {
      homeStanding.won++;
      homeStanding.points += 3;
      awayStanding.lost++;
    } else if (result.homeGoals < result.awayGoals) {
      awayStanding.won++;
      awayStanding.points += 3;
      homeStanding.lost++;
    } else {
      homeStanding.drawn++;
      homeStanding.points += 1;
      awayStanding.drawn++;
      awayStanding.points += 1;
    }
  }

  // Sort each group
  for (const group of Object.keys(standings)) {
    standings[group] = sortGroupStandings(standings[group], results, group);
  }

  return standings;
}

/**
 * Sort group standings with tie-breaking rules
 * 1. Points, 2. Goal difference, 3. Goals scored, 4. Head-to-head
 */
function sortGroupStandings(
  groupStandings: GroupStanding[],
  results: Record<number, MatchResult>,
  group: string
): GroupStanding[] {
  // Calculate goal difference
  for (const standing of groupStandings) {
    standing.goalDifference = standing.goalsFor - standing.goalsAgainst;
  }

  return [...groupStandings].sort((a, b) => {
    // 1. Points
    if (b.points !== a.points) return b.points - a.points;
    // 2. Goal difference
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    // 3. Goals scored
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    // 4. Head-to-head
    const h2h = getHeadToHeadResult(a.team, b.team, group, results);
    if (h2h !== 0) return h2h;
    // 5. Fair play (simplified - we don't track cards, so skip)
    // 6. Drawing of lots (random as tiebreaker)
    return 0;
  });
}

/**
 * Get head-to-head result between two teams
 * Returns positive if teamA is better, negative if teamB is better
 */
function getHeadToHeadResult(
  teamA: string,
  teamB: string,
  group: string,
  results: Record<number, MatchResult>
): number {
  const groupMatches = MATCHES.filter(m => m.group === group);
  let aPoints = 0;
  let aGoalsFor = 0;
  let bGoalsFor = 0;

  for (const match of groupMatches) {
    if (
      (match.team1 === teamA && match.team2 === teamB) ||
      (match.team1 === teamB && match.team2 === teamA)
    ) {
      const result = results[match.id];
      if (!result) continue;

      const isAHome = match.team1 === teamA;
      const aGoals = isAHome ? result.homeGoals : result.awayGoals;
      const bGoals = isAHome ? result.awayGoals : result.homeGoals;

      aGoalsFor += aGoals;
      bGoalsFor += bGoals;

      if (aGoals > bGoals) aPoints += 3;
      else if (aGoals === bGoals) aPoints += 1;
    }
  }

  if (aPoints !== 0) return -aPoints; // Negate because we want positive = teamA better
  if (aGoalsFor !== bGoalsFor) return bGoalsFor - aGoalsFor;
  return 0;
}

/**
 * Get the ranking of all 3rd place teams across all groups
 * Used to determine which 8 third-place teams advance
 */
export function calculateThirdPlaceRanking(
  standings: Record<string, GroupStanding[]>
): { group: string; team: string; points: number; goalDifference: number; goalsFor: number }[] {
  const thirdPlaceTeams: { group: string; team: string; points: number; goalDifference: number; goalsFor: number }[] = [];

  for (const group of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']) {
    const groupStandings = standings[group];
    if (groupStandings && groupStandings.length >= 3) {
      const thirdPlace = groupStandings[2];
      thirdPlaceTeams.push({
        group,
        team: thirdPlace.team,
        points: thirdPlace.points,
        goalDifference: thirdPlace.goalDifference,
        goalsFor: thirdPlace.goalsFor,
      });
    }
  }

  // Sort by same criteria as group standings
  thirdPlaceTeams.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return 0;
  });

  return thirdPlaceTeams;
}

/**
 * Determine which 8 third-place teams qualify
 */
export function getQualifiedThirdPlaceTeams(
  thirdPlaceRanking: ReturnType<typeof calculateThirdPlaceRanking>
): string[] {
  // Top 8 third-place teams qualify
  return thirdPlaceRanking.slice(0, 8).map(tp => tp.team);
}

/**
 * Resolve the specific 3rd place team for a given 3rd place reference
 * The reference indicates which groups are eligible for that slot
 * The best available 3rd place team from those groups gets that slot
 */
export function resolveThirdPlaceRef(
  ref: string,
  thirdPlaceRanking: ReturnType<typeof calculateThirdPlaceRanking>,
  usedThirdPlaceSlots: Set<string>
): string | null {
  const eligibleGroups = THIRD_PLACE_ELIGIBLE_GROUPS[ref];
  if (!eligibleGroups) return null;

  // Find the best 3rd place team from eligible groups that hasn't been assigned yet
  for (const tp of thirdPlaceRanking) {
    if (eligibleGroups.includes(tp.group) && !usedThirdPlaceSlots.has(tp.group)) {
      usedThirdPlaceSlots.add(tp.group);
      return tp.team;
    }
  }
  return null;
}

/**
 * Get match winner team name
 */
export function getMatchWinner(
  matchId: number,
  results: Record<number, MatchResult>
): string | null {
  const result = results[matchId];
  if (!result) return null;

  const match = MATCHES.find(m => m.id === matchId);
  if (!match) return null;

  if (result.homeGoals > result.awayGoals) return match.team1;
  if (result.awayGoals > result.homeGoals) return match.team2;
  // Check penalties for knockout
  if (result.homePenalties !== undefined && result.awayPenalties !== undefined) {
    if (result.homePenalties > result.awayPenalties) return match.team1;
    if (result.awayPenalties > result.homePenalties) return match.team2;
  }
  return null;
}

/**
 * Get match loser team name
 */
export function getMatchLoser(
  matchId: number,
  results: Record<number, MatchResult>
): string | null {
  const result = results[matchId];
  if (!result) return null;

  const match = MATCHES.find(m => m.id === matchId);
  if (!match) return null;

  if (result.homeGoals < result.awayGoals) return match.team1;
  if (result.awayGoals < result.homeGoals) return match.team2;
  // Check penalties for knockout
  if (result.homePenalties !== undefined && result.awayPenalties !== undefined) {
    if (result.homePenalties < result.awayPenalties) return match.team1;
    if (result.awayPenalties < result.homePenalties) return match.team2;
  }
  return null;
}

// ──────────────────────── Saudi Arabia Timezone ────────────────────────
const SAUDI_TZ = 'Asia/Riyadh'; // UTC+3 (no DST)

/**
 * Format date in Arabic (plain date, no timezone conversion)
 * Used for display purposes where the date is already in the correct timezone
 */
export function formatDateAr(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// ──────────────────────── Venue Timezone Mapping ────────────────────────
// World Cup 2026 venues in USA, Mexico, Canada - summer timezone offsets (DST)
// Offset is the number of hours BEHIND UTC (negative means ahead of UTC)
const VENUE_TZ_OFFSETS: Record<string, number> = {
  // Mexico - CDT (UTC-5)
  'Mexico City Stadium': -5,
  'Estadio Guadalajara': -5,
  'Estadio Monterrey': -5,
  // US Eastern - EDT (UTC-4)
  'Boston Stadium': -4,
  'New York New Jersey Stadium': -4,
  'Philadelphia Stadium': -4,
  'Miami Stadium': -4,
  'Atlanta Stadium': -4,
  // US Central - CDT (UTC-5)
  'Houston Stadium': -5,
  'Dallas Stadium': -5,
  'Kansas City Stadium': -5,
  // US Pacific - PDT (UTC-7)
  'Los Angeles Stadium': -7,
  'San Francisco Bay Area Stadium': -7,
  'Seattle Stadium': -7,
  // Canada Eastern - EDT (UTC-4)
  'Toronto Stadium': -4,
  // Canada Pacific - PDT (UTC-7)
  'BC Place Vancouver': -7,
};

/**
 * Convert match venue local time to a UTC Date object
 * This is the core conversion used by all time/date display functions
 */
function getMatchUTCDate(date: string, time: string, venue: string): Date | null {
  const venueOffset = VENUE_TZ_OFFSETS[venue];
  if (venueOffset === undefined) return null;

  try {
    const [hours, minutes] = time.split(':').map(Number);
    // Convert venue local time to UTC:
    // venue local time = UTC + offset (offset is negative for west of GMT)
    // So UTC = venue local - offset
    // e.g., 18:00 at UTC-5 → UTC = 18:00 - (-5) = 23:00 UTC
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

/**
 * Convert match time from venue local timezone to Saudi Arabia time (Asia/Riyadh, UTC+3)
 * Returns formatted time string in Saudi timezone
 */
export function formatMatchLocalTime(date: string, time: string, venue: string): string {
  if (!time) return '';

  const utcDate = getMatchUTCDate(date, time, venue);
  if (!utcDate) return time; // Fallback: show as-is if venue unknown

  try {
    // Get hours and minutes in Saudi timezone using 12-hour format
    const hourStr = utcDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: SAUDI_TZ,
    });
    // en-US hour12 gives "2:00 PM" or "12:00 AM" etc.
    // Convert to Arabic 12-hour format with ص/م
    const match12 = hourStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
    if (match12) {
      const hours = parseInt(match12[1]);
      const minutes = match12[2];
      const isPM = match12[3].toUpperCase() === 'PM';
      // Arabic period: ص = AM, م = PM
      const period = isPM ? 'م' : 'ص';
      // Use Arabic-Indic digits for consistency
      const toArabicDigits = (n: string | number) => String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
      return `${toArabicDigits(hours)}:${toArabicDigits(minutes)} ${period}`;
    }
    // Fallback if regex doesn't match
    return hourStr;
  } catch {
    return time; // Fallback
  }
}

/**
 * Get the match date in Saudi Arabia timezone
 * Returns a date string like "2026-06-15" representing the date in Saudi time
 * This handles the case where a late match in the US falls on the next day in Saudi time
 */
export function getMatchSaudiDate(date: string, time: string, venue: string): string {
  if (!time) return date; // No time = just use the original date

  const utcDate = getMatchUTCDate(date, time, venue);
  if (!utcDate) return date; // Fallback

  try {
    // Get the date components in Saudi timezone
    const formatter = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: SAUDI_TZ,
    });
    // en-CA locale gives YYYY-MM-DD format
    return formatter.format(utcDate);
  } catch {
    return date;
  }
}

/**
 * Format match date in Arabic using Saudi Arabia timezone
 * This correctly shows the date in Saudi time (which may differ from venue date for late matches)
 */
export function formatMatchSaudiDateAr(date: string, time: string, venue: string): string {
  const saudiDateStr = getMatchSaudiDate(date, time, venue);
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  const [year, month, day] = saudiDateStr.split('-').map(Number);
  return `${day} ${months[month - 1]} ${year}`;
}

/**
 * Get the user's local timezone name for display
 */
export function getUserTimezoneName(): string {
  return SAUDI_TZ;
}


/**
 * Format match time in Arabic-friendly format
 * DEPRECATED: Use formatMatchLocalTime for proper timezone conversion
 */
export function formatTimeAr(time?: string): string {
  if (!time) return '';
  return time;
}

/**
 * Check if a team is qualified (in top 2 of group or best 8 3rd place)
 */
export function isTeamQualified(
  team: string,
  standings: Record<string, GroupStanding[]>,
  qualifiedThirdPlace: string[]
): 'qualified' | 'third-place' | 'eliminated' {
  const teamData = TEAMS[team];
  if (!teamData) return 'eliminated';

  const groupStandings = standings[teamData.group];
  if (!groupStandings) return 'eliminated';

  const position = groupStandings.findIndex(s => s.team === team);
  if (position === 0 || position === 1) return 'qualified';
  if (position === 2 && qualifiedThirdPlace.includes(team)) return 'third-place';
  return 'eliminated';
}
