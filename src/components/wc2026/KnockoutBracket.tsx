'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { TEAMS, MATCHES, ROUND_NAMES_AR, THIRD_PLACE_ELIGIBLE_GROUPS, getTeamRefDisplayName } from '@/lib/wc2026-data';
import { MatchResult, calculateGroupStandings, calculateThirdPlaceRanking } from '@/lib/wc2026-logic';
import { useWC2026Store } from '@/store/wc2026-store';
import { TeamFlag } from './TeamFlag';

interface KnockoutBracketProps {
  onMatchClick: (matchId: number) => void;
}

function resolveTeamRef(
  ref: string,
  standings: ReturnType<typeof calculateGroupStandings>,
  thirdPlaceRanking: ReturnType<typeof calculateThirdPlaceRanking>,
  results: Record<number, MatchResult>,
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
        if (slotEligible.includes(tp.group) && !usedGroups.has(tp.group)) {
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

interface BracketMatchProps {
  matchId: number;
  onMatchClick: (id: number) => void;
  standings: ReturnType<typeof calculateGroupStandings>;
  thirdPlaceRanking: ReturnType<typeof calculateThirdPlaceRanking>;
  results: Record<number, MatchResult>;
}

function BracketMatch({ matchId, onMatchClick, standings, thirdPlaceRanking, results }: BracketMatchProps) {
  const match = MATCHES.find(m => m.id === matchId);
  if (!match) return null;

  const result = results[matchId];

  const team1Ref = match.team1Ref || match.team1;
  const team2Ref = match.team2Ref || match.team2;
  const team1Resolved = resolveTeamRef(team1Ref, standings, thirdPlaceRanking, results);
  const team2Resolved = resolveTeamRef(team2Ref, standings, thirdPlaceRanking, results);

  const team1Name = team1Resolved ? (TEAMS[team1Resolved]?.nameAr || team1Resolved) : getTeamRefDisplayName(team1Ref);
  const team2Name = team2Resolved ? (TEAMS[team2Resolved]?.nameAr || team2Resolved) : getTeamRefDisplayName(team2Ref);
  const team1Key = team1Resolved || '';
  const team2Key = team2Resolved || '';

  const isTeam1Winner = result ? (
    result.homeGoals > result.awayGoals ||
    (result.homeGoals === result.awayGoals && result.homePenalties !== undefined && result.awayPenalties !== undefined && result.homePenalties > result.awayPenalties)
  ) : false;
  const isTeam2Winner = result ? (
    result.awayGoals > result.homeGoals ||
    (result.homeGoals === result.awayGoals && result.homePenalties !== undefined && result.awayPenalties !== undefined && result.awayPenalties > result.homePenalties)
  ) : false;

  return (
    <div
      className="cursor-pointer hover:shadow-xl transition-all duration-200 bg-white rounded-xl border border-gray-200/80 overflow-hidden min-w-[240px] shadow-sm hover:border-[#FFD700]/60"
      onClick={() => onMatchClick(matchId)}
    >
      {/* Header */}
      <div className="bg-gradient-to-l from-[#002868] to-[#1a3f8f] px-3 py-1.5 flex items-center justify-between">
        <span className="text-white text-[10px] font-bold">{ROUND_NAMES_AR[match.round]}</span>
        <span className="text-white/70 text-[10px]">مباراة {matchId}</span>
      </div>

      {/* Team 1 */}
      <div className={`flex items-center justify-between px-3 py-2 border-b border-gray-100 ${isTeam1Winner ? 'bg-[#00A651]/8' : ''}`}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {team1Resolved ? (
            <TeamFlag teamName={team1Key} size="sm" />
          ) : (
            <span className="text-xs">🏆</span>
          )}
          <span className={`text-xs font-medium truncate ${!team1Resolved ? 'text-muted-foreground italic' : ''} ${isTeam1Winner ? 'text-[#00A651] font-bold' : ''}`}>
            {team1Name}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {result && (
            <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${isTeam1Winner ? 'bg-[#00A651] text-white' : 'bg-gray-100 text-gray-600'}`}>
              {result.homeGoals}
            </span>
          )}
        </div>
      </div>

      {/* Team 2 */}
      <div className={`flex items-center justify-between px-3 py-2 ${isTeam2Winner ? 'bg-[#00A651]/8' : ''}`}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {team2Resolved ? (
            <TeamFlag teamName={team2Key} size="sm" />
          ) : (
            <span className="text-xs">🏆</span>
          )}
          <span className={`text-xs font-medium truncate ${!team2Resolved ? 'text-muted-foreground italic' : ''} ${isTeam2Winner ? 'text-[#00A651] font-bold' : ''}`}>
            {team2Name}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {result && (
            <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${isTeam2Winner ? 'bg-[#00A651] text-white' : 'bg-gray-100 text-gray-600'}`}>
              {result.awayGoals}
            </span>
          )}
        </div>
      </div>

      {/* Penalties & Venue */}
      <div className="px-3 py-1 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        {result && result.homePenalties !== undefined && result.awayPenalties !== undefined && (
          <span className="text-[9px] text-amber-600 font-medium">
            ترجيح {result.homePenalties}-{result.awayPenalties}
          </span>
        )}
        <span className="text-[9px] text-muted-foreground mr-auto">{match.venueAr}</span>
      </div>
    </div>
  );
}

export function KnockoutBracket({ onMatchClick }: KnockoutBracketProps) {
  const { results } = useWC2026Store();
  const standings = useMemo(() => calculateGroupStandings(results), [results]);
  const thirdPlaceRanking = useMemo(() => calculateThirdPlaceRanking(standings), [standings]);

  const ctx = { standings, thirdPlaceRanking, results, onMatchClick };

  // Third Place Ranking Summary
  const showThirdPlaceRanking = thirdPlaceRanking.some(tp => tp.points > 0);

  return (
    <div className="space-y-6">
      {/* Third Place Ranking */}
      {showThirdPlaceRanking && (
        <Card className="p-4 border-[#FFD700]/30 bg-[#FFD700]/5 !py-4">
          <h3 className="text-sm font-bold text-[#002868] mb-3 text-center">
            ترتيب فرق المركز الثالث
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
                  {teamData && <TeamFlag teamName={tp.team} size="sm" />}
                  <span className="truncate font-medium">{teamData?.nameAr}</span>
                  <span className="mr-auto font-bold text-[#002868]">{tp.points}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Bracket - Responsive Section-by-Section Layout */}
      <div className="space-y-8">
        {/* Round of 32 */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-bl from-[#002868] to-[#1a3f8f] flex items-center justify-center">
              <span className="text-white text-xs font-bold">32</span>
            </div>
            <h3 className="text-lg font-bold text-[#002868]">دور الـ 32</h3>
            <span className="text-xs text-muted-foreground">28 يونيو - 3 يوليو</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {MATCHES.filter(m => m.round === 'r32').map(match => (
              <BracketMatch key={match.id} matchId={match.id} {...ctx} />
            ))}
          </div>
        </div>

        {/* Connector line */}
        <div className="flex justify-center">
          <div className="flex flex-col items-center gap-1">
            <div className="w-px h-6 bg-gradient-to-b from-[#002868]/30 to-[#E31837]/30" />
            <div className="w-8 h-8 rounded-full bg-gradient-to-bl from-[#002868] to-[#E31837] flex items-center justify-center shadow-lg">
              <span className="text-white text-xs font-bold">⬇</span>
            </div>
            <div className="w-px h-6 bg-gradient-to-b from-[#E31837]/30 to-transparent" />
          </div>
        </div>

        {/* Round of 16 */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-bl from-[#E31837] to-[#c4122d] flex items-center justify-center">
              <span className="text-white text-xs font-bold">16</span>
            </div>
            <h3 className="text-lg font-bold text-[#E31837]">دور الـ 16</h3>
            <span className="text-xs text-muted-foreground">4 - 7 يوليو</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {MATCHES.filter(m => m.round === 'r16').map(match => (
              <BracketMatch key={match.id} matchId={match.id} {...ctx} />
            ))}
          </div>
        </div>

        {/* Connector line */}
        <div className="flex justify-center">
          <div className="flex flex-col items-center gap-1">
            <div className="w-px h-6 bg-gradient-to-b from-[#E31837]/30 to-[#FFD700]/30" />
            <div className="w-8 h-8 rounded-full bg-gradient-to-bl from-[#FFD700] to-[#e6c200] flex items-center justify-center shadow-lg">
              <span className="text-[#002868] text-xs font-bold">⬇</span>
            </div>
            <div className="w-px h-6 bg-gradient-to-b from-[#FFD700]/30 to-transparent" />
          </div>
        </div>

        {/* Quarter-finals */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-bl from-[#FFD700] to-[#e6c200] flex items-center justify-center">
              <span className="text-[#002868] text-xs font-bold">4</span>
            </div>
            <h3 className="text-lg font-bold text-[#b8960f]">ربع النهائي</h3>
            <span className="text-xs text-muted-foreground">9 - 11 يوليو</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
            {MATCHES.filter(m => m.round === 'qf').map(match => (
              <BracketMatch key={match.id} matchId={match.id} {...ctx} />
            ))}
          </div>
        </div>

        {/* Connector line */}
        <div className="flex justify-center">
          <div className="flex flex-col items-center gap-1">
            <div className="w-px h-6 bg-gradient-to-b from-[#FFD700]/30 to-[#00A651]/30" />
            <div className="w-8 h-8 rounded-full bg-gradient-to-bl from-[#00A651] to-[#008f45] flex items-center justify-center shadow-lg">
              <span className="text-white text-xs font-bold">⬇</span>
            </div>
            <div className="w-px h-6 bg-gradient-to-b from-[#00A651]/30 to-transparent" />
          </div>
        </div>

        {/* Semi-finals */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-bl from-[#00A651] to-[#008f45] flex items-center justify-center">
              <span className="text-white text-xs font-bold">SF</span>
            </div>
            <h3 className="text-lg font-bold text-[#00A651]">نصف النهائي</h3>
            <span className="text-xs text-muted-foreground">14 - 15 يوليو</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
            {MATCHES.filter(m => m.round === 'sf').map(match => (
              <BracketMatch key={match.id} matchId={match.id} {...ctx} />
            ))}
          </div>
        </div>

        {/* Connector line */}
        <div className="flex justify-center">
          <div className="flex flex-col items-center gap-1">
            <div className="w-px h-6 bg-gradient-to-b from-[#00A651]/30 to-[#002868]/30" />
            <div className="w-10 h-10 rounded-full bg-gradient-to-bl from-[#002868] to-[#E31837] flex items-center justify-center shadow-xl">
              <span className="text-white text-sm font-bold">🏆</span>
            </div>
            <div className="w-px h-6 bg-gradient-to-b from-[#002868]/30 to-transparent" />
          </div>
        </div>

        {/* 3rd Place + Final */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* 3rd Place */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-bl from-[#8B8000] to-[#6B6300] flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">3rd</span>
              </div>
              <h3 className="text-base font-bold text-[#8B8000]">المركز الثالث</h3>
            </div>
            {MATCHES.filter(m => m.round === '3rd').map(match => (
              <BracketMatch key={match.id} matchId={match.id} {...ctx} />
            ))}
          </div>

          {/* Final */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-bl from-[#FFD700] to-[#FF8C00] flex items-center justify-center shadow-md">
                <span className="text-[#002868] text-[10px] font-bold">🏆</span>
              </div>
              <h3 className="text-base font-bold text-[#002868]">النهائي</h3>
              <span className="text-xs text-muted-foreground">19 يوليو</span>
            </div>
            {MATCHES.filter(m => m.round === 'final').map(match => (
              <BracketMatch key={match.id} matchId={match.id} {...ctx} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
