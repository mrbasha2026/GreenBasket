'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TEAMS, MATCHES, GROUP_NAMES_AR, ROUND_NAMES_AR, THIRD_PLACE_ELIGIBLE_GROUPS, getTeamRefDisplayName } from '@/lib/wc2026-data';
import { formatDateAr, formatMatchLocalTime, calculateGroupStandings, calculateThirdPlaceRanking } from '@/lib/wc2026-logic';
import { useWC2026Store } from '@/store/wc2026-store';
import { TeamFlag } from './TeamFlag';
import { Star, Clock } from 'lucide-react';

interface MatchCardProps {
  matchId: number;
  onMatchClick: (matchId: number) => void;
}

// Resolve team ref to actual team name
function resolveTeamRefForCard(
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
    const t1 = resolveTeamRefForCard(m.team1Ref || m.team1, standings, thirdPlaceRanking, results) || m.team1;
    const t2 = resolveTeamRefForCard(m.team2Ref || m.team2, standings, thirdPlaceRanking, results) || m.team2;
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
    const t1 = resolveTeamRefForCard(m.team1Ref || m.team1, standings, thirdPlaceRanking, results) || m.team1;
    const t2 = resolveTeamRefForCard(m.team2Ref || m.team2, standings, thirdPlaceRanking, results) || m.team2;
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

export function MatchCard({ matchId, onMatchClick }: MatchCardProps) {
  const { results, favoriteMatches, toggleFavoriteMatch } = useWC2026Store();

  // Calculate standings for resolving knockout team refs - MUST be before any early return (React Hooks rule)
  const standings = useMemo(() => calculateGroupStandings(results), [results]);
  const thirdPlaceRanking = useMemo(() => calculateThirdPlaceRanking(standings), [standings]);

  const match = MATCHES.find(m => m.id === matchId);
  if (!match) return null;

  const result = results[matchId];
  const isKnockout = match.round !== 'group';
  const isFavorite = favoriteMatches.has(matchId);
  const hasResult = !!result;

  // For knockout matches, resolve team refs
  const team1Resolved = isKnockout && match.team1Ref
    ? resolveTeamRefForCard(match.team1Ref, standings, thirdPlaceRanking, results)
    : null;
  const team2Resolved = isKnockout && match.team2Ref
    ? resolveTeamRefForCard(match.team2Ref, standings, thirdPlaceRanking, results)
    : null;

  // Team 1 display
  const team1Key = team1Resolved || match.team1;
  const team1Name = isKnockout
    ? (team1Resolved
        ? (TEAMS[team1Resolved]?.nameAr || team1Resolved)
        : getTeamRefDisplayName(match.team1Ref || match.team1))
    : (TEAMS[match.team1]?.nameAr || match.team1);

  // Team 2 display
  const team2Key = team2Resolved || match.team2;
  const team2Name = isKnockout
    ? (team2Resolved
        ? (TEAMS[team2Resolved]?.nameAr || team2Resolved)
        : getTeamRefDisplayName(match.team2Ref || match.team2))
    : (TEAMS[match.team2]?.nameAr || match.team2);

  const isTeam1Resolved = !isKnockout || !!team1Resolved;
  const isTeam2Resolved = !isKnockout || !!team2Resolved;

  // For knockout resolved teams, show the team info from the resolved key
  const team1Data = TEAMS[team1Key];
  const team2Data = TEAMS[team2Key];

  const isDraw = result ? (result.homeGoals === result.awayGoals && (result.homePenalties === undefined || result.awayPenalties === undefined || result.homePenalties === result.awayPenalties)) : false;
  const isTeam1Winner = result ? (
    result.homeGoals > result.awayGoals ||
    (result.homeGoals === result.awayGoals && result.homePenalties !== undefined && result.awayPenalties !== undefined && result.homePenalties > result.awayPenalties)
  ) : false;
  const isTeam2Winner = result ? (
    result.awayGoals > result.homeGoals ||
    (result.homeGoals === result.awayGoals && result.homePenalties !== undefined && result.awayPenalties !== undefined && result.awayPenalties > result.homePenalties)
  ) : false;
  const isTeam1Loser = result ? (!isTeam1Winner && !isDraw) : false;
  const isTeam2Loser = result ? (!isTeam2Winner && !isDraw) : false;

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all duration-200 border-border/50 hover:border-[#FFD700]/50 bg-card/80 backdrop-blur-sm overflow-hidden group !py-0 !gap-0"
      onClick={() => onMatchClick(matchId)}
    >
      {/* Match header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gradient-to-l from-[#002868]/10 to-[#002868]/5 border-b border-border/30">
        <span className="text-xs text-muted-foreground font-medium">
          مباراة {matchId}
        </span>
        <div className="flex items-center gap-1">
          {match.group && (
            <Badge variant="secondary" className="text-xs bg-[#002868]/10 text-[#002868] hover:bg-[#002868]/20 border-0">
              {GROUP_NAMES_AR[match.group]}
            </Badge>
          )}
          {!match.group && (
            <Badge variant="secondary" className="text-xs bg-[#E31837]/10 text-[#E31837] hover:bg-[#E31837]/20 border-0">
              {ROUND_NAMES_AR[match.round]}
            </Badge>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavoriteMatch(matchId);
            }}
            className="p-0.5 hover:scale-110 transition-transform"
            title={isFavorite ? 'إزالة من المفضلة' : 'أضف إلى المفضلة'}
          >
            <Star
              className={`w-3.5 h-3.5 ${
                isFavorite
                  ? 'fill-[#FFD700] text-[#FFD700]'
                  : 'text-muted-foreground/50 hover:text-[#FFD700]'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Teams and score */}
      <div className="px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          {/* Team 1 */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isTeam1Resolved && team1Data ? (
              <TeamFlag teamName={team1Key} size="md" />
            ) : (
              <span className="text-lg">🏆</span>
            )}
            <span className={`text-sm font-medium truncate ${!isTeam1Resolved ? 'text-muted-foreground italic' : ''} ${isTeam1Winner ? 'text-[#00A651] font-bold' : ''} ${isTeam1Loser ? 'text-[#E31837] font-bold' : ''} ${isDraw ? 'text-[#D4A017] font-bold' : ''}`}>
              {team1Name}
            </span>
          </div>

          {/* Score */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {hasResult ? (
              <div className="flex items-center gap-1">
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-md ${isTeam1Winner ? 'bg-[#00A651]' : isTeam1Loser ? 'bg-[#E31837]' : isDraw ? 'bg-[#D4A017]' : 'bg-[#002868]'} text-white font-bold text-sm`}>
                  {result.homeGoals}
                </span>
                <span className="text-muted-foreground text-xs">-</span>
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-md ${isTeam2Winner ? 'bg-[#00A651]' : isTeam2Loser ? 'bg-[#E31837]' : isDraw ? 'bg-[#D4A017]' : 'bg-[#002868]'} text-white font-bold text-sm`}>
                  {result.awayGoals}
                </span>
                {result.homePenalties !== undefined && result.awayPenalties !== undefined && (
                  <span className="text-xs text-amber-600 font-medium mr-1">
                    ({result.homePenalties}-{result.awayPenalties} ترجيح)
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-md border-2 border-dashed border-muted-foreground/30 text-muted-foreground text-xs">
                  -
                </span>
                <span className="text-muted-foreground text-xs">-</span>
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-md border-2 border-dashed border-muted-foreground/30 text-muted-foreground text-xs">
                  -
                </span>
              </div>
            )}
          </div>

          {/* Team 2 */}
          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
            <span className={`text-sm font-medium truncate ${!isTeam2Resolved ? 'text-muted-foreground italic' : ''} ${isTeam2Winner ? 'text-[#00A651] font-bold' : ''} ${isTeam2Loser ? 'text-[#E31837] font-bold' : ''} ${isDraw ? 'text-[#D4A017] font-bold' : ''}`}>
              {team2Name}
            </span>
            {isTeam2Resolved && team2Data ? (
              <TeamFlag teamName={team2Key} size="md" />
            ) : (
              <span className="text-lg">🏆</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer - time, date and venue */}
      <div className="px-3 py-1.5 bg-muted/30 border-t border-border/20">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {match.time && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#002868]/10 text-[#002868] font-bold text-[11px]">
                <Clock className="w-2.5 h-2.5" />
                {formatMatchLocalTime(match.date, match.time, match.venue)}
              </span>
            )}
            <span>{formatDateAr(match.date)}</span>
          </div>
          <span className="truncate mr-2">{match.venueAr}</span>
        </div>
      </div>
    </Card>
  );
}
