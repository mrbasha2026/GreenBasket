'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TEAMS, MATCHES, GROUP_NAMES_AR, ROUND_NAMES_AR, getTeamRefDisplayName } from '@/lib/wc2026-data';
import { formatDateAr } from '@/lib/wc2026-logic';
import { useWC2026Store } from '@/store/wc2026-store';

interface MatchCardProps {
  matchId: number;
  onMatchClick: (matchId: number) => void;
}

export function MatchCard({ matchId, onMatchClick }: MatchCardProps) {
  const { results } = useWC2026Store();
  const match = MATCHES.find(m => m.id === matchId);
  if (!match) return null;

  const result = results[matchId];
  const isKnockout = match.round !== 'group';

  // For knockout matches, resolve team names
  const team1Name = match.team1Ref ? (TEAMS[match.team1]?.nameAr || getTeamRefDisplayName(match.team1Ref)) : (TEAMS[match.team1]?.nameAr || match.team1);
  const team2Name = match.team2Ref ? (TEAMS[match.team2]?.nameAr || getTeamRefDisplayName(match.team2Ref)) : (TEAMS[match.team2]?.nameAr || match.team2);
  const team1Flag = match.team1Ref ? (TEAMS[match.team1]?.flag || '🏆') : (TEAMS[match.team1]?.flag || '⚽');
  const team2Flag = match.team2Ref ? (TEAMS[match.team2]?.flag || '🏆') : (TEAMS[match.team2]?.flag || '⚽');

  // Check if teams are resolved for knockout
  const team1Resolved = !match.team1Ref || TEAMS[match.team1] !== undefined;
  const team2Resolved = !match.team2Ref || TEAMS[match.team2] !== undefined;
  const isRef1 = !!match.team1Ref && !TEAMS[match.team1];
  const isRef2 = !!match.team2Ref && !TEAMS[match.team2];

  const hasResult = !!result;

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
      </div>

      {/* Teams and score */}
      <div className="px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          {/* Team 1 */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-lg flex-shrink-0">{team1Flag}</span>
            <span className={`text-sm font-medium truncate ${isRef1 ? 'text-muted-foreground italic' : ''}`}>
              {team1Name}
            </span>
          </div>

          {/* Score */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {hasResult ? (
              <div className="flex items-center gap-1">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-[#002868] text-white font-bold text-sm">
                  {result.homeGoals}
                </span>
                <span className="text-muted-foreground text-xs">-</span>
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-[#002868] text-white font-bold text-sm">
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
            <span className={`text-sm font-medium truncate ${isRef2 ? 'text-muted-foreground italic' : ''}`}>
              {team2Name}
            </span>
            <span className="text-lg flex-shrink-0">{team2Flag}</span>
          </div>
        </div>
      </div>

      {/* Footer - date and venue */}
      <div className="px-3 py-1.5 bg-muted/30 border-t border-border/20">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatDateAr(match.date)}</span>
          <span className="truncate mr-2">{match.venueAr}</span>
        </div>
      </div>
    </Card>
  );
}
