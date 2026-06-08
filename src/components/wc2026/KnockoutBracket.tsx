'use client';

import { useMemo } from 'react';
import { TEAMS, MATCHES, THIRD_PLACE_ELIGIBLE_GROUPS, getTeamRefDisplayName } from '@/lib/wc2026-data';
import { MatchResult, calculateGroupStandings, calculateThirdPlaceRanking } from '@/lib/wc2026-logic';
import { useWC2026Store } from '@/store/wc2026-store';
import { TeamFlag } from './TeamFlag';
import { Trophy, Medal } from 'lucide-react';

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
    if (r.homePenalties !== undefined && r.awayPenalties !== undefined) { if (r.homePenalties < r.awayPenalties) return t1; if (r.awayPenalties > r.homePenalties) return t2; }
    return null;
  }
  return null;
}

// ──────────────────────── Types ────────────────────────
interface BracketCtx {
  standings: ReturnType<typeof calculateGroupStandings>;
  thirdPlaceRanking: ReturnType<typeof calculateThirdPlaceRanking>;
  results: Record<number, MatchResult>;
  onMatchClick: (id: number) => void;
}

// ──────────────────────── BMatch - Desktop Match Card ────────────────────────
function BMatch({ matchId, ctx, roundColor }: { matchId: number; ctx: BracketCtx; roundColor?: string }) {
  const match = MATCHES.find(m => m.id === matchId);
  if (!match) return null;
  const result = ctx.results[matchId];
  const t1Ref = match.team1Ref || match.team1;
  const t2Ref = match.team2Ref || match.team2;
  const t1 = resolveTeamRef(t1Ref, ctx.standings, ctx.thirdPlaceRanking, ctx.results);
  const t2 = resolveTeamRef(t2Ref, ctx.standings, ctx.thirdPlaceRanking, ctx.results);
  const isDraw = result ? (result.homeGoals === result.awayGoals && (result.homePenalties === undefined || result.awayPenalties === undefined || result.homePenalties === result.awayPenalties)) : false;
  const t1Win = result ? (result.homeGoals > result.awayGoals || (result.homeGoals === result.awayGoals && result.homePenalties !== undefined && result.awayPenalties !== undefined && result.homePenalties > result.awayPenalties)) : false;
  const t2Win = result ? (result.awayGoals > result.homeGoals || (result.homeGoals === result.awayGoals && result.homePenalties !== undefined && result.awayPenalties !== undefined && result.awayPenalties > result.homePenalties)) : false;
  const t1Lose = result ? (!t1Win && !isDraw) : false;
  const t2Lose = result ? (!t2Win && !isDraw) : false;

  const row = (resolved: string | null, ref: string, win: boolean, lose: boolean, goals: number | undefined) => {
    const name = resolved ? (TEAMS[resolved]?.nameAr || resolved) : null;
    const bg = win ? 'bg-emerald-50/80' : lose ? 'bg-red-50/60' : isDraw ? 'bg-amber-50/60' : '';
    return (
      <div className={`flex items-center gap-1.5 px-2 py-[5px] min-h-[28px] ${bg}`}>
        {resolved ? (
          <TeamFlag teamName={resolved} size="sm" />
        ) : (
          <span className="w-5 h-3.5 flex-shrink-0 rounded-sm bg-slate-200/80 flex items-center justify-center text-[8px] text-slate-400">?</span>
        )}
        <span className={`text-[11px] truncate flex-1 leading-tight ${!resolved ? 'text-slate-400 italic text-[10px]' : ''} ${win ? 'text-emerald-700 font-bold' : ''} ${lose ? 'text-red-500' : ''} ${isDraw ? 'text-amber-600 font-semibold' : ''} ${!win && !lose && !isDraw && resolved ? 'text-slate-700' : ''}`}>
          {name || getTeamRefDisplayName(ref)}
        </span>
        {result !== undefined && (
          <span className={`text-[12px] font-bold min-w-[18px] text-center ${win ? 'text-emerald-600' : lose ? 'text-red-500' : isDraw ? 'text-amber-600' : 'text-slate-400'}`}>
            {goals}
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      className={`cursor-pointer hover:shadow-md transition-all rounded-lg overflow-hidden bg-white border border-slate-200/80 hover:border-amber-300/60 hover:bg-amber-50/10 ${roundColor || ''}`}
      onClick={() => ctx.onMatchClick(matchId)}
    >
      {row(t1, t1Ref, t1Win, t1Lose, result?.homeGoals)}
      <div className="h-px bg-slate-100" />
      {row(t2, t2Ref, t2Win, t2Lose, result?.awayGoals)}
      {result && result.homePenalties !== undefined && result.awayPenalties !== undefined && (
        <div className="px-2 py-0.5 bg-amber-50 border-t border-amber-100">
          <span className="text-[8px] text-amber-600 font-medium">ترجيح {result.homePenalties}-{result.awayPenalties}</span>
        </div>
      )}
    </div>
  );
}

// ──────────────────────── Mobile Match Card ────────────────────────
function MMatch({ matchId, ctx }: { matchId: number; ctx: BracketCtx }) {
  const match = MATCHES.find(m => m.id === matchId);
  if (!match) return null;
  const result = ctx.results[matchId];
  const t1Ref = match.team1Ref || match.team1;
  const t2Ref = match.team2Ref || match.team2;
  const t1 = resolveTeamRef(t1Ref, ctx.standings, ctx.thirdPlaceRanking, ctx.results);
  const t2 = resolveTeamRef(t2Ref, ctx.standings, ctx.thirdPlaceRanking, ctx.results);
  const isDraw = result ? (result.homeGoals === result.awayGoals && (result.homePenalties === undefined || result.awayPenalties === undefined || result.homePenalties === result.awayPenalties)) : false;
  const t1Win = result ? (result.homeGoals > result.awayGoals || (result.homeGoals === result.awayGoals && result.homePenalties !== undefined && result.awayPenalties !== undefined && result.homePenalties > result.awayPenalties)) : false;
  const t2Win = result ? (result.awayGoals > result.homeGoals || (result.homeGoals === result.awayGoals && result.homePenalties !== undefined && result.awayPenalties !== undefined && result.awayPenalties > result.homePenalties)) : false;
  const t1Lose = result ? (!t1Win && !isDraw) : false;
  const t2Lose = result ? (!t2Win && !isDraw) : false;

  const teamRow = (resolved: string | null, ref: string, win: boolean, lose: boolean, goals: number | undefined, side: 'home' | 'away') => {
    const name = resolved ? (TEAMS[resolved]?.nameAr || resolved) : getTeamRefDisplayName(ref);
    const bg = win ? 'bg-emerald-50/80' : lose ? 'bg-red-50/60' : isDraw ? 'bg-amber-50/60' : '';

    return (
      <div className={`flex items-center gap-1.5 px-2 py-[4px] min-h-[26px] ${bg}`}>
        {side === 'home' && (
          <>
            {resolved ? <TeamFlag teamName={resolved} size="sm" /> : <span className="w-5 h-3.5 flex-shrink-0 rounded-sm bg-slate-200/80 flex items-center justify-center text-[7px] text-slate-400">?</span>}
            <span className={`text-[11px] truncate flex-1 leading-tight ${!resolved ? 'text-slate-400 italic text-[10px]' : ''} ${win ? 'text-emerald-700 font-bold' : ''} ${lose ? 'text-red-500' : ''} ${isDraw ? 'text-amber-600 font-semibold' : ''} ${!win && !lose && !isDraw && resolved ? 'text-slate-700' : ''}`}>
              {name}
            </span>
            {result !== undefined && (
              <span className={`text-[12px] font-bold min-w-[18px] text-center ${win ? 'text-emerald-600' : lose ? 'text-red-500' : isDraw ? 'text-amber-600' : 'text-slate-400'}`}>
                {goals}
              </span>
            )}
          </>
        )}
        {side === 'away' && (
          <>
            {result !== undefined && (
              <span className={`text-[12px] font-bold min-w-[18px] text-center ${win ? 'text-emerald-600' : lose ? 'text-red-500' : isDraw ? 'text-amber-600' : 'text-slate-400'}`}>
                {goals}
              </span>
            )}
            <span className={`text-[11px] truncate flex-1 leading-tight text-right ${!resolved ? 'text-slate-400 italic text-[10px]' : ''} ${win ? 'text-emerald-700 font-bold' : ''} ${lose ? 'text-red-500' : ''} ${isDraw ? 'text-amber-600 font-semibold' : ''} ${!win && !lose && !isDraw && resolved ? 'text-slate-700' : ''}`}>
              {name}
            </span>
            {resolved ? <TeamFlag teamName={resolved} size="sm" /> : <span className="w-5 h-3.5 flex-shrink-0 rounded-sm bg-slate-200/80 flex items-center justify-center text-[7px] text-slate-400">?</span>}
          </>
        )}
      </div>
    );
  };

  const round = match.round || '';
  const roundColorMap: Record<string, string> = {
    r32: 'border-r-[3px] border-r-blue-700',
    r16: 'border-r-[3px] border-r-red-600',
    qf: 'border-r-[3px] border-r-amber-500',
    sf: 'border-r-[3px] border-r-emerald-600',
    final: 'border-r-[3px] border-r-amber-400',
    '3rd': 'border-r-[3px] border-r-gray-400',
  };

  return (
    <div
      className={`cursor-pointer rounded-lg overflow-hidden bg-white border border-slate-200/80 hover:border-amber-300/60 hover:shadow-md transition-all ${roundColorMap[round] || ''}`}
      onClick={() => ctx.onMatchClick(matchId)}
    >
      {teamRow(t1, t1Ref, t1Win, t1Lose, result?.homeGoals, 'home')}
      <div className="h-px bg-slate-100" />
      {teamRow(t2, t2Ref, t2Win, t2Lose, result?.awayGoals, 'away')}
      {result && result.homePenalties !== undefined && result.awayPenalties !== undefined && (
        <div className="px-2 py-[2px] bg-amber-50 border-t border-amber-100 text-center">
          <span className="text-[8px] text-amber-600">ترجيح {result.homePenalties}-{result.awayPenalties}</span>
        </div>
      )}
    </div>
  );
}

// ──────────────────────── Desktop: Horizontal Bracket Tree ────────────────────────
function DesktopBracket({ ctx }: { ctx: BracketCtx }) {
  // Left bracket: R32 → R16 → QF → SF (match 102)
  const leftR32 = [[76, 78], [79, 80], [85, 87], [86, 88]];
  const leftR16 = [[91, 92], [95, 96]];
  const leftQF = [99, 100];
  const leftSF = 102;

  // Right bracket: R32 → R16 → QF → SF (match 101)
  const rightR32 = [[74, 77], [73, 75], [83, 84], [81, 82]];
  const rightR16 = [[89, 90], [93, 94]];
  const rightQF = [97, 98];
  const rightSF = 101;

  return (
    <div className="hidden lg:block">
      <div className="bg-gradient-to-b from-slate-50 to-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-l from-[#002868] via-[#1a3a7a] to-[#002868] px-6 py-4 flex items-center justify-center gap-4">
          <img src="/wc2026-trophy.png" alt="كأس العالم 2026" className="h-14 drop-shadow-lg" />
          <div className="text-center">
            <h2 className="text-xl font-bold text-white">الأدوار الإقصائية</h2>
            <p className="text-[11px] text-blue-200 tracking-wider">KNOCKOUT STAGE</p>
          </div>
        </div>

        <div className="p-4 overflow-x-auto">
          <div className="min-w-[1100px]" dir="rtl">
            {/* Round Headers */}
            <div className="grid gap-0 mb-4" style={{ gridTemplateColumns: '1.2fr 1fr 0.8fr 0.7fr auto 0.7fr 0.8fr 1fr 1.2fr' }}>
              {['دور الـ 32', 'دور الـ 16', 'ربع النهائي', 'نصف النهائي', 'النهائي', 'نصف النهائي', 'ربع النهائي', 'دور الـ 16', 'دور الـ 32'].map((label, i) => {
                const colors: Record<number, string> = {
                  0: 'bg-blue-100 text-blue-800', 1: 'bg-red-100 text-red-800', 2: 'bg-amber-100 text-amber-800', 3: 'bg-emerald-100 text-emerald-800',
                  4: 'bg-gradient-to-l from-amber-200 to-amber-300 text-amber-900', 5: 'bg-emerald-100 text-emerald-800', 6: 'bg-amber-100 text-amber-800',
                  7: 'bg-red-100 text-red-800', 8: 'bg-blue-100 text-blue-800',
                };
                return (
                  <div key={i} className="text-center flex items-center justify-center">
                    <span className={`inline-block text-[10px] font-bold px-2.5 py-1.5 rounded-full whitespace-nowrap ${colors[i]}`}>{label}</span>
                  </div>
                );
              })}
            </div>

            {/* Bracket Grid */}
            <div className="grid gap-0 items-stretch" style={{ gridTemplateColumns: '1.2fr 1fr 0.8fr 0.7fr auto 0.7fr 0.8fr 1fr 1.2fr' }}>
              {/* LEFT SIDE - R32 */}
              <div className="flex flex-col justify-around gap-[4px] px-1">
                {leftR32.flat().map(id => <BMatch key={id} matchId={id} ctx={ctx} roundColor="border-r-[3px] border-r-blue-700" />)}
              </div>
              {/* LEFT - R16 */}
              <div className="flex flex-col justify-around gap-2 px-1">
                {leftR16.flat().map(id => <BMatch key={id} matchId={id} ctx={ctx} roundColor="border-r-[3px] border-r-red-600" />)}
              </div>
              {/* LEFT - QF */}
              <div className="flex flex-col justify-around gap-6 px-1">
                {leftQF.map(id => <BMatch key={id} matchId={id} ctx={ctx} roundColor="border-r-[3px] border-r-amber-500" />)}
              </div>
              {/* LEFT - SF */}
              <div className="flex flex-col justify-center px-1">
                <BMatch matchId={leftSF} ctx={ctx} roundColor="border-r-[3px] border-r-emerald-600" />
              </div>

              {/* CENTER - Finals */}
              <div className="flex flex-col items-center justify-center gap-4 px-3 min-w-[180px]">
                <div className="w-full max-w-[170px]">
                  <div className="text-center mb-2">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-l from-amber-400 to-amber-500 text-white text-[11px] font-bold shadow-lg">
                      <Trophy className="w-3.5 h-3.5" /> النهائي
                    </span>
                  </div>
                  <BMatch matchId={104} ctx={ctx} roundColor="border-r-[3px] border-r-amber-400" />
                </div>
                <img src="/wc2026-trophy.png" alt="كأس العالم 2026" className="h-28 drop-shadow-xl" />
                <div className="w-full max-w-[170px]">
                  <div className="text-center mb-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold">
                      <Medal className="w-3 h-3" /> المركز الثالث
                    </span>
                  </div>
                  <BMatch matchId={103} ctx={ctx} roundColor="border-r-[3px] border-r-gray-400" />
                </div>
              </div>

              {/* RIGHT - SF */}
              <div className="flex flex-col justify-center px-1">
                <BMatch matchId={rightSF} ctx={ctx} roundColor="border-l-[3px] border-l-emerald-600" />
              </div>
              {/* RIGHT - QF */}
              <div className="flex flex-col justify-around gap-6 px-1">
                {rightQF.map(id => <BMatch key={id} matchId={id} ctx={ctx} roundColor="border-l-[3px] border-l-amber-500" />)}
              </div>
              {/* RIGHT - R16 */}
              <div className="flex flex-col justify-around gap-2 px-1">
                {rightR16.flat().map(id => <BMatch key={id} matchId={id} ctx={ctx} roundColor="border-l-[3px] border-l-red-600" />)}
              </div>
              {/* RIGHT - R32 */}
              <div className="flex flex-col justify-around gap-[4px] px-1">
                {rightR32.flat().map(id => <BMatch key={id} matchId={id} ctx={ctx} roundColor="border-l-[3px] border-l-blue-700" />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────── Mobile: Vertical Bracket Tree ────────────────────────
function MobileBracket({ ctx }: { ctx: BracketCtx }) {
  const rounds = [
    { key: 'r32', label: 'دور الـ 32', badge: 'bg-blue-700 text-white', dot: 'bg-blue-400', count: '16 مباراة', matches: [74, 77, 73, 75, 76, 78, 79, 80, 83, 84, 81, 82, 85, 87, 86, 88] },
    { key: 'r16', label: 'دور الـ 16', badge: 'bg-red-600 text-white', dot: 'bg-red-400', count: '8 مباريات', matches: [89, 90, 91, 92, 93, 94, 95, 96] },
    { key: 'qf', label: 'ربع النهائي', badge: 'bg-amber-500 text-white', dot: 'bg-amber-400', count: '4 مباريات', matches: [97, 98, 99, 100] },
    { key: 'sf', label: 'نصف النهائي', badge: 'bg-emerald-600 text-white', dot: 'bg-emerald-400', count: 'مباراتان', matches: [101, 102] },
  ];

  return (
    <div className="lg:hidden">
      <div className="bg-gradient-to-b from-slate-50 to-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-l from-[#002868] via-[#1a3a7a] to-[#002868] px-4 py-4 text-center">
          <img src="/wc2026-trophy.png" alt="كأس العالم 2026" className="h-14 mx-auto mb-2 drop-shadow-lg" />
          <h2 className="text-lg font-bold text-white">الأدوار الإقصائية</h2>
          <p className="text-[10px] text-blue-200 tracking-wider">KNOCKOUT STAGE</p>
        </div>

        <div className="p-3" dir="rtl">
          {rounds.map((round, ri) => (
            <div key={round.key}>
              {/* Round header */}
              <div className="flex items-center gap-2 my-3">
                <span className={`inline-block text-[11px] font-bold px-3 py-1.5 rounded-lg ${round.badge} shadow-sm`}>
                  {round.label}
                </span>
                <span className="text-[9px] text-slate-400 font-medium">{round.count}</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Matches - 2 columns for R32 and R16, 1 column for QF and SF */}
              <div className={`grid gap-2 ${round.key === 'r32' ? 'grid-cols-2' : round.key === 'r16' ? 'grid-cols-2' : 'grid-cols-1 max-w-xs mx-auto'}`}>
                {round.matches.map(id => (
                  <MMatch key={id} matchId={id} ctx={ctx} />
                ))}
              </div>

              {/* Connector line to next round */}
              {ri < rounds.length - 1 && (
                <div className="flex justify-center py-2.5">
                  <div className="flex flex-col items-center gap-0.5">
                    <div className={`${round.dot} w-2 h-2 rounded-full`} />
                    <div className={`${round.dot} w-0.5 h-4 rounded-full`} />
                    <div className={`${round.dot} w-2 h-2 rounded-full`} />
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Connector to finals */}
          <div className="flex justify-center py-2.5">
            <div className="flex flex-col items-center gap-0.5">
              <div className="bg-emerald-400 w-2 h-2 rounded-full" />
              <div className="bg-emerald-400 w-0.5 h-4 rounded-full" />
              <div className="bg-amber-400 w-2 h-2 rounded-full" />
            </div>
          </div>

          {/* Final & 3rd Place section */}
          <div className="space-y-4 mt-2">
            {/* 3rd Place */}
            <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/60 max-w-xs mx-auto">
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <Medal className="w-3.5 h-3.5 text-slate-400" />
                <span className="inline-flex px-3 py-1.5 rounded-lg bg-slate-300 text-slate-600 text-[11px] font-bold">المركز الثالث</span>
              </div>
              <MMatch matchId={103} ctx={ctx} />
            </div>

            {/* Logo */}
            <div className="flex justify-center py-2">
              <img src="/wc2026-trophy.png" alt="كأس العالم 2026" className="h-20 drop-shadow-lg" />
            </div>

            {/* Final */}
            <div className="bg-gradient-to-b from-amber-50 to-amber-100/50 rounded-xl p-3 border border-amber-300/50 max-w-xs mx-auto">
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-l from-amber-400 to-amber-500 text-white text-[11px] font-bold shadow-md">
                  النهائي
                </span>
              </div>
              <MMatch matchId={104} ctx={ctx} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────── Main Component ────────────────────────
export function KnockoutBracket({ onMatchClick }: KnockoutBracketProps) {
  const { results } = useWC2026Store();
  const standings = useMemo(() => calculateGroupStandings(results), [results]);
  const thirdPlaceRanking = useMemo(() => calculateThirdPlaceRanking(standings), [standings]);
  const ctx: BracketCtx = { standings, thirdPlaceRanking, results, onMatchClick };
  const showTP = thirdPlaceRanking.some(tp => tp.points > 0);

  return (
    <div className="space-y-4">
      {showTP && (
        <div className="p-4 rounded-2xl bg-gradient-to-b from-white to-slate-50/80 shadow-lg border border-amber-200/50">
          <h3 className="text-sm font-bold text-slate-800 mb-3 text-center flex items-center justify-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            ترتيب فرق المركز الثالث
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {thirdPlaceRanking.map((tp, idx) => {
              const td = TEAMS[tp.team]; const q = idx < 8;
              return (
                <div key={tp.group} className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-all ${q ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-200'}`}>
                  <span className={`font-bold w-6 h-6 flex items-center justify-center rounded-full text-[10px] shrink-0 ${q ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-300 text-white'}`}>{idx + 1}</span>
                  {td && <TeamFlag teamName={tp.team} size="sm" />}
                  <span className="truncate font-medium text-slate-700">{td?.nameAr}</span>
                  <span className="mr-auto font-bold text-slate-500">{tp.points}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <DesktopBracket ctx={ctx} />
      <MobileBracket ctx={ctx} />
    </div>
  );
}
