'use client';

import { useMemo } from 'react';
import { TEAMS, MATCHES, THIRD_PLACE_ELIGIBLE_GROUPS, getTeamRefDisplayName } from '@/lib/wc2026-data';
import { MatchResult, calculateGroupStandings, calculateThirdPlaceRanking } from '@/lib/wc2026-logic';
import { useWC2026Store } from '@/store/wc2026-store';
import { TeamFlag } from './TeamFlag';
import { Trophy } from 'lucide-react';

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
  if (winnerMatch) { const gs = standings[winnerMatch[1]]; if (gs?.[0]?.played > 0) return gs[0].team; return null; }
  const runnerUpMatch = ref.match(/^2([A-L])$/);
  if (runnerUpMatch) { const gs = standings[runnerUpMatch[1]]; if (gs?.[1]?.played > 0) return gs[1].team; return null; }
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
    const mid = parseInt(winnerOfMatch[1]); const r = results[mid]; if (!r) return null;
    const m = MATCHES.find(x => x.id === mid); if (!m) return null;
    const t1 = resolveTeamRef(m.team1Ref || m.team1, standings, thirdPlaceRanking, results) || m.team1;
    const t2 = resolveTeamRef(m.team2Ref || m.team2, standings, thirdPlaceRanking, results) || m.team2;
    if (r.homeGoals > r.awayGoals) return t1; if (r.awayGoals > r.homeGoals) return t2;
    if (r.homePenalties !== undefined && r.awayPenalties !== undefined) { if (r.homePenalties > r.awayPenalties) return t1; if (r.awayPenalties > r.homePenalties) return t2; }
    return null;
  }
  const loserOfMatch = ref.match(/^L(\d+)$/);
  if (loserOfMatch) {
    const mid = parseInt(loserOfMatch[1]); const r = results[mid]; if (!r) return null;
    const m = MATCHES.find(x => x.id === mid); if (!m) return null;
    const t1 = resolveTeamRef(m.team1Ref || m.team1, standings, thirdPlaceRanking, results) || m.team1;
    const t2 = resolveTeamRef(m.team2Ref || m.team2, standings, thirdPlaceRanking, results) || m.team2;
    if (r.homeGoals < r.awayGoals) return t1; if (r.awayGoals < r.homeGoals) return t2;
    if (r.homePenalties !== undefined && r.awayPenalties !== undefined) { if (r.homePenalties < r.awayPenalties) return t1; if (r.awayPenalties < r.homePenalties) return t2; }
    return null;
  }
  return null;
}

// Compact bracket match card - LIGHT THEME for desktop
interface BMatchProps {
  matchId: number;
  onMatchClick: (id: number) => void;
  standings: ReturnType<typeof calculateGroupStandings>;
  thirdPlaceRanking: ReturnType<typeof calculateThirdPlaceRanking>;
  results: Record<number, MatchResult>;
}

function BMatch({ matchId, onMatchClick, standings, thirdPlaceRanking, results }: BMatchProps) {
  const match = MATCHES.find(m => m.id === matchId);
  if (!match) return null;
  const result = results[matchId];
  const t1Ref = match.team1Ref || match.team1;
  const t2Ref = match.team2Ref || match.team2;
  const t1 = resolveTeamRef(t1Ref, standings, thirdPlaceRanking, results);
  const t2 = resolveTeamRef(t2Ref, standings, thirdPlaceRanking, results);
  const isDraw = result ? (result.homeGoals === result.awayGoals && (result.homePenalties === undefined || result.awayPenalties === undefined || result.homePenalties === result.awayPenalties)) : false;
  const t1Win = result ? (result.homeGoals > result.awayGoals || (result.homeGoals === result.awayGoals && result.homePenalties !== undefined && result.awayPenalties !== undefined && result.homePenalties > result.awayPenalties)) : false;
  const t2Win = result ? (result.awayGoals > result.homeGoals || (result.homeGoals === result.awayGoals && result.homePenalties !== undefined && result.awayPenalties !== undefined && result.awayPenalties > result.homePenalties)) : false;
  const t1Lose = result ? (!t1Win && !isDraw) : false;
  const t2Lose = result ? (!t2Win && !isDraw) : false;

  const row = (resolved: string | null, ref: string, win: boolean, lose: boolean, goals: number | undefined) => {
    const name = resolved ? (TEAMS[resolved]?.nameAr || resolved) : null;
    let bg = win ? 'bg-[#00A651]/15' : lose ? 'bg-[#E31837]/8' : isDraw ? 'bg-[#D4A017]/10' : '';
    return (
      <div className={`flex items-center gap-1.5 px-2 py-1 min-h-[26px] ${bg}`}>
        {resolved ? <TeamFlag teamName={resolved} size="sm" /> : <span className="w-5 h-3.5 flex-shrink-0 rounded-sm bg-[#c5d3e8] flex items-center justify-center text-[7px] text-[#6b84a8]">?</span>}
        <span className={`text-[11px] truncate flex-1 ${!resolved ? 'text-[#6b84a8] italic text-[10px]' : ''} ${win ? 'text-[#00A651] font-bold' : ''} ${lose ? 'text-[#E31837]' : ''} ${isDraw ? 'text-[#D4A017] font-semibold' : ''} ${!win && !lose && !isDraw && resolved ? 'text-[#1a3a5c]' : ''}`}>
          {name || getTeamRefDisplayName(ref)}
        </span>
        {result !== undefined && (
          <span className={`text-[12px] font-bold min-w-[16px] text-center ${win ? 'text-[#00A651]' : lose ? 'text-[#E31837]' : isDraw ? 'text-[#D4A017]' : 'text-[#6b84a8]'}`}>
            {goals}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="cursor-pointer hover:ring-1 hover:ring-[#002868]/30 transition-all rounded-md overflow-hidden bg-[#e8eef6] border border-[#c5d3e8] hover:shadow-sm hover:bg-[#dce5f2]" onClick={() => onMatchClick(matchId)}>
      {row(t1, t1Ref, t1Win, t1Lose, result?.homeGoals)}
      <div className="h-px bg-[#c5d3e8]/50" />
      {row(t2, t2Ref, t2Win, t2Lose, result?.awayGoals)}
      {result && result.homePenalties !== undefined && result.awayPenalties !== undefined && (
        <div className="px-2 py-0.5 bg-amber-100/60 border-t border-amber-200/50">
          <span className="text-[7px] text-amber-700">ترجيح {result.homePenalties}-{result.awayPenalties}</span>
        </div>
      )}
    </div>
  );
}


export function KnockoutBracket({ onMatchClick }: KnockoutBracketProps) {
  const { results } = useWC2026Store();
  const standings = useMemo(() => calculateGroupStandings(results), [results]);
  const thirdPlaceRanking = useMemo(() => calculateThirdPlaceRanking(standings), [standings]);
  const ctx = { standings, thirdPlaceRanking, results, onMatchClick };
  const showTP = thirdPlaceRanking.some(tp => tp.points > 0);

  // Bracket structure - pairs that feed into each other
  const left = {
    r32: [[76, 78], [79, 80], [85, 87], [86, 88]],
    r16: [[91, 92], [95, 96]],
    qf: [99, 100],
    sf: 102,
  };
  const right = {
    r32: [[74, 77], [73, 75], [83, 84], [81, 82]],
    r16: [[89, 90], [93, 94]],
    qf: [97, 98],
    sf: 101,
  };

  return (
    <div className="space-y-4">
      {showTP && (
        <div className="p-3 rounded-xl border border-[#FFD700]/30 bg-[#FFD700]/5">
          <h3 className="text-sm font-bold text-[#002868] mb-2 text-center">ترتيب فرق المركز الثالث</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {thirdPlaceRanking.map((tp, idx) => {
              const td = TEAMS[tp.team]; const q = idx < 8;
              return (
                <div key={tp.group} className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs ${q ? 'bg-[#00A651]/10 border border-[#00A651]/30' : 'bg-gray-100 border border-gray-200'}`}>
                  <span className="font-bold text-muted-foreground w-4">{idx + 1}</span>
                  {td && <TeamFlag teamName={tp.team} size="sm" />}
                  <span className="truncate font-medium">{td?.nameAr}</span>
                  <span className="mr-auto font-bold text-[#002868]">{tp.points}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============ DESKTOP BRACKET ============ */}
      <div className="hidden lg:block bg-gradient-to-b from-gray-50 to-white rounded-2xl p-4 shadow-lg border border-gray-200">

        {/* The Bracket - CSS Grid approach */}
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Round Labels */}
            <div className="grid gap-0 mb-2" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr auto 1fr 1fr 1fr 1fr' }}>
              <div className="text-center"><span className="text-[10px] text-[#002868] font-bold bg-[#002868]/10 px-2 py-0.5 rounded">دور الـ 32</span></div>
              <div className="text-center"><span className="text-[10px] text-[#002868] font-bold bg-[#002868]/10 px-2 py-0.5 rounded">دور الـ 16</span></div>
              <div className="text-center"><span className="text-[10px] text-[#002868] font-bold bg-[#002868]/10 px-2 py-0.5 rounded">ربع النهائي</span></div>
              <div className="text-center"><span className="text-[10px] text-[#002868] font-bold bg-[#002868]/10 px-2 py-0.5 rounded">نصف النهائي</span></div>
              <div className="text-center"><span className="text-[10px] text-[#002868] font-bold bg-[#FFD700]/30 px-3 py-0.5 rounded">النهائي</span></div>
              <div className="text-center"><span className="text-[10px] text-[#002868] font-bold bg-[#002868]/10 px-2 py-0.5 rounded">نصف النهائي</span></div>
              <div className="text-center"><span className="text-[10px] text-[#002868] font-bold bg-[#002868]/10 px-2 py-0.5 rounded">ربع النهائي</span></div>
              <div className="text-center"><span className="text-[10px] text-[#002868] font-bold bg-[#002868]/10 px-2 py-0.5 rounded">دور الـ 16</span></div>
              <div className="text-center"><span className="text-[10px] text-[#002868] font-bold bg-[#002868]/10 px-2 py-0.5 rounded">دور الـ 32</span></div>
            </div>

            {/* Bracket Grid */}
            <div className="grid gap-0 items-stretch" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr auto 1fr 1fr 1fr 1fr' }}>
              {/* === LEFT SIDE === */}
              <div className="flex flex-col justify-around gap-1 px-1">
                {left.r32.flat().map(id => <BMatch key={id} matchId={id} {...ctx} />)}
              </div>
              <div className="flex flex-col justify-around gap-3 px-1">
                {left.r16.flat().map(id => <BMatch key={id} matchId={id} {...ctx} />)}
              </div>
              <div className="flex flex-col justify-around gap-6 px-1">
                {left.qf.map(id => <BMatch key={id} matchId={id} {...ctx} />)}
              </div>
              <div className="flex flex-col justify-center px-1">
                <BMatch matchId={left.sf} {...ctx} />
              </div>

              {/* === CENTER === */}
              <div className="flex flex-col items-center justify-center gap-3 px-3 min-w-[160px]">
                <div>
                  <div className="text-center mb-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-l from-[#FFD700] to-[#FF8C00] text-[#002868] text-[9px] font-bold shadow-md">
                      <Trophy className="w-3 h-3" /> النهائي
                    </span>
                  </div>
                  <BMatch matchId={104} {...ctx} />
                </div>
                <img src="/wc2026-logo-unofficial.svg" alt="كأس العالم 2026" className="h-36 my-2 drop-shadow-[0_0_12px_rgba(255,215,0,0.3)]" />
                <div>
                  <div className="text-center mb-1">
                    <span className="inline-flex px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 text-[8px] font-bold">
                      المركز الثالث
                    </span>
                  </div>
                  <BMatch matchId={103} {...ctx} />
                </div>
              </div>

              {/* === RIGHT SIDE === */}
              <div className="flex flex-col justify-center px-1">
                <BMatch matchId={right.sf} {...ctx} />
              </div>
              <div className="flex flex-col justify-around gap-6 px-1">
                {right.qf.map(id => <BMatch key={id} matchId={id} {...ctx} />)}
              </div>
              <div className="flex flex-col justify-around gap-3 px-1">
                {right.r16.flat().map(id => <BMatch key={id} matchId={id} {...ctx} />)}
              </div>
              <div className="flex flex-col justify-around gap-1 px-1">
                {right.r32.flat().map(id => <BMatch key={id} matchId={id} {...ctx} />)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ MOBILE / TABLET - VERTICAL TREE BRACKET ============ */}
      <div className="lg:hidden bg-gradient-to-b from-gray-50 to-white rounded-2xl p-2 shadow-lg border border-gray-200 overflow-x-auto">

        {/* Logo */}
        <div className="flex justify-center mb-3">
          <img src="/wc2026-logo-unofficial.svg" alt="كأس العالم 2026" className="h-20" />
        </div>

        {/* === TOP HALF BRACKET (Right side from desktop → SF 101) === */}
        <div className="text-center mb-2">
          <span className="text-[9px] text-[#002868] font-bold bg-[#002868]/10 px-2 py-0.5 rounded-full">نصف النهائي 101</span>
        </div>

        {/* Vertical tree: R32 → R16 → QF → SF */}
        <div className="min-w-[340px]">
          {/* R32 - 8 matches in 4 pairs */}
          <div className="mb-1">
            <div className="text-center mb-1"><span className="text-[8px] text-[#002868]/60 font-bold">دور الـ 32</span></div>
            <div className="grid grid-cols-4 gap-0.5">
              {right.r32.flat().map(id => <BMatch key={id} matchId={id} {...ctx} />)}
            </div>
          </div>

          {/* Connector */}
          <div className="flex justify-center my-1"><div className="w-px h-2 bg-[#c5d3e8]" /></div>

          {/* R16 - 4 matches */}
          <div className="mb-1">
            <div className="text-center mb-1"><span className="text-[8px] text-[#E31837]/60 font-bold">دور الـ 16</span></div>
            <div className="grid grid-cols-2 gap-1 mx-auto" style={{ maxWidth: '50%' }}>
              {right.r16.flat().map(id => <BMatch key={id} matchId={id} {...ctx} />)}
            </div>
          </div>

          {/* Connector */}
          <div className="flex justify-center my-1"><div className="w-px h-2 bg-[#c5d3e8]" /></div>

          {/* QF - 2 matches */}
          <div className="mb-1">
            <div className="text-center mb-1"><span className="text-[8px] text-[#FFD700]/80 font-bold">ربع النهائي</span></div>
            <div className="flex justify-center gap-2">
              {right.qf.map(id => <div key={id} className="w-[45%]"><BMatch matchId={id} {...ctx} /></div>)}
            </div>
          </div>

          {/* Connector */}
          <div className="flex justify-center my-1"><div className="w-px h-2 bg-[#c5d3e8]" /></div>

          {/* SF - 1 match */}
          <div className="mb-1">
            <div className="text-center mb-1"><span className="text-[8px] text-[#00A651]/80 font-bold">نصف النهائي</span></div>
            <div className="flex justify-center">
              <div className="w-[45%]"><BMatch matchId={right.sf} {...ctx} /></div>
            </div>
          </div>
        </div>

        {/* Divider with logo */}
        <div className="flex items-center gap-2 my-3">
          <div className="flex-1 h-px bg-[#c5d3e8]" />
          <img src="/wc2026-logo-unofficial.svg" alt="" className="h-7 opacity-40" />
          <div className="flex-1 h-px bg-[#c5d3e8]" />
        </div>

        {/* === BOTTOM HALF BRACKET (Left side from desktop → SF 102) === */}
        <div className="text-center mb-2">
          <span className="text-[9px] text-[#002868] font-bold bg-[#002868]/10 px-2 py-0.5 rounded-full">نصف النهائي 102</span>
        </div>

        <div className="min-w-[340px]">
          {/* R32 - 8 matches */}
          <div className="mb-1">
            <div className="text-center mb-1"><span className="text-[8px] text-[#002868]/60 font-bold">دور الـ 32</span></div>
            <div className="grid grid-cols-4 gap-0.5">
              {left.r32.flat().map(id => <BMatch key={id} matchId={id} {...ctx} />)}
            </div>
          </div>

          {/* Connector */}
          <div className="flex justify-center my-1"><div className="w-px h-2 bg-[#c5d3e8]" /></div>

          {/* R16 - 4 matches */}
          <div className="mb-1">
            <div className="text-center mb-1"><span className="text-[8px] text-[#E31837]/60 font-bold">دور الـ 16</span></div>
            <div className="grid grid-cols-2 gap-1 mx-auto" style={{ maxWidth: '50%' }}>
              {left.r16.flat().map(id => <BMatch key={id} matchId={id} {...ctx} />)}
            </div>
          </div>

          {/* Connector */}
          <div className="flex justify-center my-1"><div className="w-px h-2 bg-[#c5d3e8]" /></div>

          {/* QF - 2 matches */}
          <div className="mb-1">
            <div className="text-center mb-1"><span className="text-[8px] text-[#FFD700]/80 font-bold">ربع النهائي</span></div>
            <div className="flex justify-center gap-2">
              {left.qf.map(id => <div key={id} className="w-[45%]"><BMatch matchId={id} {...ctx} /></div>)}
            </div>
          </div>

          {/* Connector */}
          <div className="flex justify-center my-1"><div className="w-px h-2 bg-[#c5d3e8]" /></div>

          {/* SF - 1 match */}
          <div className="mb-1">
            <div className="text-center mb-1"><span className="text-[8px] text-[#00A651]/80 font-bold">نصف النهائي</span></div>
            <div className="flex justify-center">
              <div className="w-[45%]"><BMatch matchId={left.sf} {...ctx} /></div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="flex justify-center my-3"><div className="w-px h-3 bg-[#c5d3e8]" /></div>

        {/* Final & 3rd Place */}
        <div className="space-y-3 max-w-[70%] mx-auto">
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="inline-flex px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 text-[9px] font-bold">🥉 المركز الثالث</span>
            </div>
            <BMatch matchId={103} {...ctx} />
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-l from-[#FFD700] to-[#FF8C00] text-[#002868] text-[9px] font-bold"><Trophy className="w-2.5 h-2.5" /> النهائي</span>
            </div>
            <BMatch matchId={104} {...ctx} />
          </div>
        </div>
      </div>
    </div>
  );
}
