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

// Bracket match card - compact, data visible directly
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

  const isDraw = result ? (result.homeGoals === result.awayGoals && (result.homePenalties === undefined || result.awayPenalties === undefined || result.homePenalties === result.awayPenalties)) : false;
  const isTeam1Winner = result ? (
    result.homeGoals > result.awayGoals ||
    (result.homeGoals === result.awayGoals && result.homePenalties !== undefined && result.awayPenalties !== undefined && result.homePenalties > result.awayPenalties)
  ) : false;
  const isTeam2Winner = result ? (
    result.awayGoals > result.homeGoals ||
    (result.homeGoals === result.awayGoals && result.homePenalties !== undefined && result.awayPenalties !== undefined && result.awayPenalties > result.homePenalties)
  ) : false;
  const isTeam1Loser = result ? (!isTeam1Winner && !isDraw) : false;
  const isTeam2Loser = result ? (!isTeam2Winner && !isDraw) : false;

  const teamRow = (
    teamResolved: string | null,
    teamRef: string,
    isWinner: boolean,
    isLoser: boolean,
    goals: number | undefined,
  ) => {
    const teamName = teamResolved ? (TEAMS[teamResolved]?.nameAr || teamResolved) : null;
    let bg = '';
    if (isWinner) bg = 'bg-[#00A651]/15';
    else if (isLoser) bg = 'bg-[#E31837]/10';
    else if (isDraw) bg = 'bg-[#D4A017]/10';

    return (
      <div className={`flex items-center gap-1 px-2 py-[5px] min-h-[28px] ${bg}`}>
        {teamResolved ? (
          <TeamFlag teamName={teamResolved} size="sm" />
        ) : (
          <span className="w-5 h-[14px] flex-shrink-0 rounded-sm bg-[#1a4a8e]/40 flex items-center justify-center text-[8px] text-white/30">?</span>
        )}
        <span className={`text-[11px] truncate flex-1 leading-tight ${!teamResolved ? 'text-white/30 italic' : ''} ${isWinner ? 'text-[#00A651] font-bold' : ''} ${isLoser ? 'text-[#E31837]' : ''} ${isDraw ? 'text-[#D4A017] font-bold' : ''} ${!isWinner && !isLoser && !isDraw && teamResolved ? 'text-white/90' : ''}`}>
          {teamName || getTeamRefDisplayName(teamRef)}
        </span>
        {result !== undefined && (
          <span className={`text-[12px] font-bold min-w-[18px] text-center flex-shrink-0 ${isWinner ? 'text-[#00A651]' : isLoser ? 'text-[#E31837]' : isDraw ? 'text-[#D4A017]' : 'text-white/50'}`}>
            {goals}
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      className="cursor-pointer hover:ring-2 hover:ring-[#FFD700]/40 hover:bg-[#0d3060] transition-all duration-150 rounded-lg overflow-hidden bg-[#081e42] border border-[#1a4a8e]/40"
      onClick={() => onMatchClick(matchId)}
    >
      {teamRow(team1Resolved, team1Ref, isTeam1Winner, isTeam1Loser, result?.homeGoals)}
      <div className="h-px bg-[#1a4a8e]/30" />
      {teamRow(team2Resolved, team2Ref, isTeam2Winner, isTeam2Loser, result?.awayGoals)}
      {result && result.homePenalties !== undefined && result.awayPenalties !== undefined && (
        <div className="px-2 py-[2px] bg-[#002868]/30 border-t border-[#1a4a8e]/30">
          <span className="text-[8px] text-amber-400">ترجيح {result.homePenalties}-{result.awayPenalties}</span>
        </div>
      )}
    </div>
  );
}

// SVG Connectors
function ConnectorLTR({ h = 80 }: { h?: number }) {
  const y1 = h * 0.25, y2 = h * 0.75, ym = h * 0.5;
  return (
    <svg width="20" height={h} viewBox={`0 0 20 ${h}`} className="flex-shrink-0" preserveAspectRatio="none">
      <line x1="10" y1={y1} x2="20" y2={y1} stroke="#4a8ad4" strokeWidth="1.5" />
      <line x1="10" y1={y2} x2="20" y2={y2} stroke="#4a8ad4" strokeWidth="1.5" />
      <line x1="10" y1={y1} x2="10" y2={y2} stroke="#4a8ad4" strokeWidth="1.5" />
      <line x1="0" y1={ym} x2="10" y2={ym} stroke="#4a8ad4" strokeWidth="1.5" />
      <circle cx="10" cy={ym} r="2" fill="#FFD700" />
    </svg>
  );
}

function ConnectorRTL({ h = 80 }: { h?: number }) {
  const y1 = h * 0.25, y2 = h * 0.75, ym = h * 0.5;
  return (
    <svg width="20" height={h} viewBox={`0 0 20 ${h}`} className="flex-shrink-0" preserveAspectRatio="none">
      <line x1="0" y1={y1} x2="10" y2={y1} stroke="#4a8ad4" strokeWidth="1.5" />
      <line x1="0" y1={y2} x2="10" y2={y2} stroke="#4a8ad4" strokeWidth="1.5" />
      <line x1="10" y1={y1} x2="10" y2={y2} stroke="#4a8ad4" strokeWidth="1.5" />
      <line x1="10" y1={ym} x2="20" y2={ym} stroke="#4a8ad4" strokeWidth="1.5" />
      <circle cx="10" cy={ym} r="2" fill="#FFD700" />
    </svg>
  );
}

// Round label
function RoundLabel({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="inline-flex flex-col items-center px-2 py-0.5 rounded bg-[#1a4a8e]/30 border border-[#2a5a9e]/20">
      <span className="text-white/80 text-[9px] font-bold">{title}</span>
      <span className="text-white/30 text-[6px]">{sub}</span>
    </div>
  );
}

export function KnockoutBracket({ onMatchClick }: KnockoutBracketProps) {
  const { results } = useWC2026Store();
  const standings = useMemo(() => calculateGroupStandings(results), [results]);
  const thirdPlaceRanking = useMemo(() => calculateThirdPlaceRanking(standings), [standings]);

  const ctx = { standings, thirdPlaceRanking, results, onMatchClick };
  const showThirdPlaceRanking = thirdPlaceRanking.some(tp => tp.points > 0);

  // BRACKET STRUCTURE
  // LEFT HALF: R32 far-left → R16 → QF → SF → Final center
  const leftR32 = [76, 78, 79, 80, 85, 87, 86, 88];
  const leftR16 = [91, 92, 95, 96];
  const leftQF = [99, 100];
  const leftSF = 102;

  // RIGHT HALF: SF → QF → R16 → R32 far-right
  const rightR32 = [73, 75, 74, 77, 81, 82, 83, 84];
  const rightR16 = [89, 90, 93, 94];
  const rightQF = [97, 98];
  const rightSF = 101;

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

      {/* ==================== DESKTOP BRACKET (xl+) ==================== */}
      <div className="hidden xl:block bg-gradient-to-b from-[#001a4a] to-[#0a2a5e] rounded-2xl p-5 shadow-xl border border-[#1a4a8e]/30">
        {/* Trophy header */}
        <div className="flex justify-center mb-4">
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-gradient-to-bl from-[#FFD700] to-[#daa520] flex items-center justify-center shadow-lg shadow-[#FFD700]/15 border-2 border-[#FFD700]/30">
              <Trophy className="w-7 h-7 text-[#002868]" />
            </div>
            <h2 className="text-white text-lg font-bold mt-1.5">الأدوار الإقصائية</h2>
          </div>
        </div>

        {/* Round labels */}
        <div className="flex items-center justify-center mb-3 gap-0">
          <div className="flex-1 flex items-center">
            <div className="flex-shrink-0 text-center" style={{ width: '12%' }}><RoundLabel title="دور الـ 32" sub="28 يونيو - 3 يوليو" /></div>
            <div className="flex-shrink-0" style={{ width: '2%' }} />
            <div className="flex-shrink-0 text-center" style={{ width: '12%' }}><RoundLabel title="دور الـ 16" sub="4 - 7 يوليو" /></div>
            <div className="flex-shrink-0" style={{ width: '2%' }} />
            <div className="flex-shrink-0 text-center" style={{ width: '12%' }}><RoundLabel title="ربع النهائي" sub="9 - 11 يوليو" /></div>
            <div className="flex-shrink-0" style={{ width: '2%' }} />
            <div className="flex-shrink-0 text-center" style={{ width: '12%' }}><RoundLabel title="نصف النهائي" sub="14 - 15 يوليو" /></div>
          </div>
          <div className="flex-shrink-0 text-center" style={{ width: '14%' }}><RoundLabel title="النهائي" sub="19 يوليو" /></div>
          <div className="flex-1 flex items-center">
            <div className="flex-shrink-0 text-center" style={{ width: '12%' }}><RoundLabel title="نصف النهائي" sub="14 - 15 يوليو" /></div>
            <div className="flex-shrink-0" style={{ width: '2%' }} />
            <div className="flex-shrink-0 text-center" style={{ width: '12%' }}><RoundLabel title="ربع النهائي" sub="9 - 11 يوليو" /></div>
            <div className="flex-shrink-0" style={{ width: '2%' }} />
            <div className="flex-shrink-0 text-center" style={{ width: '12%' }}><RoundLabel title="دور الـ 16" sub="4 - 7 يوليو" /></div>
            <div className="flex-shrink-0" style={{ width: '2%' }} />
            <div className="flex-shrink-0 text-center" style={{ width: '12%' }}><RoundLabel title="دور الـ 32" sub="28 يونيو - 3 يوليو" /></div>
          </div>
        </div>

        {/* Bracket Row */}
        <div className="flex items-stretch">
          {/* LEFT: R32(far) → R16 → QF → SF(near) */}
          <div className="flex items-stretch flex-1">
            {/* R32 */}
            <div className="flex flex-col justify-around gap-[2px]" style={{ width: '12%' }}>
              {leftR32.map(id => <BracketMatch key={id} matchId={id} {...ctx} />)}
            </div>
            <div className="flex flex-col justify-around" style={{ width: '2%' }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-1 flex items-center"><ConnectorLTR h={68} /></div>
              ))}
            </div>
            {/* R16 */}
            <div className="flex flex-col justify-around gap-2" style={{ width: '12%' }}>
              {leftR16.map(id => <BracketMatch key={id} matchId={id} {...ctx} />)}
            </div>
            <div className="flex flex-col justify-around" style={{ width: '2%' }}>
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex-1 flex items-center"><ConnectorLTR h={140} /></div>
              ))}
            </div>
            {/* QF */}
            <div className="flex flex-col justify-around gap-6" style={{ width: '12%' }}>
              {leftQF.map(id => <BracketMatch key={id} matchId={id} {...ctx} />)}
            </div>
            <div className="flex flex-col justify-around" style={{ width: '2%' }}>
              <div className="flex-1 flex items-center"><ConnectorLTR h={280} /></div>
            </div>
            {/* SF */}
            <div className="flex flex-col justify-center" style={{ width: '12%' }}>
              <BracketMatch matchId={leftSF} {...ctx} />
            </div>
          </div>

          {/* CENTER: Final + Logo + 3rd Place */}
          <div className="flex flex-col justify-center items-center" style={{ width: '14%' }}>
            {/* Final */}
            <div>
              <div className="text-center mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-l from-[#FFD700] to-[#FF8C00] text-[#002868] text-[10px] font-bold shadow-lg shadow-[#FFD700]/20 border border-[#FFD700]/40">
                  <Trophy className="w-3 h-3" /> النهائي
                </span>
              </div>
              <BracketMatch matchId={104} {...ctx} />
            </div>
            {/* Large WC2026 Logo between Final and 3rd Place */}
            <div className="my-4 flex items-center justify-center">
              <img src="/wc2026-logo-official.svg" alt="كأس العالم 2026" className="h-24 w-auto opacity-90" />
            </div>
            {/* 3rd Place */}
            <div>
              <div className="text-center mb-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#6B6300]/80 text-white/70 text-[9px] font-bold border border-[#8B8000]/20">
                  المركز الثالث
                </span>
              </div>
              <BracketMatch matchId={103} {...ctx} />
            </div>
          </div>

          {/* RIGHT: SF(near) → QF → R16 → R32(far) */}
          <div className="flex items-stretch flex-1">
            {/* SF */}
            <div className="flex flex-col justify-center" style={{ width: '12%' }}>
              <BracketMatch matchId={rightSF} {...ctx} />
            </div>
            <div className="flex flex-col justify-around" style={{ width: '2%' }}>
              <div className="flex-1 flex items-center"><ConnectorRTL h={280} /></div>
            </div>
            {/* QF */}
            <div className="flex flex-col justify-around gap-6" style={{ width: '12%' }}>
              {rightQF.map(id => <BracketMatch key={id} matchId={id} {...ctx} />)}
            </div>
            <div className="flex flex-col justify-around" style={{ width: '2%' }}>
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex-1 flex items-center"><ConnectorRTL h={140} /></div>
              ))}
            </div>
            {/* R16 */}
            <div className="flex flex-col justify-around gap-2" style={{ width: '12%' }}>
              {rightR16.map(id => <BracketMatch key={id} matchId={id} {...ctx} />)}
            </div>
            <div className="flex flex-col justify-around" style={{ width: '2%' }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-1 flex items-center"><ConnectorRTL h={68} /></div>
              ))}
            </div>
            {/* R32 */}
            <div className="flex flex-col justify-around gap-[2px]" style={{ width: '12%' }}>
              {rightR32.map(id => <BracketMatch key={id} matchId={id} {...ctx} />)}
            </div>
          </div>
        </div>
      </div>

      {/* ==================== LARGE TABLET / SMALL DESKTOP (lg) ==================== */}
      <div className="hidden lg:flex xl:hidden bg-gradient-to-b from-[#001a4a] to-[#0a2a5e] rounded-2xl p-4 shadow-xl border border-[#1a4a8e]/30">
        <div className="flex flex-col items-center w-full">
          <div className="flex flex-col items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-bl from-[#FFD700] to-[#daa520] flex items-center justify-center shadow-lg border border-[#FFD700]/30">
              <Trophy className="w-5 h-5 text-[#002868]" />
            </div>
            <h2 className="text-white text-sm font-bold mt-1">الأدوار الإقصائية</h2>
          </div>

          <div className="flex items-stretch w-full">
            {/* LEFT */}
            <div className="flex items-stretch flex-1">
              <div className="flex flex-col justify-around gap-[1px]" style={{ width: '12%' }}>
                {leftR32.map(id => <BracketMatch key={id} matchId={id} {...ctx} />)}
              </div>
              <div className="flex flex-col justify-around" style={{ width: '2%' }}>
                {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="flex-1 flex items-center"><ConnectorLTR h={58} /></div>))}
              </div>
              <div className="flex flex-col justify-around gap-1" style={{ width: '12%' }}>
                {leftR16.map(id => <BracketMatch key={id} matchId={id} {...ctx} />)}
              </div>
              <div className="flex flex-col justify-around" style={{ width: '2%' }}>
                {Array.from({ length: 2 }).map((_, i) => (<div key={i} className="flex-1 flex items-center"><ConnectorLTR h={120} /></div>))}
              </div>
              <div className="flex flex-col justify-around gap-4" style={{ width: '12%' }}>
                {leftQF.map(id => <BracketMatch key={id} matchId={id} {...ctx} />)}
              </div>
              <div className="flex flex-col justify-around" style={{ width: '2%' }}>
                <div className="flex-1 flex items-center"><ConnectorLTR h={240} /></div>
              </div>
              <div className="flex flex-col justify-center" style={{ width: '12%' }}>
                <BracketMatch matchId={leftSF} {...ctx} />
              </div>
            </div>

            {/* CENTER */}
            <div className="flex flex-col justify-center items-center" style={{ width: '14%' }}>
              <div>
                <div className="text-center mb-1"><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-l from-[#FFD700] to-[#FF8C00] text-[#002868] text-[8px] font-bold"><Trophy className="w-2 h-2" /> النهائي</span></div>
                <BracketMatch matchId={104} {...ctx} />
              </div>
              <div className="my-3 flex items-center justify-center">
                <img src="/wc2026-logo-official.svg" alt="كأس العالم 2026" className="h-16 w-auto opacity-80" />
              </div>
              <div>
                <div className="text-center mb-1"><span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#6B6300] text-white/70 text-[7px] font-bold">المركز الثالث</span></div>
                <BracketMatch matchId={103} {...ctx} />
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex items-stretch flex-1">
              <div className="flex flex-col justify-center" style={{ width: '12%' }}>
                <BracketMatch matchId={rightSF} {...ctx} />
              </div>
              <div className="flex flex-col justify-around" style={{ width: '2%' }}>
                <div className="flex-1 flex items-center"><ConnectorRTL h={240} /></div>
              </div>
              <div className="flex flex-col justify-around gap-4" style={{ width: '12%' }}>
                {rightQF.map(id => <BracketMatch key={id} matchId={id} {...ctx} />)}
              </div>
              <div className="flex flex-col justify-around" style={{ width: '2%' }}>
                {Array.from({ length: 2 }).map((_, i) => (<div key={i} className="flex-1 flex items-center"><ConnectorRTL h={120} /></div>))}
              </div>
              <div className="flex flex-col justify-around gap-1" style={{ width: '12%' }}>
                {rightR16.map(id => <BracketMatch key={id} matchId={id} {...ctx} />)}
              </div>
              <div className="flex flex-col justify-around" style={{ width: '2%' }}>
                {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="flex-1 flex items-center"><ConnectorRTL h={58} /></div>))}
              </div>
              <div className="flex flex-col justify-around gap-[1px]" style={{ width: '12%' }}>
                {rightR32.map(id => <BracketMatch key={id} matchId={id} {...ctx} />)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== TABLET (md) ==================== */}
      <div className="hidden md:flex lg:hidden bg-gradient-to-b from-[#001a4a] to-[#0a2a5e] rounded-2xl p-3 shadow-xl border border-[#1a4a8e]/30">
        <div className="flex flex-col items-center w-full">
          <div className="flex flex-col items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-bl from-[#FFD700] to-[#daa520] flex items-center justify-center shadow-lg border border-[#FFD700]/30">
              <Trophy className="w-5 h-5 text-[#002868]" />
            </div>
            <h2 className="text-white text-sm font-bold mt-1">الأدوار الإقصائية</h2>
          </div>

          <div className="flex items-stretch w-full">
            {/* LEFT */}
            <div className="flex items-stretch flex-1">
              <div className="flex flex-col justify-around gap-0" style={{ width: '12%' }}>
                {leftR32.map(id => <BracketMatch key={id} matchId={id} {...ctx} />)}
              </div>
              <div className="flex flex-col justify-around" style={{ width: '2%' }}>
                {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="flex-1 flex items-center"><ConnectorLTR h={48} /></div>))}
              </div>
              <div className="flex flex-col justify-around gap-1" style={{ width: '12%' }}>
                {leftR16.map(id => <BracketMatch key={id} matchId={id} {...ctx} />)}
              </div>
              <div className="flex flex-col justify-around" style={{ width: '2%' }}>
                {Array.from({ length: 2 }).map((_, i) => (<div key={i} className="flex-1 flex items-center"><ConnectorLTR h={100} /></div>))}
              </div>
              <div className="flex flex-col justify-around gap-3" style={{ width: '12%' }}>
                {leftQF.map(id => <BracketMatch key={id} matchId={id} {...ctx} />)}
              </div>
              <div className="flex flex-col justify-around" style={{ width: '2%' }}>
                <div className="flex-1 flex items-center"><ConnectorLTR h={200} /></div>
              </div>
              <div className="flex flex-col justify-center" style={{ width: '12%' }}>
                <BracketMatch matchId={leftSF} {...ctx} />
              </div>
            </div>

            {/* CENTER */}
            <div className="flex flex-col justify-center items-center" style={{ width: '14%' }}>
              <div>
                <div className="text-center mb-1"><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-l from-[#FFD700] to-[#FF8C00] text-[#002868] text-[7px] font-bold"><Trophy className="w-2 h-2" /> النهائي</span></div>
                <BracketMatch matchId={104} {...ctx} />
              </div>
              <div className="my-2 flex items-center justify-center">
                <img src="/wc2026-logo-official.svg" alt="كأس العالم 2026" className="h-12 w-auto opacity-80" />
              </div>
              <div>
                <div className="text-center mb-1"><span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#6B6300] text-white/70 text-[7px] font-bold">المركز الثالث</span></div>
                <BracketMatch matchId={103} {...ctx} />
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex items-stretch flex-1">
              <div className="flex flex-col justify-center" style={{ width: '12%' }}>
                <BracketMatch matchId={rightSF} {...ctx} />
              </div>
              <div className="flex flex-col justify-around" style={{ width: '2%' }}>
                <div className="flex-1 flex items-center"><ConnectorRTL h={200} /></div>
              </div>
              <div className="flex flex-col justify-around gap-3" style={{ width: '12%' }}>
                {rightQF.map(id => <BracketMatch key={id} matchId={id} {...ctx} />)}
              </div>
              <div className="flex flex-col justify-around" style={{ width: '2%' }}>
                {Array.from({ length: 2 }).map((_, i) => (<div key={i} className="flex-1 flex items-center"><ConnectorRTL h={100} /></div>))}
              </div>
              <div className="flex flex-col justify-around gap-1" style={{ width: '12%' }}>
                {rightR16.map(id => <BracketMatch key={id} matchId={id} {...ctx} />)}
              </div>
              <div className="flex flex-col justify-around" style={{ width: '2%' }}>
                {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="flex-1 flex items-center"><ConnectorRTL h={48} /></div>))}
              </div>
              <div className="flex flex-col justify-around gap-0" style={{ width: '12%' }}>
                {rightR32.map(id => <BracketMatch key={id} matchId={id} {...ctx} />)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== MOBILE ==================== */}
      <div className="md:hidden bg-gradient-to-b from-[#001a4a] to-[#0a2a5e] rounded-2xl p-3 shadow-xl border border-[#1a4a8e]/30">
        <div className="flex justify-center mb-3">
          <div className="flex flex-col items-center">
            <img src="/wc2026-logo-official.svg" alt="كأس العالم 2026" className="h-14 w-auto mb-2" />
            <h2 className="text-white text-sm font-bold">الأدوار الإقصائية</h2>
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
