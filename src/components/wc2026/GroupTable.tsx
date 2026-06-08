'use client';

import { Card } from '@/components/ui/card';
import { TEAMS, GROUP_NAMES_AR } from '@/lib/wc2026-data';
import { GroupStanding } from '@/lib/wc2026-data';
import { calculateThirdPlaceRanking, getQualifiedThirdPlaceTeams } from '@/lib/wc2026-logic';
import { useWC2026Store } from '@/store/wc2026-store';
import { TeamFlag } from './TeamFlag';
import { Star } from 'lucide-react';

interface GroupTableProps {
  group: string;
  standings: GroupStanding[];
  allStandings: Record<string, GroupStanding[]>;
}

export function GroupTable({ group, standings, allStandings }: GroupTableProps) {
  const { favoriteTeams, toggleFavoriteTeam } = useWC2026Store();
  const thirdPlaceRanking = calculateThirdPlaceRanking(allStandings);
  const qualifiedThird = getQualifiedThirdPlaceTeams(thirdPlaceRanking);

  return (
    <Card className="overflow-hidden border-border/50 shadow-md hover:shadow-lg transition-shadow">
      {/* Group header - more prominent */}
      <div className="bg-gradient-to-l from-[#002868] to-[#002868]/90 px-5 py-3 flex items-center justify-between">
        <h3 className="text-white font-bold text-lg tracking-wide">
          {GROUP_NAMES_AR[group]}
        </h3>
        <span className="text-white/60 text-xs font-medium">4 منتخبات</span>
      </div>

      {/* Table - natural layout with min-widths */}
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-muted/50 border-b-2 border-border/40">
              <th className="px-2 py-2 text-center font-semibold text-muted-foreground min-w-[28px]">#</th>
              <th className="px-1 py-2 text-center min-w-[24px]"></th>
              <th className="px-2 py-2 text-right font-semibold text-muted-foreground min-w-[120px]">المنتخب</th>
              <th className="px-2 py-2 text-center font-semibold text-muted-foreground min-w-[32px]">لعب</th>
              <th className="px-2 py-2 text-center font-semibold text-muted-foreground min-w-[32px]">فوز</th>
              <th className="px-2 py-2 text-center font-semibold text-muted-foreground min-w-[32px]">تعادل</th>
              <th className="px-2 py-2 text-center font-semibold text-muted-foreground min-w-[32px]">خسارة</th>
              <th className="px-2 py-2 text-center font-semibold text-muted-foreground min-w-[32px]">له</th>
              <th className="px-2 py-2 text-center font-semibold text-muted-foreground min-w-[32px]">عليه</th>
              <th className="px-2 py-2 text-center font-semibold text-muted-foreground min-w-[36px]">الفرق</th>
              <th className="px-2 py-2 text-center font-bold text-[#002868] min-w-[40px]">النقاط</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team, idx) => {
              const teamData = TEAMS[team.team];
              const isQualified = idx < 2;
              const isThirdPlace = idx === 2 && qualifiedThird.includes(team.team);
              const isEliminated = idx === 3 || (idx === 2 && !isThirdPlace && team.played > 0);
              const isFavorite = favoriteTeams.has(team.team);

              let rowBg = '';
              let borderLeftColor = '';
              if (isQualified) {
                rowBg = 'bg-[#00A651]/5';
                borderLeftColor = 'border-r-[3px] border-r-[#00A651]';
              }
              else if (isThirdPlace) {
                rowBg = 'bg-[#FFD700]/10';
                borderLeftColor = 'border-r-[3px] border-r-[#FFD700]';
              }
              else if (isEliminated) {
                rowBg = 'bg-[#E31837]/5';
                borderLeftColor = 'border-r-[3px] border-r-[#E31837]/50';
              }

              return (
                <tr
                  key={team.team}
                  className={`border-b border-border/20 hover:bg-muted/30 transition-colors ${rowBg} ${borderLeftColor}`}
                >
                  <td className="px-2 py-2.5 text-center">
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold ${
                      isQualified ? 'bg-[#00A651] text-white' :
                      isThirdPlace ? 'bg-[#FFD700] text-[#002868]' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="px-1 py-2.5 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoriteTeam(team.team);
                      }}
                      className="p-0 hover:scale-110 transition-transform"
                      title={isFavorite ? 'إزالة من المفضلة' : 'أضف إلى المفضلة'}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          isFavorite
                            ? 'fill-[#FFD700] text-[#FFD700]'
                            : 'text-muted-foreground/40 hover:text-[#FFD700]'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <TeamFlag teamName={team.team} size="sm" />
                      <span className="font-medium text-[13px] truncate">{teamData?.nameAr || team.team}</span>
                      {isQualified && (
                        <span className="w-2 h-2 rounded-full bg-[#00A651] flex-shrink-0" title="متأهل" />
                      )}
                      {isThirdPlace && (
                        <span className="w-2 h-2 rounded-full bg-[#FFD700] flex-shrink-0" title="أفضل ثالث" />
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2.5 text-center text-[13px]">{team.played}</td>
                  <td className="px-2 py-2.5 text-center text-[13px] text-[#00A651] font-medium">{team.won}</td>
                  <td className="px-2 py-2.5 text-center text-[13px]">{team.drawn}</td>
                  <td className="px-2 py-2.5 text-center text-[13px] text-[#E31837] font-medium">{team.lost}</td>
                  <td className="px-2 py-2.5 text-center text-[13px]">{team.goalsFor}</td>
                  <td className="px-2 py-2.5 text-center text-[13px]">{team.goalsAgainst}</td>
                  <td className="px-2 py-2.5 text-center text-[13px] font-semibold" style={{
                    color: team.goalDifference > 0 ? '#00A651' : team.goalDifference < 0 ? '#E31837' : 'inherit'
                  }}>
                    {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <span className="font-bold text-sm text-[#002868]">{team.points}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      {standings.some(s => s.played > 0) && (
        <div className="px-4 py-2 bg-muted/20 border-t border-border/20 flex items-center gap-4 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00A651]" />
            <span>متأهل</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFD700]" />
            <span>أفضل ثالث</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E31837]/50" />
            <span>مستبعد</span>
          </div>
        </div>
      )}
    </Card>
  );
}
