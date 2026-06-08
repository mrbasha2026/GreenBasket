'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { TEAMS, MATCHES, ROUND_NAMES_AR, THIRD_PLACE_ELIGIBLE_GROUPS, getTeamRefDisplayName } from '@/lib/wc2026-data';
import { MatchResult, calculateGroupStandings, calculateThirdPlaceRanking } from '@/lib/wc2026-logic';
import { useWC2026Store } from '@/store/wc2026-store';

interface KnockoutBracketProps {
  onMatchClick: (matchId: number) => void;
}

function resolveTeamRef(
  ref: string,
  standings: ReturnType<typeof calculateGroupStandings>,
  thirdPlaceRanking: ReturnType<typeof calculateThirdPlaceRanking>,
  results: Record<number, MatchResult>,
): string | null {
  // Group winner
  const winnerMatch = ref.match(/^1([A-L])$/);
  if (winnerMatch) {
    const group = winnerMatch[1];
    const gs = standings[group];
    if (gs && gs.length > 0 && gs[0].played > 0) return gs[0].team;
    return null;
  }
  // Group runner-up
  const runnerUpMatch = ref.match(/^2([A-L])$/);
  if (runnerUpMatch) {
    const group = runnerUpMatch[1];
    const gs = standings[group];
    if (gs && gs.length > 1 && gs[1].played > 0) return gs[1].team;
    return null;
  }
  // Third place reference
  const thirdPlaceRefMatch = ref.match(/^3(.+)$/);
  if (thirdPlaceRefMatch) {
    const eligibleGroups = THIRD_PLACE_ELIGIBLE_GROUPS[ref];
    if (!eligibleGroups) return null;
    const usedGroups = new Set<string>();
    const slots = ['3ABCDf','3CDFGH','3CEfHI','3EHIJK','3BEFIJ','3AEHIJ','3EFGIJ','3DEIJL'];
    for (const slot of slots) {
      const slotEligible = THIRD_PLACE_ELIGIBLE_GROUPS[slot] || [];
      for (const tp of thirdPlaceRanking) {
        if (slotEligible.includes(tp.group) && !usedGroups.has(tp.group)) {
          usedGroups.add(tp.group);
          if (slot === ref) return tp.team;
          break;
        }
      }
    }
    return null;
  }
  // Winner of a match
  const winnerOfMatch = ref.match(/^W(\d+)$/);
  if (winnerOfMatch) {
    const matchId = parseInt(winnerOfMatch[1]);
    const r = results[matchId];
    if (!r) return null;
    const m = MATCHES.find(x => x.id === matchId);
    if (!m) return null;
    if (r.homeGoals > r.awayGoals) return m.team1;
    if (r.awayGoals > r.homeGoals) return m.team2;
    if (r.homePenalties !== undefined && r.awayPenalties !== undefined) {
      if (r.homePenalties > r.awayPenalties) return m.team1;
      if (r.awayPenalties > r.homePenalties) return m.team2;
    }
    return null;
  }
  // Loser of a match
  const loserOfMatch = ref.match(/^L(\d+)$/);
  if (loserOfMatch) {
    const matchId = parseInt(loserOfMatch[1]);
    const r = results[matchId];
    if (!r) return null;
    const m = MATCHES.find(x => x.id === matchId);
    if (!m) return null;
    if (r.homeGoals < r.awayGoals) return m.team1;
    if (r.awayGoals < r.homeGoals) return m.team2;
    if (r.homePenalties !== undefined && r.awayPenalties !== undefined) {
      if (r.homePenalties < r.awayPenalties) return m.team1;
      if (r.awayPenalties > r.homePenalties) return m.team2;
    }
    return null;
  }
  return null;
}

function KnockoutMatchCard({
  matchId,
  onMatchClick,
  standings,
  thirdPlaceRanking,
  results,
}: {
  matchId: number;
  onMatchClick: (id: number) => void;
  standings: ReturnType<typeof calculateGroupStandings>;
  thirdPlaceRanking: ReturnType<typeof calculateThirdPlaceRanking>;
  results: Record<number, MatchResult>;
}) {
  const match = MATCHES.find(m => m.id === matchId);
  if (!match) return null;

  const result = results[matchId];

  // Resolve team names
  const team1Ref = match.team1Ref || match.team1;
  const team2Ref = match.team2Ref || match.team2;
  const team1Resolved = resolveTeamRef(team1Ref, standings, thirdPlaceRanking, results);
  const team2Resolved = resolveTeamRef(team2Ref, standings, thirdPlaceRanking, results);

  const team1Name = team1Resolved ? (TEAMS[team1Resolved]?.nameAr || team1Resolved) : getTeamRefDisplayName(team1Ref);
  const team2Name = team2Resolved ? (TEAMS[team2Resolved]?.nameAr || team2Resolved) : getTeamRefDisplayName(team2Ref);
  const team1Flag = team1Resolved ? (TEAMS[team1Resolved]?.flag || '🏆') : '🏆';
  const team2Flag = team2Resolved ? (TEAMS[team2Resolved]?.flag || '🏆') : '🏆';

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
      className="cursor-pointer hover:shadow-lg transition-all duration-200 border-border/50 bg-card/90 overflow-hidden min-w-[220px] !py-0 !gap-0"
      onClick={() => onMatchClick(matchId)}
    >
      <div className="bg-gradient-to-l from-[#002868]/15 to-[#002868]/5 px-2 py-1 border-b border-border/20 text-center">
        <span className="text-[10px] font-semibold text-[#002868]">
          مباراة {matchId}
        </span>
      </div>

      {/* Team 1 */}
      <div className={`flex items-center justify-between px-2 py-1.5 border-b border-border/10 ${isTeam1Winner ? 'bg-[#00A651]/8' : ''}`}>
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="text-sm">{team1Flag}</span>
          <span className={`text-[11px] font-medium truncate ${!team1Resolved ? 'text-muted-foreground italic' : ''} ${isTeam1Winner ? 'text-[#00A651] font-bold' : ''}`}>
            {team1Name}
          </span>
        </div>
        <span className="text-sm font-bold w-5 text-center">
          {result ? result.homeGoals : '-'}
        </span>
      </div>

      {/* Team 2 */}
      <div className={`flex items-center justify-between px-2 py-1.5 ${isTeam2Winner ? 'bg-[#00A651]/8' : ''}`}>
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="text-sm">{team2Flag}</span>
          <span className={`text-[11px] font-medium truncate ${!team2Resolved ? 'text-muted-foreground italic' : ''} ${isTeam2Winner ? 'text-[#00A651] font-bold' : ''}`}>
            {team2Name}
          </span>
        </div>
        <span className="text-sm font-bold w-5 text-center">
          {result ? result.awayGoals : '-'}
        </span>
      </div>

      {/* Penalties */}
      {result && result.homePenalties !== undefined && result.awayPenalties !== undefined && (
        <div className="px-2 py-0.5 bg-amber-50 text-center">
          <span className="text-[10px] text-amber-700">
            ترجيح: {result.homePenalties}-{result.awayPenalties}
          </span>
        </div>
      )}

      {/* Venue */}
      <div className="px-2 py-0.5 bg-muted/20 border-t border-border/10 text-center">
        <span className="text-[9px] text-muted-foreground">{match.venueAr}</span>
      </div>
    </Card>
  );
}

export function KnockoutBracket({ onMatchClick }: KnockoutBracketProps) {
  const { results } = useWC2026Store();
  const standings = useMemo(() => calculateGroupStandings(results), [results]);
  const thirdPlaceRanking = useMemo(() => calculateThirdPlaceRanking(standings), [standings]);

  const rounds = [
    { key: 'r32', name: ROUND_NAMES_AR['r32'], matchIds: MATCHES.filter(m => m.round === 'r32').map(m => m.id) },
    { key: 'r16', name: ROUND_NAMES_AR['r16'], matchIds: MATCHES.filter(m => m.round === 'r16').map(m => m.id) },
    { key: 'qf', name: ROUND_NAMES_AR['qf'], matchIds: MATCHES.filter(m => m.round === 'qf').map(m => m.id) },
    { key: 'sf', name: ROUND_NAMES_AR['sf'], matchIds: MATCHES.filter(m => m.round === 'sf').map(m => m.id) },
    { key: '3rd', name: ROUND_NAMES_AR['3rd'], matchIds: MATCHES.filter(m => m.round === '3rd').map(m => m.id) },
    { key: 'final', name: ROUND_NAMES_AR['final'], matchIds: MATCHES.filter(m => m.round === 'final').map(m => m.id) },
  ];

  return (
    <div className="space-y-6">
      {/* Third Place Ranking Summary */}
      {thirdPlaceRanking.some(tp => tp.points > 0) && (
        <Card className="p-4 border-[#FFD700]/30 bg-[#FFD700]/5 !py-4">
          <h3 className="text-sm font-bold text-[#002868] mb-3 text-center">
            🏅 ترتيب فرق المركز الثالث
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {thirdPlaceRanking.map((tp, idx) => {
              const teamData = TEAMS[tp.team];
              const isQualified = idx < 8;
              return (
                <div
                  key={tp.group}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs ${
                    isQualified ? 'bg-[#00A651]/10 border border-[#00A651]/30' : 'bg-muted/30 border border-border/30'
                  }`}
                >
                  <span className="font-bold text-muted-foreground w-4">{idx + 1}</span>
                  <span>{teamData?.flag}</span>
                  <span className="truncate font-medium">{teamData?.nameAr}</span>
                  <span className="mr-auto font-bold text-[#002868]">{tp.points}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Bracket visualization */}
      <div className="overflow-x-auto pb-4">
        <div className="inline-flex gap-4 min-w-max items-stretch">
          {rounds.map((round, roundIdx) => {
            // Calculate vertical spacing to align matches
            const matchCount = round.matchIds.length;
            const prevRoundCount = roundIdx > 0 ? rounds[roundIdx - 1].matchIds.length : 0;
            // Each match takes a fixed height, spacing increases with each round
            const matchSpacing = roundIdx === 0 ? '8px' : roundIdx === 1 ? '20px' : roundIdx === 2 ? '44px' : '80px';

            return (
              <div key={round.key} className="flex flex-col">
                {/* Round header */}
                <div className="bg-gradient-to-l from-[#002868] to-[#002868]/80 px-3 py-2 rounded-lg text-center mb-3 flex-shrink-0">
                  <h3 className="text-white font-bold text-xs">{round.name}</h3>
                </div>

                {/* Matches */}
                <div className="flex flex-col flex-1 justify-around" style={{ gap: matchSpacing }}>
                  {round.matchIds.map(matchId => (
                    <KnockoutMatchCard
                      key={matchId}
                      matchId={matchId}
                      onMatchClick={onMatchClick}
                      standings={standings}
                      thirdPlaceRanking={thirdPlaceRanking}
                      results={results}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
