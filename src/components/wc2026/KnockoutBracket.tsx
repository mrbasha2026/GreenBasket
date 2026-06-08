'use client';

import { useMemo } from 'react';
import { TEAMS, MATCHES, THIRD_PLACE_ELIGIBLE_GROUPS, getTeamRefDisplayName } from '@/lib/wc2026-data';
import { MatchResult, calculateGroupStandings, calculateThirdPlaceRanking, formatTimeAr } from '@/lib/wc2026-logic';
import { useWC2026Store } from '@/store/wc2026-store';
import { TeamFlag } from './TeamFlag';
import { Star, Clock, Trophy } from 'lucide-react';

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

// Bracket match card - compact dark blue card
interface BracketMatchProps {
  matchId: number;
  onMatchClick: (id: number) => void;
  standings: ReturnType<typeof calculateGroupStandings>;
  thirdPlaceRanking: ReturnType<typeof calculateThirdPlaceRanking>;
  results: Record<number, MatchResult>;
}

function BracketMatch({ matchId, onMatchClick, standings, thirdPlaceRanking, results }: BracketMatchProps) {
  const { favoriteMatches, toggleFavoriteMatch } = useWC2026Store();
  const match = MATCHES.find(m => m.id === matchId);
  if (!match) return null;

  const result = results[matchId];
  const isFavorite = favoriteMatches.has(matchId);

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
    (result.homeGoals === result.awayGoals && result.homePenalties !== undefined && result.awayPenalties !== undefined && result.awayPenalties > result.homePenalties)
  ) : false;

  return (
    <div
      className="cursor-pointer hover:ring-2 hover:ring-[#FFD700]/60 transition-all duration-200 rounded-md overflow-hidden w-[175px] bg-[#0d3060] border border-[#1a4a8e]/60 shadow-sm"
      onClick={() => onMatchClick(matchId)}
    >
      {/* Team 1 */}
      <div className={`flex items-center gap-1 px-2 py-[5px] min-h-[30px] ${isTeam1Winner ? 'bg-[#00A651]/15' : ''}`}>
        <span className="text-[8px] text-[#FFD700] font-mono w-5 text-center flex-shrink-0 font-bold">{refLabel1}</span>
        {team1Resolved ? (
          <TeamFlag teamName={team1Resolved} size="sm" />
        ) : (
          <span className="w-5 h-[14px] flex-shrink-0 opacity-20">—</span>
        )}
        <span className={`text-[10px] font-medium truncate flex-1 leading-tight ${!team1Resolved ? 'text-white/30 italic' : ''} ${isTeam1Winner ? 'text-[#00A651] font-bold' : 'text-white/90'}`}>
          {team1Name || getTeamRefDisplayName(team1Ref)}
        </span>
        {result !== undefined && (
          <span className={`text-[11px] font-bold w-5 text-center flex-shrink-0 ${isTeam1Winner ? 'text-[#00A651]' : 'text-white/60'}`}>
            {result.homeGoals}
          </span>
        )}
      </div>

      <div className="h-px bg-[#1a4a8e]/60" />

      {/* Team 2 */}
      <div className={`flex items-center gap-1 px-2 py-[5px] min-h-[30px] ${isTeam2Winner ? 'bg-[#00A651]/15' : ''}`}>
        <span className="text-[8px] text-[#FFD700] font-mono w-5 text-center flex-shrink-0 font-bold">{refLabel2}</span>
        {team2Resolved ? (
          <TeamFlag teamName={team2Resolved} size="sm" />
        ) : (
          <span className="w-5 h-[14px] flex-shrink-0 opacity-20">—</span>
        )}
        <span className={`text-[10px] font-medium truncate flex-1 leading-tight ${!team2Resolved ? 'text-white/30 italic' : ''} ${isTeam2Winner ? 'text-[#00A651] font-bold' : 'text-white/90'}`}>
          {team2Name || getTeamRefDisplayName(team2Ref)}
        </span>
        {result !== undefined && (
          <span className={`text-[11px] font-bold w-5 text-center flex-shrink-0 ${isTeam2Winner ? 'text-[#00A651]' : 'text-white/60'}`}>
            {result.awayGoals}
          </span>
        )}
      </div>

      {/* Penalties */}
      {result && result.homePenalties !== undefined && result.awayPenalties !== undefined && (
        <div className="px-2 py-0.5 bg-[#002868]/60 border-t border-[#1a4a8e]/60">
          <span className="text-[7px] text-amber-400 font-medium">
            ترجيح {result.homePenalties}-{result.awayPenalties}
          </span>
        </div>
      )}

      {/* Match info footer */}
      <div className="flex items-center justify-between px-2 py-[3px] bg-[#002868]/40 border-t border-[#1a4a8e]/40">
        <div className="flex items-center gap-1 min-w-0">
          {match.time && (
            <span className="inline-flex items-center gap-0.5 text-white/40 text-[7px]">
              <Clock className="w-2 h-2" />
              {formatTimeAr(match.time)}
            </span>
          )}
          <span className="text-[7px] text-white/25 truncate">{match.venueAr}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavoriteMatch(matchId);
          }}
          className="p-0 hover:scale-125 transition-transform flex-shrink-0"
          title={isFavorite ? 'إزالة من المفضلة' : 'أضف إلى المفضلة'}
        >
          <Star
            className={`w-2.5 h-2.5 ${
              isFavorite
                ? 'fill-[#FFD700] text-[#FFD700]'
                : 'text-white/20 hover:text-[#FFD700]'
            }`}
          />
        </button>
      </div>
    </div>
  );
}

// SVG Connector: merges two match slots into one
function MergeConnector() {
  return (
    <svg width="24" height="100%" viewBox="0 0 24 100" preserveAspectRatio="none" className="w-6 h-full min-h-[70px]">
      {/* Horizontal line from top match */}
      <line x1="0" y1="25" x2="12" y2="25" stroke="#4a8ad4" strokeWidth="2" />
      {/* Horizontal line from bottom match */}
      <line x1="0" y1="75" x2="12" y2="75" stroke="#4a8ad4" strokeWidth="2" />
      {/* Vertical line connecting them */}
      <line x1="12" y1="25" x2="12" y2="75" stroke="#4a8ad4" strokeWidth="2" />
      {/* Horizontal line to next round */}
      <line x1="12" y1="50" x2="24" y2="50" stroke="#4a8ad4" strokeWidth="2" />
      {/* Junction dots */}
      <circle cx="12" cy="25" r="2" fill="#4a8ad4" />
      <circle cx="12" cy="75" r="2" fill="#4a8ad4" />
      <circle cx="12" cy="50" r="2.5" fill="#FFD700" />
    </svg>
  );
}

// Straight connector from SF to Final
function StraightConnector() {
  return (
    <svg width="24" height="40" viewBox="0 0 24 40">
      <line x1="0" y1="20" x2="24" y2="20" stroke="#4a8ad4" strokeWidth="2" />
      <circle cx="12" cy="20" r="2" fill="#FFD700" />
    </svg>
  );
}

// Round label pill
function RoundLabel({ title, dateRange, color = '#002868' }: { title: string; dateRange: string; color?: string }) {
  return (
    <div className="text-center mb-2">
      <div className="inline-flex flex-col items-center px-3 py-1 rounded-lg border" style={{ backgroundColor: `${color}40`, borderColor: `${color}60` }}>
        <span className="text-white text-[11px] font-bold">{title}</span>
        <span className="text-white/50 text-[8px]">{dateRange}</span>
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

  // Bracket structure - upper half flows to SF 101, lower half to SF 102
  const upperR32 = [
    { top: 73, bottom: 75 },  // → R16: 90
    { top: 74, bottom: 77 },  // → R16: 89
    { top: 81, bottom: 82 },  // → R16: 94
    { top: 83, bottom: 84 },  // → R16: 93
  ];
  const upperR16 = [
    { top: 90, bottom: 89 },  // → QF: 97
    { top: 94, bottom: 93 },  // → QF: 98
  ];
  const upperQF = [{ top: 97, bottom: 98 }]; // → SF: 101

  const lowerR32 = [
    { top: 76, bottom: 78 },  // → R16: 91
    { top: 79, bottom: 80 },  // → R16: 92
    { top: 85, bottom: 87 },  // → R16: 96
    { top: 86, bottom: 88 },  // → R16: 95
  ];
  const lowerR16 = [
    { top: 91, bottom: 92 },  // → QF: 99
    { top: 96, bottom: 95 },  // → QF: 100
  ];
  const lowerQF = [{ top: 99, bottom: 100 }]; // → SF: 102

  return (
    <div className="space-y-6">
      {/* Third Place Ranking */}
      {showThirdPlaceRanking && (
        <div className="p-4 rounded-xl border border-[#FFD700]/30 bg-[#FFD700]/5">
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
        </div>
      )}

      {/* ==================== DESKTOP BRACKET (horizontal tree) ==================== */}
      <div className="hidden md:block bg-gradient-to-b from-[#001a4a] to-[#0a2a5e] rounded-2xl p-4 lg:p-6 shadow-xl border border-[#1a4a8e]/30 overflow-x-auto">
        {/* Trophy header */}
        <div className="flex justify-center mb-4">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-bl from-[#FFD700] to-[#daa520] flex items-center justify-center shadow-lg shadow-[#FFD700]/20 border-2 border-[#FFD700]/40">
              <Trophy className="w-8 h-8 text-[#002868]" />
            </div>
            <h2 className="text-white text-xl font-bold mt-2">الأدوار الإقصائية</h2>
            <p className="text-[#FFD700]/60 text-[10px] font-medium tracking-wider">KNOCKOUT STAGE</p>
          </div>
        </div>

        {/* Round labels */}
        <div className="flex items-center mb-3" style={{ minWidth: '1100px' }}>
          <div className="w-[175px] flex-shrink-0"><RoundLabel title="دور الـ 32" dateRange="28 يونيو - 3 يوليو" color="#1a4a8e" /></div>
          <div className="w-6 flex-shrink-0" />
          <div className="w-[175px] flex-shrink-0"><RoundLabel title="دور الـ 16" dateRange="4 - 7 يوليو" color="#1a4a8e" /></div>
          <div className="w-6 flex-shrink-0" />
          <div className="w-[175px] flex-shrink-0"><RoundLabel title="ربع النهائي" dateRange="9 - 11 يوليو" color="#1a4a8e" /></div>
          <div className="w-6 flex-shrink-0" />
          <div className="w-[175px] flex-shrink-0"><RoundLabel title="نصف النهائي" dateRange="14 - 15 يوليو" color="#1a4a8e" /></div>
          <div className="w-6 flex-shrink-0" />
          <div className="w-[175px] flex-shrink-0"><RoundLabel title="النهائي" dateRange="19 يوليو" color="#FFD700" /></div>
        </div>

        {/* ========== UPPER BRACKET (→ SF 101 → Final) ========== */}
        <div className="flex items-stretch" style={{ minWidth: '1100px' }}>
          {/* R32 Upper */}
          <div className="flex flex-col justify-around gap-2 w-[175px] flex-shrink-0">
            {upperR32.map((pair, i) => (
              <div key={i} className="flex flex-col gap-1">
                <BracketMatch matchId={pair.top} {...ctx} />
                <BracketMatch matchId={pair.bottom} {...ctx} />
              </div>
            ))}
          </div>

          {/* Connector R32→R16 */}
          <div className="flex flex-col justify-around w-6 flex-shrink-0">
            {upperR16.map((_, i) => (
              <div key={i} className="flex-1 flex items-center">
                <MergeConnector />
              </div>
            ))}
          </div>

          {/* R16 Upper */}
          <div className="flex flex-col justify-around gap-4 w-[175px] flex-shrink-0">
            {upperR16.map((pair, i) => (
              <div key={i} className="flex flex-col gap-1">
                <BracketMatch matchId={pair.top} {...ctx} />
                <BracketMatch matchId={pair.bottom} {...ctx} />
              </div>
            ))}
          </div>

          {/* Connector R16→QF */}
          <div className="flex flex-col justify-around w-6 flex-shrink-0">
            {upperQF.map((_, i) => (
              <div key={i} className="flex-1 flex items-center">
                <MergeConnector />
              </div>
            ))}
          </div>

          {/* QF Upper */}
          <div className="flex flex-col justify-around gap-8 w-[175px] flex-shrink-0">
            {upperQF.map((pair, i) => (
              <div key={i} className="flex flex-col gap-1">
                <BracketMatch matchId={pair.top} {...ctx} />
                <BracketMatch matchId={pair.bottom} {...ctx} />
              </div>
            ))}
          </div>

          {/* Connector QF→SF */}
          <div className="flex flex-col justify-center w-6 flex-shrink-0">
            <div className="flex-1 flex items-center">
              <MergeConnector />
            </div>
          </div>

          {/* SF Upper */}
          <div className="flex flex-col justify-center w-[175px] flex-shrink-0">
            <BracketMatch matchId={101} {...ctx} />
          </div>

          {/* Connector SF→Final */}
          <div className="flex flex-col justify-center w-6 flex-shrink-0">
            <StraightConnector />
          </div>

          {/* Final + 3rd Place */}
          <div className="flex flex-col justify-center gap-4 w-[175px] flex-shrink-0">
            <div>
              <div className="text-center mb-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-l from-[#FFD700] to-[#FF8C00] text-[#002868] text-[10px] font-bold shadow-lg shadow-[#FFD700]/20 border border-[#FFD700]/30">
                  <Trophy className="w-3 h-3" />
                  النهائي
                </span>
              </div>
              <BracketMatch matchId={104} {...ctx} />
            </div>
            <div>
              <div className="text-center mb-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-l from-[#6B6300] to-[#4a4200] text-white/80 text-[9px] font-bold border border-[#8B8000]/30">
                  المركز الثالث
                </span>
              </div>
              <BracketMatch matchId={103} {...ctx} />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-3 flex items-center gap-3" style={{ minWidth: '1100px' }}>
          <div className="flex-1 h-px bg-gradient-to-l from-[#4a8ad4]/40 via-[#4a8ad4]/20 to-transparent" />
          <span className="text-[9px] text-[#4a8ad4]/50 font-bold tracking-[4px]">● ● ●</span>
          <div className="flex-1 h-px bg-gradient-to-r from-[#4a8ad4]/40 via-[#4a8ad4]/20 to-transparent" />
        </div>

        {/* ========== LOWER BRACKET (→ SF 102 → Final) ========== */}
        <div className="flex items-stretch" style={{ minWidth: '1100px' }}>
          {/* R32 Lower */}
          <div className="flex flex-col justify-around gap-2 w-[175px] flex-shrink-0">
            {lowerR32.map((pair, i) => (
              <div key={i} className="flex flex-col gap-1">
                <BracketMatch matchId={pair.top} {...ctx} />
                <BracketMatch matchId={pair.bottom} {...ctx} />
              </div>
            ))}
          </div>

          {/* Connector R32→R16 */}
          <div className="flex flex-col justify-around w-6 flex-shrink-0">
            {lowerR16.map((_, i) => (
              <div key={i} className="flex-1 flex items-center">
                <MergeConnector />
              </div>
            ))}
          </div>

          {/* R16 Lower */}
          <div className="flex flex-col justify-around gap-4 w-[175px] flex-shrink-0">
            {lowerR16.map((pair, i) => (
              <div key={i} className="flex flex-col gap-1">
                <BracketMatch matchId={pair.top} {...ctx} />
                <BracketMatch matchId={pair.bottom} {...ctx} />
              </div>
            ))}
          </div>

          {/* Connector R16→QF */}
          <div className="flex flex-col justify-around w-6 flex-shrink-0">
            {lowerQF.map((_, i) => (
              <div key={i} className="flex-1 flex items-center">
                <MergeConnector />
              </div>
            ))}
          </div>

          {/* QF Lower */}
          <div className="flex flex-col justify-around gap-8 w-[175px] flex-shrink-0">
            {lowerQF.map((pair, i) => (
              <div key={i} className="flex flex-col gap-1">
                <BracketMatch matchId={pair.top} {...ctx} />
                <BracketMatch matchId={pair.bottom} {...ctx} />
              </div>
            ))}
          </div>

          {/* Connector QF→SF */}
          <div className="flex flex-col justify-center w-6 flex-shrink-0">
            <div className="flex-1 flex items-center">
              <MergeConnector />
            </div>
          </div>

          {/* SF Lower */}
          <div className="flex flex-col justify-center w-[175px] flex-shrink-0">
            <BracketMatch matchId={102} {...ctx} />
          </div>

          {/* Connector SF→Final */}
          <div className="flex flex-col justify-center w-6 flex-shrink-0">
            <StraightConnector />
          </div>

          {/* Spacer (Final/3rd Place already shown in upper bracket) */}
          <div className="w-[175px] flex-shrink-0 flex flex-col justify-center gap-4">
            <div className="h-[100px]" />
            <div className="h-[100px]" />
          </div>
        </div>
      </div>

      {/* ==================== MOBILE BRACKET (vertical by rounds) ==================== */}
      <div className="md:hidden bg-gradient-to-b from-[#001a4a] to-[#0a2a5e] rounded-2xl p-3 shadow-xl border border-[#1a4a8e]/30">
        {/* Trophy header */}
        <div className="flex justify-center mb-4">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-bl from-[#FFD700] to-[#daa520] flex items-center justify-center shadow-lg border border-[#FFD700]/30">
              <Trophy className="w-6 h-6 text-[#002868]" />
            </div>
            <h2 className="text-white text-base font-bold mt-2">الأدوار الإقصائية</h2>
          </div>
        </div>

        <div className="space-y-5">
          {/* Round of 32 */}
          <div>
            <div className="text-center mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1a4a8e] text-white text-[11px] font-bold border border-[#2a5a9e]/50">
                دور الـ 32
                <span className="text-white/50 text-[9px]">28 يونيو - 3 يوليو</span>
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {MATCHES.filter(m => m.round === 'r32').map(match => (
                <BracketMatch key={match.id} matchId={match.id} {...ctx} />
              ))}
            </div>
          </div>

          <div className="flex justify-center"><div className="w-px h-5 bg-[#4a8ad4]/30" /></div>

          {/* Round of 16 */}
          <div>
            <div className="text-center mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E31837] text-white text-[11px] font-bold border border-[#E31837]/50">
                دور الـ 16
                <span className="text-white/50 text-[9px]">4 - 7 يوليو</span>
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {MATCHES.filter(m => m.round === 'r16').map(match => (
                <BracketMatch key={match.id} matchId={match.id} {...ctx} />
              ))}
            </div>
          </div>

          <div className="flex justify-center"><div className="w-px h-5 bg-[#4a8ad4]/30" /></div>

          {/* Quarter-finals */}
          <div>
            <div className="text-center mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFD700] text-[#002868] text-[11px] font-bold border border-[#FFD700]/50">
                ربع النهائي
                <span className="text-[#002868]/50 text-[9px]">9 - 11 يوليو</span>
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {MATCHES.filter(m => m.round === 'qf').map(match => (
                <BracketMatch key={match.id} matchId={match.id} {...ctx} />
              ))}
            </div>
          </div>

          <div className="flex justify-center"><div className="w-px h-5 bg-[#4a8ad4]/30" /></div>

          {/* Semi-finals */}
          <div>
            <div className="text-center mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00A651] text-white text-[11px] font-bold border border-[#00A651]/50">
                نصف النهائي
                <span className="text-white/50 text-[9px]">14 - 15 يوليو</span>
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {MATCHES.filter(m => m.round === 'sf').map(match => (
                <BracketMatch key={match.id} matchId={match.id} {...ctx} />
              ))}
            </div>
          </div>

          <div className="flex justify-center"><div className="w-px h-5 bg-[#4a8ad4]/30" /></div>

          {/* 3rd Place + Final */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <div className="text-center mb-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-l from-[#6B6300] to-[#4a4200] text-white/80 text-[10px] font-bold border border-[#8B8000]/30">
                  المركز الثالث
                </span>
              </div>
              {MATCHES.filter(m => m.round === '3rd').map(match => (
                <BracketMatch key={match.id} matchId={match.id} {...ctx} />
              ))}
            </div>
            <div>
              <div className="text-center mb-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-l from-[#FFD700] to-[#FF8C00] text-[#002868] text-[10px] font-bold shadow-lg border border-[#FFD700]/30">
                  <Trophy className="w-3 h-3" />
                  النهائي
                </span>
              </div>
              {MATCHES.filter(m => m.round === 'final').map(match => (
                <BracketMatch key={match.id} matchId={match.id} {...ctx} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
