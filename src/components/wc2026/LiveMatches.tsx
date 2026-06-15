'use client';

import { useState, useEffect, useMemo } from 'react';
import { MATCHES, TEAMS, GROUP_NAMES_AR, ROUND_NAMES_AR, THIRD_PLACE_ELIGIBLE_GROUPS, getTeamRefDisplayName } from '@/lib/wc2026-data';
import { formatMatchSaudiDateAr, formatMatchLocalTime, calculateGroupStandings, calculateThirdPlaceRanking } from '@/lib/wc2026-logic';
import { useWC2026Store } from '@/store/wc2026-store';
import { TeamFlag } from './TeamFlag';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, MapPin, Trophy, Activity } from 'lucide-react';

// Venue timezone offsets
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

const toArabicDigits = (n: number | string): string => {
  return String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
};

// Format current Saudi time
function formatSaudiTimeNow(): string {
  const now = new Date();
  const hourStr = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Asia/Riyadh',
  });
  const match12 = hourStr.match(/^(\d+):(\d+):(\d+)\s*(AM|PM)$/i);
  if (match12) {
    const hours = parseInt(match12[1]);
    const minutes = match12[2];
    const seconds = match12[3];
    const isPM = match12[4].toUpperCase() === 'PM';
    const period = isPM ? 'م' : 'ص';
    return `${toArabicDigits(hours)}:${toArabicDigits(minutes)}:${toArabicDigits(seconds)} ${period}`;
  }
  return hourStr;
}

function formatSaudiDateNow(): string {
  const now = new Date();
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  // Get Saudi time components
  const saudiDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Riyadh' }));
  const dayName = days[saudiDate.getDay()];
  const day = saudiDate.getDate();
  const month = months[saudiDate.getMonth()];
  const year = saudiDate.getFullYear();

  return `${dayName} ${toArabicDigits(day)} ${month} ${toArabicDigits(year)}`;
}

// Resolve team ref for knockout matches
function resolveTeamRef(
  ref: string,
  standings: ReturnType<typeof calculateGroupStandings>,
  thirdPlaceRanking: ReturnType<typeof calculateThirdPlaceRanking>,
  results: Record<number, { homeGoals: number; awayGoals: number; homePenalties?: number; awayPenalties?: number }>,
): string | null {
  const winnerMatch = ref.match(/^1([A-L])$/);
  if (winnerMatch) {
    const group = winnerMatch[1];
    const gs = standings[group];
    if (gs && gs.length > 0 && gs[0].played > 0) return gs[0].team;
    return null;
  }
  const runnerUpMatch = ref.match(/^2([A-L])$/);
  if (runnerUpMatch) {
    const group = runnerUpMatch[1];
    const gs = standings[group];
    if (gs && gs.length > 1 && gs[1].played > 0) return gs[1].team;
    return null;
  }
  const thirdPlaceRefMatch = ref.match(/^3(.+)$/);
  if (thirdPlaceRefMatch) {
    const eligibleGroups = THIRD_PLACE_ELIGIBLE_GROUPS[ref];
    if (!eligibleGroups) return null;
    const usedGroups = new Set<string>();
    const slots = ['3ABCDf','3CDFGH','3CEfHI','3EHIJK','3BEFIJ','3AEHIJ','3EFGIJ','3DEIJL'];
    for (const slot of slots) {
      const slotEligible = THIRD_PLACE_ELIGIBLE_GROUPS[slot] || [];
      for (const tp of thirdPlaceRanking) {
        if (slotEligible.includes(tp.group) && !usedGroups.has(tp.group) && tp.points > 0) {
          usedGroups.add(tp.group);
          if (slot === ref) return tp.team;
          break;
        }
      }
    }
    return null;
  }
  const winnerOfMatch = ref.match(/^W(\d+)$/);
  if (winnerOfMatch) {
    const matchId = parseInt(winnerOfMatch[1]);
    const r = results[matchId];
    if (!r) return null;
    const m = MATCHES.find(x => x.id === matchId);
    if (!m) return null;
    const t1 = resolveTeamRef(m.team1Ref || m.team1, standings, thirdPlaceRanking, results) || m.team1;
    const t2 = resolveTeamRef(m.team2Ref || m.team2, standings, thirdPlaceRanking, results) || m.team2;
    if (r.homeGoals > r.awayGoals) return t1;
    if (r.awayGoals > r.homeGoals) return t2;
    if (r.homePenalties !== undefined && r.awayPenalties !== undefined) {
      if (r.homePenalties > r.awayPenalties) return t1;
      if (r.awayPenalties > r.homePenalties) return t2;
    }
    return null;
  }
  const loserOfMatch = ref.match(/^L(\d+)$/);
  if (loserOfMatch) {
    const matchId = parseInt(loserOfMatch[1]);
    const r = results[matchId];
    if (!r) return null;
    const m = MATCHES.find(x => x.id === matchId);
    if (!m) return null;
    const t1 = resolveTeamRef(m.team1Ref || m.team1, standings, thirdPlaceRanking, results) || m.team1;
    const t2 = resolveTeamRef(m.team2Ref || m.team2, standings, thirdPlaceRanking, results) || m.team2;
    if (r.homeGoals < r.awayGoals) return t1;
    if (r.awayGoals < r.homeGoals) return t2;
    if (r.homePenalties !== undefined && r.awayPenalties !== undefined) {
      if (r.homePenalties < r.awayPenalties) return t1;
      if (r.awayPenalties < r.homePenalties) return t2;
    }
    return null;
  }
  return null;
}

interface LiveMatchInfo {
  match: typeof MATCHES[0];
  utcDate: Date;
  saudiDate: string;
  status: 'live' | 'upcoming' | 'finished';
}

export function LiveMatches({ onMatchClick }: { onMatchClick: (matchId: number) => void }) {
  const { results, liveMatchStatuses } = useWC2026Store();
  const [currentTime, setCurrentTime] = useState('');

  const standings = useMemo(() => calculateGroupStandings(results), [results]);
  const thirdPlaceRanking = useMemo(() => calculateThirdPlaceRanking(standings), [standings]);

  // Update current time every second
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(formatSaudiTimeNow());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get today's matches based on Saudi time
  const todayMatches = useMemo(() => {
    const now = new Date();
    // Get today's date in Saudi timezone
    const saudiDateString = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' }); // YYYY-MM-DD format

    const matches: LiveMatchInfo[] = [];

    for (const match of MATCHES) {
      if (!match.time) continue;
      const utcDate = getMatchUTCDate(match.date, match.time, match.venue);
      if (!utcDate) continue;

      // Get the Saudi date for this match
      const matchSaudiDate = new Date(utcDate.toLocaleString('en-US', { timeZone: 'Asia/Riyadh' }));
      const matchSaudiDateString = matchSaudiDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' });

      // Check if match is today, was today, or within a range
      if (matchSaudiDateString === saudiDateString) {
        const matchTime = utcDate.getTime();
        const nowTime = Date.now();
        const matchEndTime = matchTime + (2 * 60 * 60 * 1000); // Assume ~2 hours for a match
        const hasResult = !!results[match.id];

        let status: 'live' | 'upcoming' | 'finished';
        const apiStatus = liveMatchStatuses[match.id];
        if (hasResult || nowTime > matchEndTime || apiStatus === 'FT' || apiStatus === 'AET' || apiStatus === 'PEN') {
          status = 'finished';
        } else if (nowTime >= matchTime || (apiStatus && ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE'].includes(apiStatus))) {
          status = 'live';
        } else {
          status = 'upcoming';
        }

        matches.push({
          match,
          utcDate,
          saudiDate: matchSaudiDateString,
          status,
        });
      }
    }

    // Sort by time
    matches.sort((a, b) => a.utcDate.getTime() - b.utcDate.getTime());
    return matches;
  }, [results, liveMatchStatuses]);

  // Get next few upcoming matches (even if not today)
  const upcomingMatches = useMemo(() => {
    const now = new Date();
    const matches: LiveMatchInfo[] = [];

    for (const match of MATCHES) {
      if (!match.time) continue;
      const utcDate = getMatchUTCDate(match.date, match.time, match.venue);
      if (!utcDate) continue;

      if (utcDate > now && !results[match.id]) {
        matches.push({
          match,
          utcDate,
          saudiDate: match.date,
          status: 'upcoming',
        });
      }
    }

    matches.sort((a, b) => a.utcDate.getTime() - b.utcDate.getTime());
    return matches.slice(0, 6); // Next 6 matches
  }, [results, liveMatchStatuses]);

  const liveCount = todayMatches.filter(m => m.status === 'live').length;
  const upcomingTodayCount = todayMatches.filter(m => m.status === 'upcoming').length;
  const finishedTodayCount = todayMatches.filter(m => m.status === 'finished').length;

  return (
    <div className="space-y-6">
      {/* Current Time Display */}
      <Card className="p-5 border-border/50 bg-gradient-to-l from-[#002868]/5 to-[#00A651]/5 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#002868]/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-[#002868] dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">التوقيت الحالي (السعودية)</p>
              <p className="text-2xl font-extrabold text-[#002868] dark:text-blue-400 tabular-nums" dir="ltr">
                {currentTime}
              </p>
            </div>
          </div>
          <div className="text-center sm:text-left">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-bold text-muted-foreground">{formatSaudiDateNow()}</p>
            </div>
          </div>
        </div>

        {/* Today's Stats */}
        {todayMatches.length > 0 && (
          <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border/30">
            {liveCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-bold text-red-500">{toArabicDigits(liveCount)} مباشر</span>
              </div>
            )}
            {upcomingTodayCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/20">
                <Clock className="w-3 h-3 text-[#FFD700]" />
                <span className="text-xs font-bold text-[#FFD700]">{toArabicDigits(upcomingTodayCount)} قادمة</span>
              </div>
            )}
            {finishedTodayCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00A651]/10 border border-[#00A651]/20">
                <span className="text-xs font-bold text-[#00A651]">{toArabicDigits(finishedTodayCount)} انتهت</span>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Today's Matches */}
      {todayMatches.length > 0 ? (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1.5 h-7 bg-red-500 rounded-full" />
            <h3 className="text-lg font-bold text-[#002868] dark:text-blue-400">مباريات اليوم</h3>
            <Badge variant="secondary" className="bg-red-500/10 text-red-500">
              {toArabicDigits(todayMatches.length)} مباراة
            </Badge>
          </div>

          <div className="space-y-3">
            {todayMatches.map(({ match, utcDate, status }) => {
              const result = results[match.id];
              const isKnockout = match.round !== 'group';

              // Resolve knockout team refs
              const team1Resolved = isKnockout && match.team1Ref
                ? resolveTeamRef(match.team1Ref, standings, thirdPlaceRanking, results)
                : null;
              const team2Resolved = isKnockout && match.team2Ref
                ? resolveTeamRef(match.team2Ref, standings, thirdPlaceRanking, results)
                : null;

              const team1Key = team1Resolved || match.team1;
              const team2Key = team2Resolved || match.team2;
              const team1Name = isKnockout
                ? (team1Resolved ? (TEAMS[team1Resolved]?.nameAr || team1Resolved) : getTeamRefDisplayName(match.team1Ref || match.team1))
                : (TEAMS[match.team1]?.nameAr || match.team1);
              const team2Name = isKnockout
                ? (team2Resolved ? (TEAMS[team2Resolved]?.nameAr || team2Resolved) : getTeamRefDisplayName(match.team2Ref || match.team2))
                : (TEAMS[match.team2]?.nameAr || match.team2);

              const team1Data = TEAMS[team1Key];
              const team2Data = TEAMS[team2Key];
              const isTeam1Resolved = !isKnockout || !!team1Resolved;
              const isTeam2Resolved = !isKnockout || !!team2Resolved;

              const isDraw = result ? (result.homeGoals === result.awayGoals && (result.homePenalties === undefined || result.awayPenalties === undefined || result.homePenalties === result.awayPenalties)) : false;
              const isTeam1Winner = result ? (
                result.homeGoals > result.awayGoals ||
                (result.homeGoals === result.awayGoals && result.homePenalties !== undefined && result.awayPenalties !== undefined && result.homePenalties > result.awayPenalties)
              ) : false;
              const isTeam2Winner = result ? (
                result.awayGoals > result.homeGoals ||
                (result.homeGoals === result.awayGoals && result.homePenalties !== undefined && result.awayPenalties !== undefined && result.awayPenalties > result.homePenalties)
              ) : false;

              return (
                <Card
                  key={match.id}
                  className={`overflow-hidden border-border/50 cursor-pointer hover:shadow-lg transition-all ${
                    status === 'live' ? 'border-red-500/40 shadow-red-500/10 shadow-md' :
                    status === 'upcoming' ? 'border-[#FFD700]/30' :
                    'opacity-70'
                  }`}
                  onClick={() => onMatchClick(match.id)}
                >
                  {/* Match status header */}
                  <div className={`flex items-center justify-between px-4 py-2 ${
                    status === 'live' ? 'bg-red-500/10 border-b border-red-500/20' :
                    status === 'upcoming' ? 'bg-[#FFD700]/10 border-b border-[#FFD700]/20' :
                    'bg-muted/30 border-b border-border/20'
                  }`}>
                    <div className="flex items-center gap-2">
                      {status === 'live' && (
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-xs font-bold text-red-500">مباشر</span>
                          {liveMatchStatuses[match.id] && (
                            <span className="text-[10px] text-red-400 bg-red-500/10 px-1 rounded">
                              {liveMatchStatuses[match.id] === '1H' ? 'الشوط الأول' :
                               liveMatchStatuses[match.id] === 'HT' ? 'استراحة' :
                               liveMatchStatuses[match.id] === '2H' ? 'الشوط الثاني' :
                               liveMatchStatuses[match.id] === 'ET' ? 'إضافي' :
                               liveMatchStatuses[match.id] === 'P' ? 'ركلات جزاء' :
                               liveMatchStatuses[match.id]}
                            </span>
                          )}
                        </span>
                      )}
                      {status === 'upcoming' && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-[#FFD700]" />
                          <span className="text-xs font-bold text-[#FFD700]">قادمة</span>
                        </span>
                      )}
                      {status === 'finished' && (
                        <span className="text-xs font-bold text-[#00A651]">انتهت</span>
                      )}
                      <span className="text-xs text-muted-foreground">مباراة {toArabicDigits(match.id)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {match.group ? (
                        <Badge variant="secondary" className="text-xs bg-[#002868]/10 text-[#002868] border-0">
                          {GROUP_NAMES_AR[match.group]}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs bg-[#E31837]/10 text-[#E31837] border-0">
                          {ROUND_NAMES_AR[match.round]}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Teams and score */}
                  <div className="px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      {/* Team 1 */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {isTeam1Resolved && team1Data ? (
                          <TeamFlag teamName={team1Key} size="lg" />
                        ) : (
                          <Trophy className="w-8 h-8 text-muted-foreground/50" />
                        )}
                        <span className={`text-sm font-bold truncate ${
                          !isTeam1Resolved ? 'text-muted-foreground italic' : ''
                        } ${isTeam1Winner ? 'text-[#00A651]' : ''} ${
                          result && !isTeam1Winner && !isDraw ? 'text-[#E31837]' : ''
                        } ${isDraw ? 'text-[#D4A017]' : ''}`}>
                          {team1Name}
                        </span>
                      </div>

                      {/* Score */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {result ? (
                          <div className="flex items-center gap-1">
                            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-white font-extrabold text-lg ${
                              isTeam1Winner ? 'bg-[#00A651]' : isDraw ? 'bg-[#D4A017]' : 'bg-[#E31837]/80'
                            }`}>
                              {toArabicDigits(result.homeGoals)}
                            </span>
                            <span className="text-muted-foreground text-sm font-bold">-</span>
                            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-white font-extrabold text-lg ${
                              isTeam2Winner ? 'bg-[#00A651]' : isDraw ? 'bg-[#D4A017]' : 'bg-[#E31837]/80'
                            }`}>
                              {toArabicDigits(result.awayGoals)}
                            </span>
                            {result.homePenalties !== undefined && result.awayPenalties !== undefined && (
                              <span className="text-xs text-amber-600 font-medium mr-1">
                                ({toArabicDigits(result.homePenalties)}-{toArabicDigits(result.awayPenalties)} ترجيح)
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-sm font-bold ${
                              status === 'live' ? 'bg-red-500/10 text-red-500 animate-pulse' :
                              'bg-muted/50 text-muted-foreground'
                            }`}>
                              {status === 'live' ? 'جارية' : formatMatchLocalTime(match.date, match.time || '', match.venue)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Team 2 */}
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className={`text-sm font-bold truncate ${
                          !isTeam2Resolved ? 'text-muted-foreground italic' : ''
                        } ${isTeam2Winner ? 'text-[#00A651]' : ''} ${
                          result && !isTeam2Winner && !isDraw ? 'text-[#E31837]' : ''
                        } ${isDraw ? 'text-[#D4A017]' : ''}`}>
                          {team2Name}
                        </span>
                        {isTeam2Resolved && team2Data ? (
                          <TeamFlag teamName={team2Key} size="lg" />
                        ) : (
                          <Trophy className="w-8 h-8 text-muted-foreground/50" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-2 bg-muted/20 border-t border-border/10 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3" />
                      <span>{match.venueAr}</span>
                    </div>
                    <span>{formatMatchSaudiDateAr(match.date, match.time || '', match.venue)}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <Card className="p-8 border-dashed border-2 border-border/50 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center">
              <Activity className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-bold text-muted-foreground">لا توجد مباريات اليوم</h3>
            <p className="text-sm text-muted-foreground/70 max-w-md">
              لا توجد مباريات مجدولة في هذا اليوم. تصفح المباريات القادمة أدناه.
            </p>
          </div>
        </Card>
      )}

      {/* Next Upcoming Matches */}
      {upcomingMatches.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1.5 h-7 bg-[#FFD700] rounded-full" />
            <h3 className="text-lg font-bold text-[#002868] dark:text-blue-400">المباريات القادمة</h3>
            <Badge variant="secondary" className="bg-[#FFD700]/10 text-[#D4A017]">
              أقرب {toArabicDigits(upcomingMatches.length)} مباريات
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingMatches.map(({ match, utcDate }) => {
              const isKnockout = match.round !== 'group';
              const team1Resolved = isKnockout && match.team1Ref
                ? resolveTeamRef(match.team1Ref, standings, thirdPlaceRanking, results)
                : null;
              const team2Resolved = isKnockout && match.team2Ref
                ? resolveTeamRef(match.team2Ref, standings, thirdPlaceRanking, results)
                : null;

              const team1Key = team1Resolved || match.team1;
              const team2Key = team2Resolved || match.team2;
              const team1Name = isKnockout
                ? (team1Resolved ? (TEAMS[team1Resolved]?.nameAr || team1Resolved) : getTeamRefDisplayName(match.team1Ref || match.team1))
                : (TEAMS[match.team1]?.nameAr || match.team1);
              const team2Name = isKnockout
                ? (team2Resolved ? (TEAMS[team2Resolved]?.nameAr || team2Resolved) : getTeamRefDisplayName(match.team2Ref || match.team2))
                : (TEAMS[match.team2]?.nameAr || match.team2);

              const team1Data = TEAMS[team1Key];
              const team2Data = TEAMS[team2Key];
              const isTeam1Resolved = !isKnockout || !!team1Resolved;
              const isTeam2Resolved = !isKnockout || !!team2Resolved;

              // Calculate time until match
              const now = Date.now();
              const diffMs = utcDate.getTime() - now;
              const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
              const diffHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
              const diffMins = Math.floor((diffMs / (1000 * 60)) % 60);

              let timeUntil = '';
              if (diffDays > 0) {
                timeUntil = `بعد ${toArabicDigits(diffDays)} يوم و ${toArabicDigits(diffHours)} ساعة`;
              } else if (diffHours > 0) {
                timeUntil = `بعد ${toArabicDigits(diffHours)} ساعة و ${toArabicDigits(diffMins)} دقيقة`;
              } else {
                timeUntil = `بعد ${toArabicDigits(diffMins)} دقيقة`;
              }

              return (
                <Card
                  key={match.id}
                  className="p-4 border-border/50 cursor-pointer hover:shadow-md transition-all bg-card/80"
                  onClick={() => onMatchClick(match.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    {match.group ? (
                      <Badge variant="secondary" className="text-xs bg-[#002868]/10 text-[#002868] border-0">
                        {GROUP_NAMES_AR[match.group]}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs bg-[#E31837]/10 text-[#E31837] border-0">
                        {ROUND_NAMES_AR[match.round]}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">مباراة {toArabicDigits(match.id)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {isTeam1Resolved && team1Data ? (
                        <TeamFlag teamName={team1Key} size="md" />
                      ) : (
                        <Trophy className="w-5 h-5 text-muted-foreground/50" />
                      )}
                      <span className={`text-xs font-bold truncate ${!isTeam1Resolved ? 'text-muted-foreground italic' : ''}`}>
                        {team1Name}
                      </span>
                    </div>
                    <span className="text-[#FFD700] text-xs font-bold">ضد</span>
                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                      <span className={`text-xs font-bold truncate ${!isTeam2Resolved ? 'text-muted-foreground italic' : ''}`}>
                        {team2Name}
                      </span>
                      {isTeam2Resolved && team2Data ? (
                        <TeamFlag teamName={team2Key} size="md" />
                      ) : (
                        <Trophy className="w-5 h-5 text-muted-foreground/50" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/20">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span className="font-bold text-[#002868] dark:text-blue-400">{formatMatchLocalTime(match.date, match.time || '', match.venue)}</span>
                    </div>
                    <span className="text-[#FFD700] font-medium">{timeUntil}</span>
                  </div>

                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span>{match.venueAr}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
