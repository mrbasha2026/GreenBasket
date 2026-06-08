'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TEAMS, MATCHES, GROUP_NAMES_AR, ROUND_NAMES_AR, getTeamRefDisplayName } from '@/lib/wc2026-data';
import { formatDateAr, formatTimeAr } from '@/lib/wc2026-logic';
import { useWC2026Store } from '@/store/wc2026-store';
import { TeamFlag } from './TeamFlag';
import { Star, Clock } from 'lucide-react';

interface MatchCardProps {
  matchId: number;
  onMatchClick: (matchId: number) => void;
}

export function MatchCard({ matchId, onMatchClick }: MatchCardProps) {
  const { results, favoriteMatches, toggleFavoriteMatch } = useWC2026Store();
  const match = MATCHES.find(m => m.id === matchId);
  if (!match) return null;

  const result = results[matchId];
  const isKnockout = match.round !== 'group';
  const isFavorite = favoriteMatches.has(matchId);

  // For knockout matches, resolve team names
  const team1Name = match.team1Ref ? (TEAMS[match.team1]?.nameAr || getTeamRefDisplayName(match.team1Ref)) : (TEAMS[match.team1]?.nameAr || match.team1);
  const team2Name = match.team2Ref ? (TEAMS[match.team2]?.nameAr || getTeamRefDisplayName(match.team2Ref)) : (TEAMS[match.team2]?.nameAr || match.team2);

  const isRef1 = !!match.team1Ref && !TEAMS[match.team1];
  const isRef2 = !!match.team2Ref && !TEAMS[match.team2];

  // For resolved knockout teams, use the actual team name for flag lookup
  const team1Key = match.team1Ref ? match.team1 : match.team1;
  const team2Key = match.team2Ref ? match.team2 : match.team2;

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
            {!isRef1 ? (
              <TeamFlag teamName={team1Key} size="md" />
            ) : (
              <span className="text-lg">🏆</span>
            )}
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
            {!isRef2 ? (
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
                {formatTimeAr(match.time)}
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
