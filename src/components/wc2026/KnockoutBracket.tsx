'use client';

import { useMemo } from 'react';
import { TEAMS, MATCHES, ROUND_NAMES_AR, THIRD_PLACE_ELIGIBLE_GROUPS, getTeamRefDisplayName } from '@/lib/wc2026-data';
import { MatchResult, calculateGroupStandings, calculateThirdPlaceRanking, formatTimeAr, formatDateAr } from '@/lib/wc2026-logic';
import { useWC2026Store } from '@/store/wc2026-store';
import { TeamFlag } from './TeamFlag';
import { Star, Clock } from 'lucide-react';

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

// Compact bracket match slot - shows one team line
interface BracketSlotProps {
  teamName: string | null;
  teamKey: string;
  isResolved: boolean;
  score?: number;
  isWinner?: boolean;
  refLabel: string;
  teamRef: string;
}

function BracketSlot({ teamName, teamKey, isResolved, score, isWinner, refLabel, teamRef }: BracketSlotProps) {
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1.5 min-h-[32px] ${isWinner ? 'bg-[#00A651]/10' : ''}`}>
      <span className="text-[9px] text-white/50 font-mono w-5 text-center flex-shrink-0">{refLabel}</span>
      {isResolved ? (
        <TeamFlag teamName={teamKey} size="sm" />
      ) : (
        <span className="w-5 h-[14px] flex-shrink-0" />
      )}
      <span className={`text-[11px] font-medium truncate flex-1 ${!isResolved ? 'text-white/40 italic' : ''} ${isWinner ? 'text-[#00A651] font-bold' : 'text-white/90'}`}>
        {teamName}
      </span>
      {score !== undefined && (
        <span className={`text-[11px] font-bold w-5 text-center flex-shrink-0 ${isWinner ? 'text-[#00A651]' : 'text-white/60'}`}>
          {score}
        </span>
      )}
    </div>
  );
}

// Full bracket match card - dark blue style like official FIFA design
interface BracketMatchCardProps {
  matchId: number;
  onMatchClick: (id: number) => void;
  standings: ReturnType<typeof calculateGroupStandings>;
  thirdPlaceRanking: ReturnType<typeof calculateThirdPlaceRanking>;
  results: Record<number, MatchResult>;
  showRound?: boolean;
}

function BracketMatchCard({ matchId, onMatchClick, standings, thirdPlaceRanking, results, showRound = false }: BracketMatchCardProps) {
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

  // Get ref display labels
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
      className="cursor-pointer hover:ring-1 hover:ring-[#FFD700]/50 transition-all duration-200 rounded-lg overflow-hidden min-w-[200px] bg-[#0a2a5e] border border-[#1a4a8e]/50 shadow-md"
      onClick={() => onMatchClick(matchId)}
    >
      {/* Header with round + time */}
      <div className="flex items-center justify-between px-2 py-1 bg-[#002868] border-b border-[#1a4a8e]">
        {showRound && (
          <span className="text-[9px] text-[#FFD700] font-bold">{ROUND_NAMES_AR[match.round]}</span>
        )}
        {match.time && (
          <span className="inline-flex items-center gap-0.5 text-white/60 text-[9px]">
            <Clock className="w-2 h-2" />
            {formatTimeAr(match.time)}
          </span>
        )}
        <span className="text-[9px] text-white/40 mr-auto">{match.venueAr}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavoriteMatch(matchId);
          }}
          className="p-0 hover:scale-110 transition-transform"
          title={isFavorite ? 'إزالة من المفضلة' : 'أضف إلى المفضلة'}
        >
          <Star
            className={`w-2.5 h-2.5 ${
              isFavorite
                ? 'fill-[#FFD700] text-[#FFD700]'
                : 'text-white/30 hover:text-[#FFD700]'
            }`}
          />
        </button>
      </div>

      {/* Team 1 */}
      <BracketSlot
        teamName={team1Name || getTeamRefDisplayName(team1Ref)}
        teamKey={team1Resolved || ''}
        isResolved={!!team1Resolved}
        score={result?.homeGoals}
        isWinner={isTeam1Winner}
        refLabel={refLabel1}
        teamRef={team1Ref}
      />

      {/* Divider */}
      <div className="h-px bg-[#1a4a8e]" />

      {/* Team 2 */}
      <BracketSlot
        teamName={team2Name || getTeamRefDisplayName(team2Ref)}
        teamKey={team2Resolved || ''}
        isResolved={!!team2Resolved}
        score={result?.awayGoals}
        isWinner={isTeam2Winner}
        refLabel={refLabel2}
        teamRef={team2Ref}
      />

      {/* Penalties */}
      {result && result.homePenalties !== undefined && result.awayPenalties !== undefined && (
        <div className="px-2 py-0.5 bg-[#002868]/50 border-t border-[#1a4a8e]">
          <span className="text-[8px] text-amber-400">
            ترجيح {result.homePenalties}-{result.awayPenalties}
          </span>
        </div>
      )}
    </div>
  );
}

// Get short reference label for bracket display
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

// Round header component
function RoundHeader({ title, dateRange, color }: { title: string; dateRange: string; color: string }) {
  return (
    <div className="text-center mb-3">
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-l ${color} shadow-sm`}>
        <span className="text-white text-xs font-bold">{title}</span>
        <span className="text-white/60 text-[10px]">{dateRange}</span>
      </div>
    </div>
  );
}

// Connector lines between rounds
function ConnectorDown() {
  return (
    <div className="flex justify-center py-1">
      <div className="flex flex-col items-center">
        <div className="w-px h-4 bg-gradient-to-b from-[#1a4a8e]/50 to-[#1a4a8e]/20" />
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

  // Get matches by round
  const r32Matches = MATCHES.filter(m => m.round === 'r32');
  const r16Matches = MATCHES.filter(m => m.round === 'r16');
  const qfMatches = MATCHES.filter(m => m.round === 'qf');
  const sfMatches = MATCHES.filter(m => m.round === 'sf');
  const thirdPlaceMatches = MATCHES.filter(m => m.round === '3rd');
  const finalMatches = MATCHES.filter(m => m.round === 'final');

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

      {/* Tournament Bracket - Official FIFA Style */}
      <div className="bg-gradient-to-b from-[#001a4a] to-[#0a2a5e] rounded-2xl p-4 md:p-6 shadow-xl border border-[#1a4a8e]/30">
        {/* Trophy icon center top */}
        <div className="flex justify-center mb-4">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-bl from-[#FFD700] to-[#e6c200] flex items-center justify-center shadow-lg">
              <span className="text-2xl">🏆</span>
            </div>
            <h2 className="text-white text-lg font-bold mt-2">الأدوار الإقصائية</h2>
          </div>
        </div>

        {/* Round of 32 */}
        <RoundHeader title="دور الـ 32" dateRange="28 يونيو - 3 يوليو" color="from-[#002868] to-[#1a3f8f]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {r32Matches.map(match => (
            <BracketMatchCard key={match.id} matchId={match.id} {...ctx} />
          ))}
        </div>

        <ConnectorDown />

        {/* Round of 16 */}
        <RoundHeader title="دور الـ 16" dateRange="4 - 7 يوليو" color="from-[#E31837] to-[#c4122d]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {r16Matches.map(match => (
            <BracketMatchCard key={match.id} matchId={match.id} {...ctx} />
          ))}
        </div>

        <ConnectorDown />

        {/* Quarter-finals */}
        <RoundHeader title="ربع النهائي" dateRange="9 - 11 يوليو" color="from-[#FFD700] to-[#e6c200]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 max-w-4xl mx-auto">
          {qfMatches.map(match => (
            <BracketMatchCard key={match.id} matchId={match.id} {...ctx} />
          ))}
        </div>

        <ConnectorDown />

        {/* Semi-finals */}
        <RoundHeader title="نصف النهائي" dateRange="14 - 15 يوليو" color="from-[#00A651] to-[#008f45]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
          {sfMatches.map(match => (
            <BracketMatchCard key={match.id} matchId={match.id} {...ctx} />
          ))}
        </div>

        <ConnectorDown />

        {/* 3rd Place + Final */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {/* 3rd Place */}
          <div>
            <div className="text-center mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-l from-[#8B8000] to-[#6B6300] text-white text-xs font-bold shadow-sm">
                المركز الثالث
                <span className="text-white/60 text-[10px]">18 يوليو</span>
              </span>
            </div>
            {thirdPlaceMatches.map(match => (
              <BracketMatchCard key={match.id} matchId={match.id} {...ctx} />
            ))}
          </div>

          {/* Final */}
          <div>
            <div className="text-center mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-l from-[#FFD700] to-[#FF8C00] text-[#002868] text-xs font-bold shadow-md">
                🏆 النهائي
                <span className="text-[#002868]/70 text-[10px]">19 يوليو</span>
              </span>
            </div>
            {finalMatches.map(match => (
              <BracketMatchCard key={match.id} matchId={match.id} {...ctx} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
