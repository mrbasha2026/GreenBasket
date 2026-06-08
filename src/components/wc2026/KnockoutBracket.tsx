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

function getRefLabel(ref: string): string {
  const winnerMatch = ref.match(/^1([A-L])$/);
  if (winnerMatch) return `1${winnerMatch[1]}`;
  const runnerUpMatch = ref.match(/^2([A-L])$/);
  if (runnerUpMatch) return `2${runnerUpMatch[1]}`;
  const thirdPlaceMatch = ref.match(/^3(.+)$/);
  if (thirdPlaceMatch) return '3rd';
  const winnerOfMatch = ref.match(/^W(\d+)$/);
  if (winnerOfMatch) return `W${winnerOfMatch[1]}`;
  const loserOfMatch = ref.match(/^L(\d+)$/);
  if (loserOfMatch) return `L${loserOfMatch[1]}`;
  return ref;
}

// Lightweight bracket match - just flag + name + score
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

  const team1Name = team1Resolved ? (TEAMS[team1Resolved]?.nameAr || team1Resolved) : null;
  const team2Name = team2Resolved ? (TEAMS[team2Resolved]?.nameAr || team2Resolved) : null;

  const refLabel1 = getRefLabel(team1Ref);
  const refLabel2 = getRefLabel(team2Ref);

  const isTeam1Winner = result ? (
    result.homeGoals > result.awayGoals ||
    (result.homeGoals === result.awayGoals && result.homePenalties !== undefined && result.awayPenalties !== undefined && result.homePenalties > result.awayPenalties)
  ) : false;
  const isTeam2Winner = result ? (
    result.awayGoals > result.homeGoals ||
    (result.homeGoals === result.awayGoals && result.homePenalties !== undefined && result.awayPenalties !== undefined && result.homePenalties > result.homePenalties)
  ) : false;

  return (
    <div
      className="cursor-pointer hover:ring-2 hover:ring-[#FFD700]/50 hover:bg-[#0d3060] transition-all duration-150 rounded overflow-hidden w-[160px] bg-[#081e42] border border-[#1a4a8e]/40"
      onClick={() => onMatchClick(matchId)}
    >
      {/* Team 1 row */}
      <div className={`flex items-center gap-1 px-1.5 py-[3px] min-h-[24px] ${isTeam1Winner ? 'bg-[#00A651]/12' : ''}`}>
        <span className="text-[7px] text-[#FFD700]/80 font-mono w-4 text-center flex-shrink-0">{refLabel1}</span>
        {team1Resolved ? (
          <TeamFlag teamName={team1Resolved} size="sm" />
        ) : (
          <span className="w-5 h-[14px] flex-shrink-0 rounded-sm bg-[#1a4a8e]/40 flex items-center justify-center text-[7px] text-white/30">?</span>
        )}
        <span className={`text-[9px] truncate flex-1 leading-tight ${!team1Resolved ? 'text-white/25 italic' : ''} ${isTeam1Winner ? 'text-[#00A651] font-bold' : 'text-white/85'}`}>
          {team1Name || getTeamRefDisplayName(team1Ref)}
        </span>
        {result !== undefined && (
          <span className={`text-[10px] font-bold w-4 text-center flex-shrink-0 ${isTeam1Winner ? 'text-[#00A651]' : 'text-white/50'}`}>
            {result.homeGoals}
          </span>
        )}
      </div>

      <div className="h-px bg-[#1a4a8e]/40" />

      {/* Team 2 row */}
      <div className={`flex items-center gap-1 px-1.5 py-[3px] min-h-[24px] ${isTeam2Winner ? 'bg-[#00A651]/12' : ''}`}>
        <span className="text-[7px] text-[#FFD700]/80 font-mono w-4 text-center flex-shrink-0">{refLabel2}</span>
        {team2Resolved ? (
          <TeamFlag teamName={team2Resolved} size="sm" />
        ) : (
          <span className="w-5 h-[14px] flex-shrink-0 rounded-sm bg-[#1a4a8e]/40 flex items-center justify-center text-[7px] text-white/30">?</span>
        )}
        <span className={`text-[9px] truncate flex-1 leading-tight ${!team2Resolved ? 'text-white/25 italic' : ''} ${isTeam2Winner ? 'text-[#00A651] font-bold' : 'text-white/85'}`}>
          {team2Name || getTeamRefDisplayName(team2Ref)}
        </span>
        {result !== undefined && (
          <span className={`text-[10px] font-bold w-4 text-center flex-shrink-0 ${isTeam2Winner ? 'text-[#00A651]' : 'text-white/50'}`}>
            {result.awayGoals}
          </span>
        )}
      </div>

      {/* Penalties (minimal) */}
      {result && result.homePenalties !== undefined && result.awayPenalties !== undefined && (
        <div className="px-1.5 py-[1px] bg-[#002868]/30 border-t border-[#1a4a8e]/30">
          <span className="text-[6px] text-amber-400">ترجيح {result.homePenalties}-{result.awayPenalties}</span>
        </div>
      )}
    </div>
  );
}

// SVG Connectors
function MergeConnectorRTL() {
  return (
    <svg width="20" height="100%" viewBox="0 0 20 100" preserveAspectRatio="none" className="w-5 h-full min-h-[55px]">
      <line x1="0" y1="25" x2="10" y2="25" stroke="#4a8ad4" strokeWidth="1.5" />
      <line x1="0" y1="75" x2="10" y2="75" stroke="#4a8ad4" strokeWidth="1.5" />
      <line x1="10" y1="25" x2="10" y2="75" stroke="#4a8ad4" strokeWidth="1.5" />
      <line x1="10" y1="50" x2="20" y2="50" stroke="#4a8ad4" strokeWidth="1.5" />
      <circle cx="10" cy="50" r="2" fill="#FFD700" />
    </svg>
  );
}

function MergeConnectorLTR() {
  return (
    <svg width="20" height="100%" viewBox="0 0 20 100" preserveAspectRatio="none" className="w-5 h-full min-h-[55px]">
      <line x1="10" y1="25" x2="20" y2="25" stroke="#4a8ad4" strokeWidth="1.5" />
      <line x1="10" y1="75" x2="20" y2="75" stroke="#4a8ad4" strokeWidth="1.5" />
      <line x1="10" y1="25" x2="10" y2="75" stroke="#4a8ad4" strokeWidth="1.5" />
      <line x1="0" y1="50" x2="10" y2="50" stroke="#4a8ad4" strokeWidth="1.5" />
      <circle cx="10" cy="50" r="2" fill="#FFD700" />
    </svg>
  );
}

function StraightConnector() {
  return (
    <svg width="20" height="30" viewBox="0 0 20 30">
      <line x1="0" y1="15" x2="20" y2="15" stroke="#4a8ad4" strokeWidth="1.5" />
      <circle cx="10" cy="15" r="1.5" fill="#FFD700" />
    </svg>
  );
}

// Round label
function RoundLabel({ title, dateRange }: { title: string; dateRange: string }) {
  return (
    <div className="text-center mb-1.5">
      <div className="inline-flex flex-col items-center px-2 py-0.5 rounded bg-[#1a4a8e]/30 border border-[#2a5a9e]/20">
        <span className="text-white/80 text-[9px] font-bold">{title}</span>
        <span className="text-white/30 text-[6px]">{dateRange}</span>
      </div>
    </div>
  );
}

export function KnockoutBracket({ onMatchClick }: KnockoutBracketProps) {
  const { results } = useWC2026Store();
  const standings = useMemo(() => calculateGroupStandings(results), [results]);
  const thirdPlaceRanking = useMemo(() => calculateThirdPlaceRanking(standings), [standings]);

  const ctx = { standings, thirdPlaceRanking, results, onMatchClick };

  const showThirdPlaceRanking = thirdPlaceRanking.some(tp => tp.points > 0);

  // RIGHT SIDE → SF 101
  const rightR32 = [
    { top: 73, bottom: 75 },
    { top: 74, bottom: 77 },
    { top: 81, bottom: 82 },
    { top: 83, bottom: 84 },
  ];
  const rightR16 = [
    { top: 90, bottom: 89 },
    { top: 94, bottom: 93 },
  ];
  const rightQF = [{ top: 97, bottom: 98 }];
  const rightSF = 101;

  // LEFT SIDE → SF 102
  const leftR32 = [
    { top: 76, bottom: 78 },
    { top: 79, bottom: 80 },
    { top: 85, bottom: 87 },
    { top: 86, bottom: 88 },
  ];
  const leftR16 = [
    { top: 91, bottom: 92 },
    { top: 96, bottom: 95 },
  ];
  const leftQF = [{ top: 99, bottom: 100 }];
  const leftSF = 102;

  const CARD_W = 160;
  const CONN_W = 20;
  const CENTER_W = 170;

  return (
    <div className="space-y-6">
      {/* Third Place Ranking */}
      {showThirdPlaceRanking && (
        <div className="p-4 rounded-xl border border-[#FFD700]/30 bg-[#FFD700]/5">
          <h3 className="text-sm font-bold text-[#002868] mb-3 text-center">ترتيب فرق المركز الثالث</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {thirdPlaceRanking.map((tp, idx) => {
              const teamData = TEAMS[tp.team];
              const isQualified = idx < 8;
              return (
                <div key={tp.group} className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs ${isQualified ? 'bg-[#00A651]/10 border border-[#00A651]/30' : 'bg-muted/30 border border-border/30'}`}>
                  <span className="font-bold text-muted-foreground w-4">{idx + 1}</span>
                  {teamData && <TeamFlag teamName={tp.team} size="sm" />}
                  <span className="truncate font-medium">{teamData?.nameAr}</span>
                  <span className="mr-auto font-bold text-[#002868]">{tp.points}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== DESKTOP SYMMETRICAL BRACKET ==================== */}
      <div className="hidden lg:block bg-gradient-to-b from-[#001a4a] to-[#0a2a5e] rounded-2xl p-4 xl:p-5 shadow-xl border border-[#1a4a8e]/30 overflow-x-auto">
        {/* Trophy header */}
        <div className="flex justify-center mb-3">
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-gradient-to-bl from-[#FFD700] to-[#daa520] flex items-center justify-center shadow-lg shadow-[#FFD700]/15 border-2 border-[#FFD700]/30">
              <Trophy className="w-7 h-7 text-[#002868]" />
            </div>
            <h2 className="text-white text-lg font-bold mt-1.5">الأدوار الإقصائية</h2>
          </div>
        </div>

        {/* Round labels */}
        <div className="flex items-center justify-center mb-2" style={{ minWidth: `${CARD_W * 8 + CONN_W * 8 + CENTER_W}px` }}>
          {/* Left labels (center outward) */}
          <div className="flex items-center flex-1">
            <div style={{ width: CARD_W }} className="flex-shrink-0"><RoundLabel title="نصف النهائي" dateRange="14 - 15 يوليو" /></div>
            <div style={{ width: CONN_W }} className="flex-shrink-0" />
            <div style={{ width: CARD_W }} className="flex-shrink-0"><RoundLabel title="ربع النهائي" dateRange="9 - 11 يوليو" /></div>
            <div style={{ width: CONN_W }} className="flex-shrink-0" />
            <div style={{ width: CARD_W }} className="flex-shrink-0"><RoundLabel title="دور الـ 16" dateRange="4 - 7 يوليو" /></div>
            <div style={{ width: CONN_W }} className="flex-shrink-0" />
            <div style={{ width: CARD_W }} className="flex-shrink-0"><RoundLabel title="دور الـ 32" dateRange="28 يونيو - 3 يوليو" /></div>
          </div>
          {/* Center */}
          <div style={{ width: CENTER_W }} className="flex-shrink-0"><RoundLabel title="النهائي" dateRange="19 يوليو" /></div>
          {/* Right labels (center outward) */}
          <div className="flex items-center flex-1">
            <div style={{ width: CARD_W }} className="flex-shrink-0"><RoundLabel title="دور الـ 32" dateRange="28 يونيو - 3 يوليو" /></div>
            <div style={{ width: CONN_W }} className="flex-shrink-0" />
            <div style={{ width: CARD_W }} className="flex-shrink-0"><RoundLabel title="دور الـ 16" dateRange="4 - 7 يوليو" /></div>
            <div style={{ width: CONN_W }} className="flex-shrink-0" />
            <div style={{ width: CARD_W }} className="flex-shrink-0"><RoundLabel title="ربع النهائي" dateRange="9 - 11 يوليو" /></div>
            <div style={{ width: CONN_W }} className="flex-shrink-0" />
            <div style={{ width: CARD_W }} className="flex-shrink-0"><RoundLabel title="نصف النهائي" dateRange="14 - 15 يوليو" /></div>
          </div>
        </div>

        {/* Bracket Row */}
        <div className="flex items-stretch" style={{ minWidth: `${CARD_W * 8 + CONN_W * 8 + CENTER_W}px` }}>

          {/* ====== LEFT HALF (SF → QF → R16 → R32 outward) ====== */}
          <div className="flex items-stretch flex-1">
            {/* SF */}
            <div className="flex flex-col justify-center" style={{ width: CARD_W }}>
              <BracketMatch matchId={leftSF} {...ctx} />
            </div>
            <div className="flex flex-col justify-center" style={{ width: CONN_W }}><MergeConnectorLTR /></div>
            {/* QF */}
            <div className="flex flex-col justify-around gap-6" style={{ width: CARD_W }}>
              {leftQF.map((pair, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  <BracketMatch matchId={pair.top} {...ctx} />
                  <BracketMatch matchId={pair.bottom} {...ctx} />
                </div>
              ))}
            </div>
            <div className="flex flex-col justify-around" style={{ width: CONN_W }}>
              {leftQF.map((_, i) => <div key={i} className="flex-1 flex items-center"><MergeConnectorLTR /></div>)}
            </div>
            {/* R16 */}
            <div className="flex flex-col justify-around gap-2" style={{ width: CARD_W }}>
              {leftR16.map((pair, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  <BracketMatch matchId={pair.top} {...ctx} />
                  <BracketMatch matchId={pair.bottom} {...ctx} />
                </div>
              ))}
            </div>
            <div className="flex flex-col justify-around" style={{ width: CONN_W }}>
              {leftR16.map((_, i) => <div key={i} className="flex-1 flex items-center"><MergeConnectorLTR /></div>)}
            </div>
            {/* R32 (outermost) */}
            <div className="flex flex-col justify-around gap-1" style={{ width: CARD_W }}>
              {leftR32.map((pair, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  <BracketMatch matchId={pair.top} {...ctx} />
                  <BracketMatch matchId={pair.bottom} {...ctx} />
                </div>
              ))}
            </div>
          </div>

          {/* ====== CENTER ====== */}
          <div className="flex flex-col justify-center items-center gap-3" style={{ width: CENTER_W }}>
            {/* Final */}
            <div>
              <div className="text-center mb-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-l from-[#FFD700] to-[#FF8C00] text-[#002868] text-[9px] font-bold shadow-lg shadow-[#FFD700]/15 border border-[#FFD700]/30">
                  <Trophy className="w-2.5 h-2.5" /> النهائي
                </span>
              </div>
              <BracketMatch matchId={104} {...ctx} />
            </div>
            {/* 3rd Place */}
            <div>
              <div className="text-center mb-1.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#6B6300]/80 text-white/70 text-[7px] font-bold border border-[#8B8000]/20">
                  المركز الثالث
                </span>
              </div>
              <BracketMatch matchId={103} {...ctx} />
            </div>
          </div>

          {/* ====== RIGHT HALF (R32 → R16 → QF → SF inward) ====== */}
          <div className="flex items-stretch flex-1">
            {/* R32 (outermost) */}
            <div className="flex flex-col justify-around gap-1" style={{ width: CARD_W }}>
              {rightR32.map((pair, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  <BracketMatch matchId={pair.top} {...ctx} />
                  <BracketMatch matchId={pair.bottom} {...ctx} />
                </div>
              ))}
            </div>
            <div className="flex flex-col justify-around" style={{ width: CONN_W }}>
              {rightR16.map((_, i) => <div key={i} className="flex-1 flex items-center"><MergeConnectorRTL /></div>)}
            </div>
            {/* R16 */}
            <div className="flex flex-col justify-around gap-2" style={{ width: CARD_W }}>
              {rightR16.map((pair, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  <BracketMatch matchId={pair.top} {...ctx} />
                  <BracketMatch matchId={pair.bottom} {...ctx} />
                </div>
              ))}
            </div>
            <div className="flex flex-col justify-around" style={{ width: CONN_W }}>
              {rightQF.map((_, i) => <div key={i} className="flex-1 flex items-center"><MergeConnectorRTL /></div>)}
            </div>
            {/* QF */}
            <div className="flex flex-col justify-around gap-6" style={{ width: CARD_W }}>
              {rightQF.map((pair, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  <BracketMatch matchId={pair.top} {...ctx} />
                  <BracketMatch matchId={pair.bottom} {...ctx} />
                </div>
              ))}
            </div>
            <div className="flex flex-col justify-center" style={{ width: CONN_W }}><MergeConnectorRTL /></div>
            {/* SF */}
            <div className="flex flex-col justify-center" style={{ width: CARD_W }}>
              <BracketMatch matchId={rightSF} {...ctx} />
            </div>
          </div>
        </div>
      </div>

      {/* ==================== TABLET BRACKET ==================== */}
      <div className="hidden md:flex lg:hidden bg-gradient-to-b from-[#001a4a] to-[#0a2a5e] rounded-2xl p-3 shadow-xl border border-[#1a4a8e]/30 overflow-x-auto flex-col items-center">
        <div className="flex justify-center mb-3">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-bl from-[#FFD700] to-[#daa520] flex items-center justify-center shadow-lg border border-[#FFD700]/30">
              <Trophy className="w-5 h-5 text-[#002868]" />
            </div>
            <h2 className="text-white text-sm font-bold mt-1">الأدوار الإقصائية</h2>
          </div>
        </div>

        <div className="flex items-stretch w-full overflow-x-auto pb-2" style={{ minWidth: '850px' }}>
          {/* LEFT */}
          <div className="flex items-stretch flex-1">
            <div className="flex flex-col justify-center" style={{ width: CARD_W }}><BracketMatch matchId={leftSF} {...ctx} /></div>
            <div className="flex flex-col justify-center" style={{ width: CONN_W }}><MergeConnectorLTR /></div>
            <div className="flex flex-col justify-around gap-4" style={{ width: CARD_W }}>
              {leftQF.map((pair, i) => (<div key={i} className="flex flex-col gap-0.5"><BracketMatch matchId={pair.top} {...ctx} /><BracketMatch matchId={pair.bottom} {...ctx} /></div>))}
            </div>
            <div className="flex flex-col justify-around" style={{ width: CONN_W }}>
              {leftQF.map((_, i) => <div key={i} className="flex-1 flex items-center"><MergeConnectorLTR /></div>)}
            </div>
            <div className="flex flex-col justify-around gap-1.5" style={{ width: CARD_W }}>
              {leftR16.map((pair, i) => (<div key={i} className="flex flex-col gap-0.5"><BracketMatch matchId={pair.top} {...ctx} /><BracketMatch matchId={pair.bottom} {...ctx} /></div>))}
            </div>
            <div className="flex flex-col justify-around" style={{ width: CONN_W }}>
              {leftR16.map((_, i) => <div key={i} className="flex-1 flex items-center"><MergeConnectorLTR /></div>)}
            </div>
            <div className="flex flex-col justify-around gap-0.5" style={{ width: CARD_W }}>
              {leftR32.map((pair, i) => (<div key={i} className="flex flex-col gap-0.5"><BracketMatch matchId={pair.top} {...ctx} /><BracketMatch matchId={pair.bottom} {...ctx} /></div>))}
            </div>
          </div>

          {/* CENTER */}
          <div className="flex flex-col justify-center items-center gap-2" style={{ width: CENTER_W - 20 }}>
            <div>
              <div className="text-center mb-1"><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-l from-[#FFD700] to-[#FF8C00] text-[#002868] text-[8px] font-bold"><Trophy className="w-2 h-2" /> النهائي</span></div>
              <BracketMatch matchId={104} {...ctx} />
            </div>
            <div>
              <div className="text-center mb-1"><span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#6B6300] text-white/70 text-[7px] font-bold">المركز الثالث</span></div>
              <BracketMatch matchId={103} {...ctx} />
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-stretch flex-1">
            <div className="flex flex-col justify-around gap-0.5" style={{ width: CARD_W }}>
              {rightR32.map((pair, i) => (<div key={i} className="flex flex-col gap-0.5"><BracketMatch matchId={pair.top} {...ctx} /><BracketMatch matchId={pair.bottom} {...ctx} /></div>))}
            </div>
            <div className="flex flex-col justify-around" style={{ width: CONN_W }}>
              {rightR16.map((_, i) => <div key={i} className="flex-1 flex items-center"><MergeConnectorRTL /></div>)}
            </div>
            <div className="flex flex-col justify-around gap-1.5" style={{ width: CARD_W }}>
              {rightR16.map((pair, i) => (<div key={i} className="flex flex-col gap-0.5"><BracketMatch matchId={pair.top} {...ctx} /><BracketMatch matchId={pair.bottom} {...ctx} /></div>))}
            </div>
            <div className="flex flex-col justify-around" style={{ width: CONN_W }}>
              {rightQF.map((_, i) => <div key={i} className="flex-1 flex items-center"><MergeConnectorRTL /></div>)}
            </div>
            <div className="flex flex-col justify-around gap-4" style={{ width: CARD_W }}>
              {rightQF.map((pair, i) => (<div key={i} className="flex flex-col gap-0.5"><BracketMatch matchId={pair.top} {...ctx} /><BracketMatch matchId={pair.bottom} {...ctx} /></div>))}
            </div>
            <div className="flex flex-col justify-center" style={{ width: CONN_W }}><MergeConnectorRTL /></div>
            <div className="flex flex-col justify-center" style={{ width: CARD_W }}><BracketMatch matchId={rightSF} {...ctx} /></div>
          </div>
        </div>
      </div>

      {/* ==================== MOBILE ==================== */}
      <div className="md:hidden bg-gradient-to-b from-[#001a4a] to-[#0a2a5e] rounded-2xl p-3 shadow-xl border border-[#1a4a8e]/30">
        <div className="flex justify-center mb-3">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-bl from-[#FFD700] to-[#daa520] flex items-center justify-center shadow-lg border border-[#FFD700]/30">
              <Trophy className="w-5 h-5 text-[#002868]" />
            </div>
            <h2 className="text-white text-sm font-bold mt-1">الأدوار الإقصائية</h2>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { round: 'r32', label: 'دور الـ 32', date: '28 يونيو - 3 يوليو', color: '#1a4a8e' },
            { round: 'r16', label: 'دور الـ 16', date: '4 - 7 يوليو', color: '#E31837' },
            { round: 'qf', label: 'ربع النهائي', date: '9 - 11 يوليو', color: '#FFD700' },
            { round: 'sf', label: 'نصف النهائي', date: '14 - 15 يوليو', color: '#00A651' },
          ].map(({ round, label, date, color }) => (
            <div key={round}>
              <div className="text-center mb-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border" style={{ backgroundColor: `${color}30`, borderColor: `${color}50`, color: round === 'qf' ? '#002868' : 'white' }}>
                  {label} <span style={{ color: round === 'qf' ? '#00286880' : 'rgba(255,255,255,0.5)' }} className="text-[8px]">{date}</span>
                </span>
              </div>
              <div className="grid grid-cols-1 gap-1">
                {MATCHES.filter(m => m.round === round).map(match => (
                  <BracketMatch key={match.id} matchId={match.id} {...ctx} />
                ))}
              </div>
            </div>
          ))}

          <div className="flex justify-center"><div className="w-px h-4 bg-[#4a8ad4]/30" /></div>

          <div className="grid grid-cols-1 gap-2">
            <div>
              <div className="text-center mb-1"><span className="inline-flex px-2 py-0.5 rounded-full bg-[#6B6300] text-white/70 text-[8px] font-bold">المركز الثالث</span></div>
              {MATCHES.filter(m => m.round === '3rd').map(match => <BracketMatch key={match.id} matchId={match.id} {...ctx} />)}
            </div>
            <div>
              <div className="text-center mb-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-l from-[#FFD700] to-[#FF8C00] text-[#002868] text-[8px] font-bold"><Trophy className="w-2 h-2" /> النهائي</span>
              </div>
              {MATCHES.filter(m => m.round === 'final').map(match => <BracketMatch key={match.id} matchId={match.id} {...ctx} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
