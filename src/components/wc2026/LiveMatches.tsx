'use client';

import { useState, useEffect, useMemo } from 'react';
import { MATCHES, TEAMS, GROUP_NAMES_AR, ROUND_NAMES_AR, THIRD_PLACE_ELIGIBLE_GROUPS, getTeamRefDisplayName } from '@/lib/wc2026-data';
import { formatMatchSaudiDateAr, formatMatchLocalTime, calculateGroupStandings, calculateThirdPlaceRanking } from '@/lib/wc2026-logic';
import { useWC2026Store } from '@/store/wc2026-store';
import { getEventTypeAr, getEventIcon, getStatTypeAr, type MatchEvent, type MatchLineup, type MatchStats } from '@/lib/auto-results';
import { TeamFlag } from './TeamFlag';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, MapPin, Trophy, Activity, ChevronDown, ChevronUp, Users, BarChart3, PlayCircle } from 'lucide-react';

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

// Arabic-Indic digits
function toArabicDigits(n: number | string): string {
  return String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
}

function formatSaudiTimeNow(): string {
  return new Date().toLocaleTimeString('ar-SA', {
    timeZone: 'Asia/Riyadh', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  });
}

function formatSaudiDateNow(): string {
  return new Date().toLocaleDateString('ar-SA', {
    timeZone: 'Asia/Riyadh', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function resolveTeamRef(
  ref: string, standings: any, thirdPlaceRanking: any, results: any
): string | null {
  if (!ref) return null;
  if (TEAMS[ref]) return ref;
  // Winner of match
  const winnerMatch = ref.match(/^W(\d+)$/);
  if (winnerMatch) {
    const matchId = parseInt(winnerMatch[1]);
    const r = results[matchId];
    if (!r) return null;
    const match = MATCHES.find(m => m.id === matchId);
    if (!match) return null;
    if (r.homeGoals > r.awayGoals) return match.team1;
    if (r.awayGoals > r.homeGoals) return match.team2;
    if (r.homePenalties !== undefined && r.awayPenalties !== undefined) {
      return r.homePenalties > r.awayPenalties ? match.team1 : match.team2;
    }
    return null;
  }
  // Loser of match
  const loserMatch = ref.match(/^L(\d+)$/);
  if (loserMatch) {
    const matchId = parseInt(loserMatch[1]);
    const r = results[matchId];
    if (!r) return null;
    const match = MATCHES.find(m => m.id === matchId);
    if (!match) return null;
    if (r.homeGoals < r.awayGoals) return match.team1;
    if (r.awayGoals < r.homeGoals) return match.team2;
    return null;
  }
  // Group position
  const groupMatch = ref.match(/^([A-L])(\d)$/);
  if (groupMatch) {
    const group = groupMatch[1];
    const pos = parseInt(groupMatch[2]) - 1;
    const groupStandings = standings[group];
    if (groupStandings && groupStandings[pos]) return groupStandings[pos].team;
    return null;
  }
  // Best third-place
  const thirdMatch = ref.match(/^3([A-L])$/);
  if (thirdMatch && thirdPlaceRanking) {
    const groupLetter = thirdMatch[1];
    const entry = thirdPlaceRanking.find((t: any) => t.group === groupLetter);
    return entry?.team || null;
  }
  return null;
}

interface LiveMatchInfo {
  match: typeof MATCHES[0];
  utcDate: Date;
  saudiDate: string;
  status: 'live' | 'upcoming' | 'finished';
}

// === Sub-Components ===

function EventsTimeline({ events, homeTeam, awayTeam }: { events: MatchEvent[]; homeTeam: string; awayTeam: string }) {
  const goalEvents = events.filter(e => e.type === 'Goal');
  const cardEvents = events.filter(e => e.type === 'Card');
  const substEvents = events.filter(e => e.type === 'subst');

  if (goalEvents.length === 0 && cardEvents.length === 0 && substEvents.length === 0) return null;

  return (
    <div className="px-4 py-2 border-t border-border/10">
      <p className="text-xs font-bold text-muted-foreground mb-1.5">أحداث المباراة</p>
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {/* Goals first */}
        {goalEvents.map((e, i) => (
          <div key={`g${i}`} className="flex items-center gap-1.5 text-xs">
            <span className="text-[10px] text-muted-foreground w-6 text-center">{toArabicDigits(e.time.elapsed)}&apos;</span>
            <span>⚽</span>
            <span className={`font-bold ${e.detail === 'Own Goal' ? 'text-red-500' : 'text-[#00A651]'}`}>
              {e.player.name || 'هدف'}
            </span>
            {e.detail === 'Penalty' && <span className="text-[10px] text-amber-500">(جزاء)</span>}
            {e.detail === 'Own Goal' && <span className="text-[10px] text-red-400">(عكسي)</span>}
            {e.assist.name && <span className="text-muted-foreground">(صانع: {e.assist.name})</span>}
          </div>
        ))}
        {/* Cards */}
        {cardEvents.map((e, i) => (
          <div key={`c${i}`} className="flex items-center gap-1.5 text-xs">
            <span className="text-[10px] text-muted-foreground w-6 text-center">{toArabicDigits(e.time.elapsed)}&apos;</span>
            <span>{e.detail === 'Red Card' || e.detail === 'Second Yellow Card' ? '🟥' : '🟨'}</span>
            <span className={e.detail === 'Red Card' || e.detail === 'Second Yellow Card' ? 'text-red-500' : 'text-amber-500'}>
              {e.player.name}
            </span>
          </div>
        ))}
        {/* Substitutions - only show first 4 to save space */}
        {substEvents.slice(0, 4).map((e, i) => (
          <div key={`s${i}`} className="flex items-center gap-1.5 text-xs">
            <span className="text-[10px] text-muted-foreground w-6 text-center">{toArabicDigits(e.time.elapsed)}&apos;</span>
            <span>🔄</span>
            <span className="text-muted-foreground">{e.assist.name}</span>
            <span className="text-muted-foreground">←</span>
            <span className="text-muted-foreground">{e.player.name}</span>
          </div>
        ))}
        {substEvents.length > 4 && (
          <p className="text-[10px] text-muted-foreground text-center">+{toArabicDigits(substEvents.length - 4)} تبديلات أخرى</p>
        )}
      </div>
    </div>
  );
}

function MatchLineupsView({ lineups }: { lineups: MatchLineup[] }) {
  if (!lineups || lineups.length < 2) return null;
  const [home, away] = lineups;

  return (
    <div className="px-4 py-2 border-t border-border/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Users className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs font-bold text-muted-foreground">التشكيلة</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-[#002868]">{home.formation}</span>
          <span className="text-muted-foreground">ضد</span>
          <span className="font-bold text-[#E31837]">{away.formation}</span>
        </div>
      </div>
      {home.coach && <p className="text-[10px] text-muted-foreground mb-1">مدرب {home.team.name}: {home.coach}</p>}
      {away.coach && <p className="text-[10px] text-muted-foreground mb-1">مدرب {away.team.name}: {away.coach}</p>}
      <div className="grid grid-cols-2 gap-2 max-h-28 overflow-y-auto">
        <div>
          <p className="text-[10px] font-bold text-muted-foreground mb-0.5">{home.team.name}</p>
          {home.startXI.map((p, i) => (
            <p key={i} className="text-[10px] text-foreground/80">
              <span className="text-muted-foreground">{p.player.number}.</span> {p.player.name}
            </p>
          ))}
        </div>
        <div>
          <p className="text-[10px] font-bold text-muted-foreground mb-0.5">{away.team.name}</p>
          {away.startXI.map((p, i) => (
            <p key={i} className="text-[10px] text-foreground/80">
              <span className="text-muted-foreground">{p.player.number}.</span> {p.player.name}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function MatchStatisticsView({ stats }: { stats: MatchStats[] }) {
  if (!stats || stats.length < 2) return null;
  const [home, away] = stats;

  const importantStats = [
    'Ball Possession', 'Total Shots', 'Shots on Goal', 'Corner Kicks',
    'Fouls', 'Yellow Cards', 'Red Cards', 'Offsides', 'Passes %',
  ];

  return (
    <div className="px-4 py-2 border-t border-border/10">
      <div className="flex items-center gap-1.5 mb-2">
        <BarChart3 className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs font-bold text-muted-foreground">إحصائيات</span>
      </div>
      <div className="space-y-1.5">
        {home.statistics
          .filter(s => importantStats.includes(s.type))
          .map((homeStat, i) => {
            const awayStat = away.statistics.find(s => s.type === homeStat.type);
            if (!awayStat) return null;

            const homeVal = typeof homeStat.value === 'string' ? parseInt(homeStat.value) : (homeStat.value || 0);
            const awayVal = typeof awayStat.value === 'string' ? parseInt(awayStat.value) : (awayStat.value || 0);
            const total = homeVal + awayVal || 1;
            const homePercent = (homeVal / total) * 100;

            return (
              <div key={i} className="space-y-0.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className={`font-bold ${homeVal > awayVal ? 'text-[#00A651]' : 'text-muted-foreground'}`}>{homeStat.value ?? '-'}</span>
                  <span className="text-muted-foreground font-medium">{getStatTypeAr(homeStat.type)}</span>
                  <span className={`font-bold ${awayVal > homeVal ? 'text-[#00A651]' : 'text-muted-foreground'}`}>{awayStat.value ?? '-'}</span>
                </div>
                <div className="flex h-1.5 rounded-full overflow-hidden bg-muted/30">
                  <div className="bg-[#002868] dark:bg-blue-400 rounded-l-full transition-all" style={{ width: `${homePercent}%` }} />
                  <div className="bg-[#E31837] dark:bg-red-400 rounded-r-full transition-all" style={{ width: `${100 - homePercent}%` }} />
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

// === Main Component ===

export function LiveMatches({ onMatchClick }: { onMatchClick: (matchId: number) => void }) {
  const { results, liveMatchStatuses, liveScores, matchEvents, matchLineups, matchStats } = useWC2026Store();
  const [currentTime, setCurrentTime] = useState('');
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null);

  const standings = useMemo(() => calculateGroupStandings(results), [results]);
  const thirdPlaceRanking = useMemo(() => calculateThirdPlaceRanking(standings), [standings]);

  // Update current time every second
  useEffect(() => {
    const updateTime = () => setCurrentTime(formatSaudiTimeNow());
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get today's matches
  const todayMatches = useMemo(() => {
    const now = new Date();
    const saudiDateString = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' });
    const matches: LiveMatchInfo[] = [];

    for (const match of MATCHES) {
      if (!match.time) continue;
      const utcDate = getMatchUTCDate(match.date, match.time, match.venue);
      if (!utcDate) continue;
      const matchSaudiDateString = new Date(utcDate.toLocaleString('en-US', { timeZone: 'Asia/Riyadh' })).toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' });

      if (matchSaudiDateString === saudiDateString) {
        const matchTime = utcDate.getTime();
        const nowTime = Date.now();
        const matchEndTime = matchTime + (2 * 60 * 60 * 1000);
        const hasResult = !!results[match.id];
        const apiStatus = liveMatchStatuses[match.id];

        let status: 'live' | 'upcoming' | 'finished';
        if (hasResult || nowTime > matchEndTime || apiStatus === 'FT' || apiStatus === 'AET' || apiStatus === 'PEN') {
          status = 'finished';
        } else if (nowTime >= matchTime || (apiStatus && ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE'].includes(apiStatus))) {
          status = 'live';
        } else {
          status = 'upcoming';
        }

        matches.push({ match, utcDate, saudiDate: matchSaudiDateString, status });
      }
    }
    matches.sort((a, b) => a.utcDate.getTime() - b.utcDate.getTime());
    return matches;
  }, [results, liveMatchStatuses, liveScores]);

  // Get next upcoming matches
  const upcomingMatches = useMemo(() => {
    const now = new Date();
    const matches: LiveMatchInfo[] = [];
    for (const match of MATCHES) {
      if (!match.time) continue;
      const utcDate = getMatchUTCDate(match.date, match.time, match.venue);
      if (!utcDate) continue;
      if (utcDate > now && !results[match.id]) {
        matches.push({ match, utcDate, saudiDate: match.date, status: 'upcoming' });
      }
    }
    matches.sort((a, b) => a.utcDate.getTime() - b.utcDate.getTime());
    return matches.slice(0, 6);
  }, [results, liveMatchStatuses, liveScores]);

  const liveCount = todayMatches.filter(m => m.status === 'live').length;
  const upcomingTodayCount = todayMatches.filter(m => m.status === 'upcoming').length;
  const finishedTodayCount = todayMatches.filter(m => m.status === 'finished').length;

  const toggleExpand = (matchId: number) => {
    setExpandedMatch(prev => prev === matchId ? null : matchId);
  };

  // Check if match has API data
  const hasApiData = (matchId: number) => {
    return !!(matchEvents[matchId]?.length || matchLineups[matchId]?.length || matchStats[matchId]?.length);
  };

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
              <p className="text-2xl font-extrabold text-[#002868] dark:text-blue-400 tabular-nums" dir="ltr">{currentTime}</p>
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
            <Badge variant="secondary" className="bg-red-500/10 text-red-500">{toArabicDigits(todayMatches.length)} مباراة</Badge>
          </div>

          <div className="space-y-3">
            {todayMatches.map(({ match, utcDate, status }) => {
              const result = results[match.id];
              const isKnockout = match.round !== 'group';
              const team1Resolved = isKnockout && match.team1Ref ? resolveTeamRef(match.team1Ref, standings, thirdPlaceRanking, results) : null;
              const team2Resolved = isKnockout && match.team2Ref ? resolveTeamRef(match.team2Ref, standings, thirdPlaceRanking, results) : null;
              const team1Key = team1Resolved || match.team1;
              const team2Key = team2Resolved || match.team2;
              const team1Name = isKnockout ? (team1Resolved ? (TEAMS[team1Resolved]?.nameAr || team1Resolved) : getTeamRefDisplayName(match.team1Ref || match.team1)) : (TEAMS[match.team1]?.nameAr || match.team1);
              const team2Name = isKnockout ? (team2Resolved ? (TEAMS[team2Resolved]?.nameAr || team2Resolved) : getTeamRefDisplayName(match.team2Ref || match.team2)) : (TEAMS[match.team2]?.nameAr || match.team2);
              const team1Data = TEAMS[team1Key];
              const team2Data = TEAMS[team2Key];
              const isTeam1Resolved = !isKnockout || !!team1Resolved;
              const isTeam2Resolved = !isKnockout || !!team2Resolved;
              const isDraw = result ? (result.homeGoals === result.awayGoals && (result.homePenalties === undefined || result.awayPenalties === undefined || result.homePenalties === result.awayPenalties)) : false;
              const isTeam1Winner = result ? (result.homeGoals > result.awayGoals || (result.homeGoals === result.awayGoals && result.homePenalties !== undefined && result.awayPenalties !== undefined && result.homePenalties > result.awayPenalties)) : false;
              const isTeam2Winner = result ? (result.awayGoals > result.homeGoals || (result.homeGoals === result.awayGoals && result.homePenalties !== undefined && result.awayPenalties !== undefined && result.awayPenalties > result.homePenalties)) : false;
              const isExpanded = expandedMatch === match.id;
              const events = matchEvents[match.id];
              const lineups = matchLineups[match.id];
              const stats = matchStats[match.id];
              const liveScore = liveScores[match.id];
              const hasExpandableData = hasApiData(match.id);

              return (
                <Card
                  key={match.id}
                  className={`overflow-hidden border-border/50 transition-all ${
                    status === 'live' ? 'border-red-500/40 shadow-red-500/10 shadow-md' :
                    status === 'upcoming' ? 'border-[#FFD700]/30' :
                    'opacity-70'
                  }`}
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
                          {liveScore?.elapsed !== null && liveScore?.elapsed !== undefined && (
                            <span className="text-[10px] text-red-300 bg-red-500/10 px-1.5 py-0.5 rounded font-bold">
                              {toArabicDigits(liveScore.elapsed!)}&apos;
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
                        <Badge variant="secondary" className="text-xs bg-[#002868]/10 text-[#002868] border-0">{GROUP_NAMES_AR[match.group]}</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs bg-[#E31837]/10 text-[#E31837] border-0">{ROUND_NAMES_AR[match.round]}</Badge>
                      )}
                    </div>
                  </div>

                  {/* Teams and score */}
                  <div className="px-4 py-4 cursor-pointer" onClick={() => onMatchClick(match.id)}>
                    <div className="flex items-center justify-between gap-3">
                      {/* Team 1 */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {isTeam1Resolved && team1Data ? <TeamFlag teamName={team1Key} size="lg" /> : <Trophy className="w-8 h-8 text-muted-foreground/50" />}
                        <span className={`text-sm font-bold truncate ${
                          !isTeam1Resolved ? 'text-muted-foreground italic' : ''
                        } ${isTeam1Winner ? 'text-[#00A651]' : ''} ${result && !isTeam1Winner && !isDraw ? 'text-[#E31837]' : ''} ${isDraw ? 'text-[#D4A017]' : ''}`}>
                          {team1Name}
                        </span>
                      </div>

                      {/* Score */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {result ? (
                          <div className="flex items-center gap-1">
                            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-white font-extrabold text-lg ${isTeam1Winner ? 'bg-[#00A651]' : isDraw ? 'bg-[#D4A017]' : 'bg-[#E31837]/80'}`}>
                              {toArabicDigits(result.homeGoals)}
                            </span>
                            <span className="text-muted-foreground text-sm font-bold">-</span>
                            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-white font-extrabold text-lg ${isTeam2Winner ? 'bg-[#00A651]' : isDraw ? 'bg-[#D4A017]' : 'bg-[#E31837]/80'}`}>
                              {toArabicDigits(result.awayGoals)}
                            </span>
                            {result.homePenalties !== undefined && result.awayPenalties !== undefined && (
                              <span className="text-xs text-amber-600 font-medium mr-1">({toArabicDigits(result.homePenalties)}-{toArabicDigits(result.awayPenalties)} ترجيح)</span>
                            )}
                          </div>
                        ) : liveScore && status === 'live' ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <div className="flex items-center gap-1">
                              <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-red-500 text-white font-extrabold text-lg animate-pulse">{toArabicDigits(liveScore.homeGoals)}</span>
                              <span className="text-red-400 text-sm font-bold">-</span>
                              <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-red-500 text-white font-extrabold text-lg animate-pulse">{toArabicDigits(liveScore.awayGoals)}</span>
                            </div>
                            {liveScore.homePenalties !== undefined && liveScore.awayPenalties !== undefined && (
                              <span className="text-[10px] text-amber-500 font-medium">({toArabicDigits(liveScore.homePenalties!)}-{toArabicDigits(liveScore.awayPenalties!)} ترجيح)</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-sm font-bold ${status === 'live' ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-muted/50 text-muted-foreground'}`}>
                              {status === 'live' ? 'جارية' : formatMatchLocalTime(match.date, match.time || '', match.venue)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Team 2 */}
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className={`text-sm font-bold truncate ${!isTeam2Resolved ? 'text-muted-foreground italic' : ''} ${isTeam2Winner ? 'text-[#00A651]' : ''} ${result && !isTeam2Winner && !isDraw ? 'text-[#E31837]' : ''} ${isDraw ? 'text-[#D4A017]' : ''}`}>
                          {team2Name}
                        </span>
                        {isTeam2Resolved && team2Data ? <TeamFlag teamName={team2Key} size="lg" /> : <Trophy className="w-8 h-8 text-muted-foreground/50" />}
                      </div>
                    </div>

                    {/* Half-time score */}
                    {(liveScore?.scoreHalftimeHome !== null && liveScore?.scoreHalftimeHome !== undefined && status === 'live') && (
                      <p className="text-center text-[10px] text-muted-foreground mt-1">
                        نتيجة الشوط الأول: {toArabicDigits(liveScore.scoreHalftimeHome!)} - {toArabicDigits(liveScore.scoreHalftimeAway!)}
                      </p>
                    )}
                  </div>

                  {/* Expandable API data section */}
                  {hasExpandableData && (
                    <div className="border-t border-border/10">
                      <button
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                        onClick={() => toggleExpand(match.id)}
                      >
                        <PlayCircle className="w-3 h-3" />
                        <span>{isExpanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {isExpanded && (
                        <div>
                          {/* Events Timeline */}
                          {events && events.length > 0 && (
                            <EventsTimeline events={events} homeTeam={team1Name} awayTeam={team2Name} />
                          )}
                          {/* Statistics */}
                          {stats && stats.length >= 2 && (
                            <MatchStatisticsView stats={stats} />
                          )}
                          {/* Lineups */}
                          {lineups && lineups.length >= 2 && (
                            <MatchLineupsView lineups={lineups} />
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="px-4 py-2 bg-muted/20 border-t border-border/10 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3" />
                      <span>{match.venueAr}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{formatMatchSaudiDateAr(match.date, match.time || '', match.venue)}</span>
                      {liveScore?.referee && (
                        <span className="text-[10px]">| حكم: {liveScore.referee}</span>
                      )}
                    </div>
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
            <p className="text-sm text-muted-foreground/70 max-w-md">لا توجد مباريات مجدولة في هذا اليوم. تصفح المباريات القادمة أدناه.</p>
          </div>
        </Card>
      )}

      {/* Next Upcoming Matches */}
      {upcomingMatches.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1.5 h-7 bg-[#FFD700] rounded-full" />
            <h3 className="text-lg font-bold text-[#002868] dark:text-blue-400">المباريات القادمة</h3>
            <Badge variant="secondary" className="bg-[#FFD700]/10 text-[#D4A017]">أقرب {toArabicDigits(upcomingMatches.length)} مباريات</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingMatches.map(({ match, utcDate }) => {
              const isKnockout = match.round !== 'group';
              const team1Resolved = isKnockout && match.team1Ref ? resolveTeamRef(match.team1Ref, standings, thirdPlaceRanking, results) : null;
              const team2Resolved = isKnockout && match.team2Ref ? resolveTeamRef(match.team2Ref, standings, thirdPlaceRanking, results) : null;
              const team1Key = team1Resolved || match.team1;
              const team2Key = team2Resolved || match.team2;
              const team1Name = isKnockout ? (team1Resolved ? (TEAMS[team1Resolved]?.nameAr || team1Resolved) : getTeamRefDisplayName(match.team1Ref || match.team1)) : (TEAMS[match.team1]?.nameAr || match.team1);
              const team2Name = isKnockout ? (team2Resolved ? (TEAMS[team2Resolved]?.nameAr || team2Resolved) : getTeamRefDisplayName(match.team2Ref || match.team2)) : (TEAMS[match.team2]?.nameAr || match.team2);
              const team1Data = TEAMS[team1Key];
              const team2Data = TEAMS[team2Key];
              const isTeam1Resolved = !isKnockout || !!team1Resolved;
              const isTeam2Resolved = !isKnockout || !!team2Resolved;

              const now = Date.now();
              const diffMs = utcDate.getTime() - now;
              const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
              const diffHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
              const diffMins = Math.floor((diffMs / (1000 * 60)) % 60);

              let timeUntil = '';
              if (diffDays > 0) timeUntil = `بعد ${toArabicDigits(diffDays)} يوم و ${toArabicDigits(diffHours)} ساعة`;
              else if (diffHours > 0) timeUntil = `بعد ${toArabicDigits(diffHours)} ساعة و ${toArabicDigits(diffMins)} دقيقة`;
              else timeUntil = `بعد ${toArabicDigits(diffMins)} دقيقة`;

              return (
                <Card key={match.id} className="p-4 border-border/50 cursor-pointer hover:shadow-md transition-all bg-card/80" onClick={() => onMatchClick(match.id)}>
                  <div className="flex items-center justify-between mb-3">
                    {match.group ? (
                      <Badge variant="secondary" className="text-xs bg-[#002868]/10 text-[#002868] border-0">{GROUP_NAMES_AR[match.group]}</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs bg-[#E31837]/10 text-[#E31837] border-0">{ROUND_NAMES_AR[match.round]}</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">مباراة {toArabicDigits(match.id)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {isTeam1Resolved && team1Data ? <TeamFlag teamName={team1Key} size="md" /> : <Trophy className="w-5 h-5 text-muted-foreground/50" />}
                      <span className={`text-xs font-bold truncate ${!isTeam1Resolved ? 'text-muted-foreground italic' : ''}`}>{team1Name}</span>
                    </div>
                    <span className="text-[#FFD700] text-xs font-bold">ضد</span>
                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                      <span className={`text-xs font-bold truncate ${!isTeam2Resolved ? 'text-muted-foreground italic' : ''}`}>{team2Name}</span>
                      {isTeam2Resolved && team2Data ? <TeamFlag teamName={team2Key} size="md" /> : <Trophy className="w-5 h-5 text-muted-foreground/50" />}
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
