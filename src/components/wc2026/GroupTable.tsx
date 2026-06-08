'use client';

import { Card } from '@/components/ui/card';
import { TEAMS, GROUP_NAMES_AR } from '@/lib/wc2026-data';
import { GroupStanding } from '@/lib/wc2026-data';
import { calculateThirdPlaceRanking, getQualifiedThirdPlaceTeams } from '@/lib/wc2026-logic';
import { TeamFlag } from './TeamFlag';

interface GroupTableProps {
  group: string;
  standings: GroupStanding[];
  allStandings: Record<string, GroupStanding[]>;
}

export function GroupTable({ group, standings, allStandings }: GroupTableProps) {
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
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border/30">
              <th className="px-2 py-2 text-center font-semibold text-muted-foreground w-8">#</th>
              <th className="px-2 py-2 text-right font-semibold text-muted-foreground">المنتخب</th>
              <th className="px-2 py-2 text-center font-semibold text-muted-foreground w-8">لعب</th>
              <th className="px-2 py-2 text-center font-semibold text-muted-foreground w-8">فوز</th>
              <th className="px-2 py-2 text-center font-semibold text-muted-foreground w-8">تعادل</th>
              <th className="px-2 py-2 text-center font-semibold text-muted-foreground w-8">خسارة</th>
              <th className="px-2 py-2 text-center font-semibold text-muted-foreground w-8">له</th>
              <th className="px-2 py-2 text-center font-semibold text-muted-foreground w-8">عليه</th>
              <th className="px-2 py-2 text-center font-semibold text-muted-foreground w-8">الفرق</th>
              <th className="px-2 py-2 text-center font-semibold text-bold text-[#002868] w-10">النقاط</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team, idx) => {
              const teamData = TEAMS[team.team];
              const isQualified = idx < 2;
              const isThirdPlace = idx === 2 && qualifiedThird.includes(team.team);
              const isEliminated = idx === 3 || (idx === 2 && !isThirdPlace && team.played > 0);

              let rowBg = '';
              if (isQualified) rowBg = 'bg-[#00A651]/5';
              else if (isThirdPlace) rowBg = 'bg-[#FFD700]/10';
              else if (isEliminated) rowBg = 'bg-[#E31837]/5';

              return (
                <tr
                  key={team.team}
                  className={`border-b border-border/20 hover:bg-muted/30 transition-colors ${rowBg}`}
                >
                  <td className="px-2 py-2 text-center">
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                      isQualified ? 'bg-[#00A651] text-white' :
                      isThirdPlace ? 'bg-[#FFD700] text-[#002868]' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-1.5">
                      <TeamFlag teamName={team.team} size="sm" />
                      <span className="font-medium text-xs whitespace-nowrap">{teamData?.nameAr || team.team}</span>
                      {isQualified && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00A651] flex-shrink-0" title="متأهل" />
                      )}
                      {isThirdPlace && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] flex-shrink-0" title="أفضل ثالث" />
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-center text-xs">{team.played}</td>
                  <td className="px-2 py-2 text-center text-xs">{team.won}</td>
                  <td className="px-2 py-2 text-center text-xs">{team.drawn}</td>
                  <td className="px-2 py-2 text-center text-xs">{team.lost}</td>
                  <td className="px-2 py-2 text-center text-xs">{team.goalsFor}</td>
                  <td className="px-2 py-2 text-center text-xs">{team.goalsAgainst}</td>
                  <td className="px-2 py-2 text-center text-xs font-medium" style={{
                    color: team.goalDifference > 0 ? '#00A651' : team.goalDifference < 0 ? '#E31837' : 'inherit'
                  }}>
                    {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                  </td>
                  <td className="px-2 py-2 text-center">
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
        <div className="px-3 py-2 bg-muted/20 border-t border-border/20 flex items-center gap-3 text-xs text-muted-foreground">
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
