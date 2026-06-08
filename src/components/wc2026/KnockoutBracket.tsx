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

// ──────────────────────── Tree Bracket Structures ────────────────────────
interface TreeNode {
  matchId: number;
  children?: [TreeNode, TreeNode];
}

const rightTree: TreeNode = {
  matchId: 101,
  children: [
    {
      matchId: 97,
      children: [
        { matchId: 89, children: [{ matchId: 74 }, { matchId: 77 }] },
        { matchId: 90, children: [{ matchId: 73 }, { matchId: 75 }] },
      ],
    },
    {
      matchId: 98,
      children: [
        { matchId: 93, children: [{ matchId: 83 }, { matchId: 84 }] },
        { matchId: 94, children: [{ matchId: 81 }, { matchId: 82 }] },
      ],
    },
  ],
};

const leftTree: TreeNode = {
  matchId: 102,
  children: [
    {
      matchId: 99,
      children: [
        { matchId: 91, children: [{ matchId: 76 }, { matchId: 78 }] },
        { matchId: 92, children: [{ matchId: 79 }, { matchId: 80 }] },
      ],
    },
    {
      matchId: 100,
      children: [
        { matchId: 95, children: [{ matchId: 85 }, { matchId: 87 }] },
        { matchId: 96, children: [{ matchId: 86 }, { matchId: 88 }] },
      ],
    },
  ],
};

// ──────────────────────── Shared Types & Helpers ────────────────────────
interface BMatchProps {
  matchId: number;
  onMatchClick: (id: number) => void;
  standings: ReturnType<typeof calculateGroupStandings>;
  thirdPlaceRanking: ReturnType<typeof calculateThirdPlaceRanking>;
  results: Record<number, MatchResult>;
}

interface BracketCtx {
  standings: ReturnType<typeof calculateGroupStandings>;
  thirdPlaceRanking: ReturnType<typeof calculateThirdPlaceRanking>;
  results: Record<number, MatchResult>;
  onMatchClick: (id: number) => void;
}

const ROUND_BORDER: Record<string, string> = {
  r32: 'border-[#002868]/35',
  r16: 'border-[#E31837]/35',
  qf: 'border-[#FFD700]/50',
  sf: 'border-[#00A651]/40',
  final: 'border-[#FFD700]',
  '3rd': 'border-gray-300',
};

const ROUND_DOT: Record<string, string> = {
  r32: 'bg-[#002868]/50',
  r16: 'bg-[#E31837]/50',
  qf: 'bg-[#FFD700]/70',
  sf: 'bg-[#00A651]/50',
  final: 'bg-[#FFD700]',
  '3rd': 'bg-gray-400',
};

const ROUND_NAMES: Record<string, string> = {
  r32: 'دور الـ 32',
  r16: 'دور الـ 16',
  qf: 'ربع النهائي',
  sf: 'نصف النهائي',
  final: 'النهائي',
  '3rd': 'المركز الثالث',
};

function getConnColor(matchId: number): string {
  const m = MATCHES.find(x => x.id === matchId);
  const round = m?.round || '';
  switch (round) {
    case 'r16': return 'bg-[#E31837]/30';
    case 'qf': return 'bg-[#FFD700]/40';
    case 'sf': return 'bg-[#00A651]/35';
    case 'final': return 'bg-[#FFD700]/50';
    default: return 'bg-[#002868]/25';
  }
}

// ──────────────────────── BMatch (Desktop full-size card) ────────────────────────
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

// ──────────────────────── MiniMatch (Mobile compact card) ────────────────────────
function MiniMatch({ matchId, onMatchClick, standings, thirdPlaceRanking, results }: BMatchProps) {
  const match = MATCHES.find(m => m.id === matchId);
  if (!match) return null;
  const result = results[matchId];
  const t1Ref = match.team1Ref || match.team1;
  const t2Ref = match.team2Ref || match.team2;
  const t1 = resolveTeamRef(t1Ref, standings, thirdPlaceRanking, results);
  const t2 = resolveTeamRef(t2Ref, standings, thirdPlaceRanking, results);
  const isDraw = result
    ? result.homeGoals === result.awayGoals &&
      (result.homePenalties === undefined || result.awayPenalties === undefined || result.homePenalties === result.awayPenalties)
    : false;
  const t1Win = result
    ? result.homeGoals > result.awayGoals ||
      (result.homeGoals === result.awayGoals && result.homePenalties !== undefined && result.awayPenalties !== undefined && result.homePenalties > result.awayPenalties)
    : false;
  const t2Win = result
    ? result.awayGoals > result.homeGoals ||
      (result.homeGoals === result.awayGoals && result.homePenalties !== undefined && result.awayPenalties !== undefined && result.awayPenalties > result.homePenalties)
    : false;
  const t1Lose = result ? !t1Win && !isDraw : false;
  const t2Lose = result ? !t2Win && !isDraw : false;

  const teamRow = (resolved: string | null, ref: string, win: boolean, lose: boolean, goals: number | undefined) => {
    const shortName = resolved
      ? (TEAMS[resolved]?.nameAr?.slice(0, 6) || resolved.slice(0, 3))
      : getTeamRefDisplayName(ref).slice(0, 8);
    const fullName = resolved
      ? (TEAMS[resolved]?.nameAr || resolved)
      : getTeamRefDisplayName(ref);

    return (
      <div
        className={`flex items-center gap-[3px] px-1.5 py-[3px] min-h-[22px] ${win ? 'bg-[#00A651]/18' : lose ? 'bg-[#E31837]/10' : isDraw ? 'bg-[#D4A017]/12' : ''}`}
        title={fullName}
      >
        {resolved ? (
          <TeamFlag teamName={resolved} size="sm" />
        ) : (
          <span className="w-[18px] h-[12px] flex-shrink-0 rounded-[2px] bg-[#c5d3e8] flex items-center justify-center text-[6px] text-[#6b84a8] font-bold">?</span>
        )}
        <span
          className={`text-[9px] leading-tight truncate max-w-[48px] ${
            !resolved ? 'text-[#6b84a8] italic text-[8px]' : ''
          } ${win ? 'text-[#00A651] font-bold' : ''} ${lose ? 'text-[#E31837]' : ''} ${
            isDraw ? 'text-[#D4A017] font-semibold' : ''
          } ${!win && !lose && !isDraw && resolved ? 'text-[#1a3a5c]' : ''}`}
        >
          {shortName}
        </span>
        {result !== undefined && (
          <span
            className={`text-[10px] font-bold mr-auto min-w-[12px] text-center ${
              win ? 'text-[#00A651]' : lose ? 'text-[#E31837]' : isDraw ? 'text-[#D4A017]' : 'text-[#6b84a8]'
            }`}
          >
            {goals}
          </span>
        )}
      </div>
    );
  };

  const round = match.round || '';
  const borderColor = ROUND_BORDER[round] || 'border-[#c5d3e8]';
  const dotColor = ROUND_DOT[round] || 'bg-gray-400';

  return (
    <div
      className={`cursor-pointer rounded-md overflow-hidden border ${borderColor} bg-[#e8eef6] hover:bg-[#dce5f2] hover:shadow-sm hover:ring-1 hover:ring-[#002868]/25 transition-all`}
      style={{ minWidth: '90px', maxWidth: '110px' }}
      onClick={() => onMatchClick(matchId)}
    >
      <div className={`h-[3px] ${dotColor}`} />
      {teamRow(t1, t1Ref, t1Win, t1Lose, result?.homeGoals)}
      <div className="h-px bg-[#c5d3e8]/50" />
      {teamRow(t2, t2Ref, t2Win, t2Lose, result?.awayGoals)}
      {result && result.homePenalties !== undefined && result.awayPenalties !== undefined && (
        <div className="px-1 py-[1px] bg-amber-100/60 border-t border-amber-200/50 text-center">
          <span className="text-[6px] text-amber-700">ترجيح {result.homePenalties}-{result.awayPenalties}</span>
        </div>
      )}
    </div>
  );
}

// ──────────────────────── Desktop Horizontal Bracket Node ────────────────────────
const H_CONN_W = 'w-[14px]';
const H_CONN_VW = 'w-[2px]';
const H_CONN_HH = 'h-[2px]';

function HBracketNode({ node, ctx, reversed = false }: { node: TreeNode; ctx: BracketCtx; reversed?: boolean }) {
  if (!node.children) {
    return <BMatch matchId={node.matchId} {...ctx} />;
  }

  const connColor = getConnColor(node.matchId);

  if (reversed) {
    return (
      <div className="flex items-stretch" dir="ltr">
        <div className="flex items-center self-center shrink-0">
          <BMatch matchId={node.matchId} {...ctx} />
          <div className={`${H_CONN_HH} ${H_CONN_W} ${connColor} shrink-0`} />
        </div>
        <div className={`${H_CONN_VW} self-stretch ${connColor} shrink-0`} />
        <div className="flex flex-col justify-around">
          <div className="flex items-center">
            <div className={`${H_CONN_HH} ${H_CONN_W} ${connColor} shrink-0`} />
            <HBracketNode node={node.children[0]} ctx={ctx} reversed />
          </div>
          <div className="flex items-center">
            <div className={`${H_CONN_HH} ${H_CONN_W} ${connColor} shrink-0`} />
            <HBracketNode node={node.children[1]} ctx={ctx} reversed />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-stretch" dir="ltr">
      <div className="flex flex-col justify-around">
        <div className="flex items-center">
          <HBracketNode node={node.children[0]} ctx={ctx} />
          <div className={`${H_CONN_HH} ${H_CONN_W} ${connColor} shrink-0`} />
        </div>
        <div className="flex items-center">
          <HBracketNode node={node.children[1]} ctx={ctx} />
          <div className={`${H_CONN_HH} ${H_CONN_W} ${connColor} shrink-0`} />
        </div>
      </div>
      <div className={`${H_CONN_VW} self-stretch ${connColor} shrink-0`} />
      <div className="flex items-center self-center shrink-0">
        <div className={`${H_CONN_HH} ${H_CONN_W} ${connColor} shrink-0`} />
        <BMatch matchId={node.matchId} {...ctx} />
      </div>
    </div>
  );
}

// ──────────────────────── Mobile Vertical Bracket Node ────────────────────────
const V_CONN_H = 'h-[8px]';
const V_CONN_VH = 'h-[2px]';
const V_CONN_VW = 'w-[2px]';

function VBracketNode({ node, ctx }: { node: TreeNode; ctx: BracketCtx }) {
  if (!node.children) {
    return (
      <div className="flex justify-center">
        <MiniMatch matchId={node.matchId} {...ctx} />
      </div>
    );
  }

  const connColor = getConnColor(node.matchId);
  const round = MATCHES.find(x => x.id === node.matchId)?.round || '';

  return (
    <div className="flex flex-col items-center" dir="ltr">
      {/* Round label */}
      <div className="mb-1">
        <span className="text-[7px] font-bold text-[#002868]/60 bg-[#002868]/5 px-1.5 py-[1px] rounded">
          {ROUND_NAMES[round]}
        </span>
      </div>

      {/* Children side by side */}
      <div className="flex items-start justify-center gap-1">
        <div className="flex flex-col items-center">
          <VBracketNode node={node.children[0]} ctx={ctx} />
          <div className={`${V_CONN_VW} ${V_CONN_H} ${connColor} shrink-0`} />
        </div>
        <div className="flex flex-col items-center">
          <VBracketNode node={node.children[1]} ctx={ctx} />
          <div className={`${V_CONN_VW} ${V_CONN_H} ${connColor} shrink-0`} />
        </div>
      </div>

      {/* Horizontal connector bar */}
      <div className={`${V_CONN_VH} ${connColor} shrink-0`} style={{ width: '50%' }} />

      {/* Center vertical line to parent */}
      <div className={`${V_CONN_VW} ${V_CONN_H} ${connColor} shrink-0`} />

      {/* Parent match */}
      <MiniMatch matchId={node.matchId} {...ctx} />
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
    <div className="space-y-4" style={{ width: '104%' }}>
      {showTP && (
        <div className="p-3 rounded-xl border border-[#FFD700]/30 bg-[#FFD700]/5">
          <h3 className="text-sm font-bold text-[#002868] mb-2 text-center">ترتيب فرق المركز الثالث</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {thirdPlaceRanking.map((tp, idx) => {
              const td = TEAMS[tp.team]; const q = idx < 8;
              return (
                <div key={tp.group} className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs ${q ? 'bg-[#00A651]/10 border border-[#00A651]/30' : 'bg-gray-100 border border-gray-200'}`}>
                  <span className={`font-bold w-5 h-5 flex items-center justify-center rounded-full text-[10px] ${q ? 'bg-[#00A651] text-white' : 'bg-gray-300 text-white'}`}>{idx + 1}</span>
                  {td && <TeamFlag teamName={tp.team} size="sm" />}
                  <span className="truncate font-medium">{td?.nameAr}</span>
                  <span className="mr-auto font-bold text-[#002868]">{tp.points}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════ DESKTOP HORIZONTAL TREE BRACKET ═══════════════════ */}
      <div className="hidden lg:block bg-gradient-to-b from-gray-50 to-white rounded-2xl p-4 shadow-lg border border-gray-200">
        {/* Title */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <img src="/wc2026-logo-unofficial.svg" alt="كأس العالم 2026" className="h-10 drop-shadow-[0_0_6px_rgba(255,215,0,0.2)]" />
          <h2 className="text-lg font-bold text-[#002868]">الأدوار الإقصائية</h2>
        </div>

        {/* Round legend */}
        <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded bg-[#002868]/10 text-[#002868]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#002868]/40" /> دور الـ 32
          </span>
          <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded bg-[#E31837]/10 text-[#E31837]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E31837]/40" /> دور الـ 16
          </span>
          <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded bg-[#FFD700]/15 text-[#B8860B]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFD700]/60" /> ربع النهائي
          </span>
          <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded bg-[#00A651]/10 text-[#00A651]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00A651]/40" /> نصف النهائي
          </span>
        </div>

        <div className="overflow-x-auto">
          <div className="flex items-center justify-center gap-0 min-w-[1100px]" dir="ltr">
            {/* Left half tree (normal direction: children left → parent right) */}
            <HBracketNode node={leftTree} ctx={ctx} />

            {/* Center: 3rd place + Final */}
            <div className="flex flex-col items-center justify-center gap-4 mx-4 min-w-[180px]">
              <div>
                <div className="text-center mb-1">
                  <span className="inline-flex px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 text-[9px] font-bold">المركز الثالث</span>
                </div>
                <BMatch matchId={103} {...ctx} />
              </div>
              <div className="flex flex-col items-center">
                <img src="/wc2026-logo-unofficial.svg" alt="كأس العالم 2026" className="h-20 mb-2 drop-shadow-[0_0_10px_rgba(255,215,0,0.25)]" />
                <div className="text-center mb-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-l from-[#FFD700] to-[#FF8C00] text-[#002868] text-[10px] font-bold shadow-md">
                    <Trophy className="w-3 h-3" /> النهائي
                  </span>
                </div>
                <BMatch matchId={104} {...ctx} />
              </div>
            </div>

            {/* Right half tree (reversed: parent left → children right) */}
            <HBracketNode node={rightTree} ctx={ctx} reversed />
          </div>
        </div>
      </div>

      {/* ═══════════════════ MOBILE VERTICAL TREE BRACKET ═══════════════════ */}
      <div className="lg:hidden bg-gradient-to-b from-gray-50 to-white rounded-2xl p-3 shadow-lg border border-gray-200">
        {/* Logo */}
        <div className="flex justify-center mb-3">
          <img src="/wc2026-logo-unofficial.svg" alt="كأس العالم 2026" className="h-14 drop-shadow-[0_0_6px_rgba(255,215,0,0.2)]" />
        </div>

        {/* Round legend */}
        <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[8px] font-semibold px-1.5 py-0.5 rounded bg-[#002868]/10 text-[#002868]">
            <span className="w-2 h-2 rounded-full bg-[#002868]/40" /> دور الـ 32
          </span>
          <span className="inline-flex items-center gap-1 text-[8px] font-semibold px-1.5 py-0.5 rounded bg-[#E31837]/10 text-[#E31837]">
            <span className="w-2 h-2 rounded-full bg-[#E31837]/40" /> دور الـ 16
          </span>
          <span className="inline-flex items-center gap-1 text-[8px] font-semibold px-1.5 py-0.5 rounded bg-[#FFD700]/15 text-[#B8860B]">
            <span className="w-2 h-2 rounded-full bg-[#FFD700]/60" /> ربع النهائي
          </span>
          <span className="inline-flex items-center gap-1 text-[8px] font-semibold px-1.5 py-0.5 rounded bg-[#00A651]/10 text-[#00A651]">
            <span className="w-2 h-2 rounded-full bg-[#00A651]/40" /> نصف النهائي
          </span>
        </div>

        {/* ── Left Half Tree (Vertical) ── */}
        <div className="mb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-[10px] text-[#002868] font-bold bg-[#002868]/10 px-2.5 py-0.5 rounded-full">
              شجرة نصف النهائي 102
            </span>
          </div>
          <div className="overflow-x-auto pb-2 -mx-1">
            <div className="min-w-[320px] px-1 flex justify-center">
              <VBracketNode node={leftTree} ctx={ctx} />
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="flex items-center gap-2 my-3">
          <div className="flex-1 h-px bg-[#c5d3e8]" />
          <img src="/wc2026-logo-unofficial.svg" alt="" className="h-5 opacity-30" />
          <div className="flex-1 h-px bg-[#c5d3e8]" />
        </div>

        {/* ── Right Half Tree (Vertical) ── */}
        <div className="mb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-[10px] text-[#002868] font-bold bg-[#002868]/10 px-2.5 py-0.5 rounded-full">
              شجرة نصف النهائي 101
            </span>
          </div>
          <div className="overflow-x-auto pb-2 -mx-1">
            <div className="min-w-[320px] px-1 flex justify-center">
              <VBracketNode node={rightTree} ctx={ctx} />
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="flex items-center gap-2 my-3">
          <div className="flex-1 h-px bg-[#c5d3e8]" />
          <Trophy className="w-4 h-4 text-[#FFD700]" />
          <div className="flex-1 h-px bg-[#c5d3e8]" />
        </div>

        {/* ── Final & 3rd Place ── */}
        <div className="space-y-3 max-w-[75%] mx-auto" dir="rtl">
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="inline-flex px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 text-[9px] font-bold">المركز الثالث</span>
            </div>
            <BMatch matchId={103} {...ctx} />
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-l from-[#FFD700] to-[#FF8C00] text-[#002868] text-[9px] font-bold shadow-sm">
                <Trophy className="w-2.5 h-2.5" /> النهائي
              </span>
            </div>
            <BMatch matchId={104} {...ctx} />
          </div>
        </div>
      </div>
    </div>
  );
}
