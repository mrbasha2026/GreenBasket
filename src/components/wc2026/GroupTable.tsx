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
  const qualifiedThirdGroups = thirdPlaceRanking.slice(0, 8).map(tp => tp.group);

  return (
    <Card className="overflow-hidden border-border/50 shadow-md hover:shadow-lg transition-shadow">
      {/* Group header */}
      <div className="bg-gradient-to-l from-[#002868] to-[#002868]/90 px-4 py-2.5">
        <h3 className="text-white font-bold text-base text-center tracking-wide">
          {GROUP_NAMES_AR[group]}
        </h3>
      </div>

      {/* Table */}
      <div>
        <table className="w-full text-xs table-fixed">
          <thead>
            <tr className="bg-muted/50 border-b border-border/30">
              <th className="px-1 py-1.5 text-center font-semibold text-muted-foreground w-6">#</th>
              <th className="px-1 py-1.5 text-right font-semibold text-muted-foreground w-5"></th>
              <th className="px-1 py-1.5 text-right font-semibold text-muted-foreground">المنتخب</th>
              <th className="px-1 py-1.5 text-center font-semibold text-muted-foreground w-7">لعب</th>
              <th className="px-1 py-1.5 text-center font-semibold text-muted-foreground w-7">فوز</th>
              <th className="px-1 py-1.5 text-center font-semibold text-muted-foreground w-7">تعادل</th>
              <th className="px-1 py-1.5 text-center font-semibold text-muted-foreground w-7">خسارة</th>
              <th className="px-1 py-1.5 text-center font-semibold text-muted-foreground w-7">له</th>
              <th className="px-1 py-1.5 text-center font-semibold text-muted-foreground w-7">عليه</th>
              <th className="px-1 py-1.5 text-center font-semibold text-muted-foreground w-7">الفرق</th>
              <th className="px-1 py-1.5 text-center font-bold text-[#002868] w-8">النقاط</th>
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
              if (isQualified) rowBg = 'bg-[#00A651]/5';
              else if (isThirdPlace) rowBg = 'bg-[#FFD700]/10';
              else if (isEliminated) rowBg = 'bg-[#E31837]/5';

              return (
                <tr
                  key={team.team}
                  className={`border-b border-border/20 hover:bg-muted/30 transition-colors ${rowBg}`}
                >
                  <td className="px-1 py-1.5 text-center">
                    <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${
                      isQualified ? 'bg-[#00A651] text-white' :
                      isThirdPlace ? 'bg-[#FFD700] text-[#002868]' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="px-1 py-1.5 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoriteTeam(team.team);
                      }}
                      className="p-0 hover:scale-110 transition-transform"
                      title={isFavorite ? 'إزالة من المفضلة' : 'أضف إلى المفضلة'}
                    >
                      <Star
                        className={`w-3 h-3 ${
                          isFavorite
                            ? 'fill-[#FFD700] text-[#FFD700]'
                            : 'text-muted-foreground/40 hover:text-[#FFD700]'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-1 py-1.5">
                    <div className="flex items-center gap-1">
                      <TeamFlag teamName={team.team} size="sm" />
                      <span className="font-medium text-[11px] truncate">{teamData?.nameAr || team.team}</span>
                      {isQualified && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00A651] flex-shrink-0" title="متأهل" />
                      )}
                      {isThirdPlace && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] flex-shrink-0" title="أفضل ثالث" />
                      )}
                    </div>
                  </td>
                  <td className="px-1 py-1.5 text-center text-[11px]">{team.played}</td>
                  <td className="px-1 py-1.5 text-center text-[11px]">{team.won}</td>
                  <td className="px-1 py-1.5 text-center text-[11px]">{team.drawn}</td>
                  <td className="px-1 py-1.5 text-center text-[11px]">{team.lost}</td>
                  <td className="px-1 py-1.5 text-center text-[11px]">{team.goalsFor}</td>
                  <td className="px-1 py-1.5 text-center text-[11px]">{team.goalsAgainst}</td>
                  <td className="px-1 py-1.5 text-center text-[11px] font-medium" style={{
                    color: team.goalDifference > 0 ? '#00A651' : team.goalDifference < 0 ? '#E31837' : 'inherit'
                  }}>
                    {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                  </td>
                  <td className="px-1 py-1.5 text-center">
                    <span className="font-bold text-xs text-[#002868]">{team.points}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      {standings.some(s => s.played > 0) && (
        <div className="px-3 py-1.5 bg-muted/20 border-t border-border/20 flex items-center gap-3 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#00A651]" />
            <span>متأهل</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#FFD700]" />
            <span>أفضل ثالث</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#E31837]/50" />
            <span>مستبعد</span>
          </div>
        </div>
      )}
    </Card>
  );
}