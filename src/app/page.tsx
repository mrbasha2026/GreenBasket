'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useWC2026Store } from '@/store/wc2026-store';
import { MATCHES, TEAMS, GROUP_NAMES, ROUND_NAMES_AR } from '@/lib/wc2026-data';
import { calculateGroupStandings, formatDateAr } from '@/lib/wc2026-logic';
import { MatchCard } from '@/components/wc2026/MatchCard';
import { GroupTable } from '@/components/wc2026/GroupTable';
import { KnockoutBracket } from '@/components/wc2026/KnockoutBracket';
import { ScoreDialog } from '@/components/wc2026/ScoreDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

export default function Home() {
  const { results, activeTab, setActiveTab, resetAllResults, hydrate } = useWC2026Store();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMatchId, setDialogMatchId] = useState<number | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const standings = useMemo(() => calculateGroupStandings(results), [results]);

  // Group matches by date
  const matchesByDate = useMemo(() => {
    const grouped: Record<string, typeof MATCHES> = {};
    const groupMatches = MATCHES.filter(m => m.round === 'group');
    for (const match of groupMatches) {
      if (!grouped[match.date]) grouped[match.date] = [];
      grouped[match.date].push(match);
    }
    return grouped;
  }, []);

  // Group knockout matches by round
  const knockoutByRound = useMemo(() => {
    const grouped: Record<string, typeof MATCHES> = {};
    const knockoutMatches = MATCHES.filter(m => m.round !== 'group');
    for (const match of knockoutMatches) {
      const roundKey = match.round;
      if (!grouped[roundKey]) grouped[roundKey] = [];
      grouped[roundKey].push(match);
    }
    return grouped;
  }, []);

  // Initialize expanded days with first date using lazy init
  const [expandedDays, setExpandedDays] = useState<Set<string>>(() => {
    const dates = Object.keys(
      (() => {
        const grouped: Record<string, typeof MATCHES> = {};
        const groupMatches = MATCHES.filter(m => m.round === 'group');
        for (const match of groupMatches) {
          if (!grouped[match.date]) grouped[match.date] = [];
          grouped[match.date].push(match);
        }
        return grouped;
      })()
    ).sort();
    return new Set(dates.length > 0 ? [dates[0]] : []);
  });

  const toggleDay = (date: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const handleMatchClick = useCallback((matchId: number) => {
    setDialogMatchId(matchId);
    setDialogOpen(true);
  }, []);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setDialogOpen(open);
    if (!open) setDialogMatchId(null);
  }, []);

  // Get dialog team names - for knockout matches, resolve team refs
  const dialogMatch = dialogMatchId ? MATCHES.find(m => m.id === dialogMatchId) : null;
  const isKnockoutDialog = dialogMatch ? dialogMatch.round !== 'group' : false;

  // Resolve knockout team names from standings/results
  const thirdPlaceRanking = useMemo(() => {
    const ranking: { group: string; team: string; points: number; goalDifference: number; goalsFor: number }[] = [];
    for (const group of GROUP_NAMES) {
      const gs = standings[group];
      if (gs && gs.length >= 3) {
        ranking.push({
          group,
          team: gs[2].team,
          points: gs[2].points,
          goalDifference: gs[2].goalDifference,
          goalsFor: gs[2].goalsFor,
        });
      }
    }
    ranking.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return 0;
    });
    return ranking;
  }, [standings]);

  const resolveTeamRef = useCallback((ref: string): string | null => {
    // Group winner
    const winnerMatch = ref.match(/^1([A-L])$/);
    if (winnerMatch) {
      const group = winnerMatch[1];
      const gs = standings[group];
      if (gs && gs.length > 0 && gs[0].played > 0) return gs[0].team;
      return null;
    }
    // Group runner-up
    const runnerUpMatch = ref.match(/^2([A-L])$/);
    if (runnerUpMatch) {
      const group = runnerUpMatch[1];
      const gs = standings[group];
      if (gs && gs.length > 1 && gs[1].played > 0) return gs[1].team;
      return null;
    }
    // Third place reference
    const thirdPlaceRefMatch = ref.match(/^3(.+)$/);
    if (thirdPlaceRefMatch) {
      const eligibleGroups = { '3ABCDf': ['A','B','C','D','F'], '3CDFGH': ['C','D','F','G','H'], '3CEfHI': ['C','E','F','H','I'], '3EHIJK': ['E','H','I','J','K'], '3BEFIJ': ['B','E','F','I','J'], '3AEHIJ': ['A','E','H','I','J'], '3EFGIJ': ['E','F','G','I','J'], '3DEIJL': ['D','E','I','J','L'] }[ref];
      if (!eligibleGroups) return null;
      const usedGroups = new Set<string>();
      const slots = ['3ABCDf','3CDFGH','3CEfHI','3EHIJK','3BEFIJ','3AEHIJ','3EFGIJ','3DEIJL'];
      for (const slot of slots) {
        const slotEligible = { '3ABCDf': ['A','B','C','D','F'], '3CDFGH': ['C','D','F','G','H'], '3CEfHI': ['C','E','F','H','I'], '3EHIJK': ['E','H','I','J','K'], '3BEFIJ': ['B','E','F','I','J'], '3AEHIJ': ['A','E','H','I','J'], '3EFGIJ': ['E','F','G','I','J'], '3DEIJL': ['D','E','I','J','L'] }[slot] || [];
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
    // Winner of a match
    const winnerOfMatch = ref.match(/^W(\d+)$/);
    if (winnerOfMatch) {
      const matchId = parseInt(winnerOfMatch[1]);
      const r = results[matchId];
      if (!r) return null;
      const m = MATCHES.find(x => x.id === matchId);
      if (!m) return null;
      if (r.homeGoals > r.awayGoals) return m.team1;
      if (r.awayGoals > r.homeGoals) return m.team2;
      if (r.homePenalties !== undefined && r.awayPenalties !== undefined) {
        if (r.homePenalties > r.awayPenalties) return m.team1;
        if (r.awayPenalties > r.homePenalties) return m.team2;
      }
      return null;
    }
    // Loser of a match
    const loserOfMatch = ref.match(/^L(\d+)$/);
    if (loserOfMatch) {
      const matchId = parseInt(loserOfMatch[1]);
      const r = results[matchId];
      if (!r) return null;
      const m = MATCHES.find(x => x.id === matchId);
      if (!m) return null;
      if (r.homeGoals < r.awayGoals) return m.team1;
      if (r.awayGoals < r.homeGoals) return m.team2;
      if (r.homePenalties !== undefined && r.awayPenalties !== undefined) {
        if (r.homePenalties < r.awayPenalties) return m.team1;
        if (r.awayPenalties < r.homePenalties) return m.team2;
      }
      return null;
    }
    return null;
  }, [standings, thirdPlaceRanking, results]);

  // Resolve dialog team names
  const dialogTeam1 = dialogMatch ? (dialogMatch.team1Ref ? (resolveTeamRef(dialogMatch.team1Ref) || dialogMatch.team1) : dialogMatch.team1) : '';
  const dialogTeam2 = dialogMatch ? (dialogMatch.team2Ref ? (resolveTeamRef(dialogMatch.team2Ref) || dialogMatch.team2) : dialogMatch.team2) : '';

  // Check if teams are resolved (actual team names, not refs)
  const isTeam1Resolved = dialogMatch ? (dialogMatch.round === 'group' || TEAMS[dialogTeam1] !== undefined) : false;
  const isTeam2Resolved = dialogMatch ? (dialogMatch.round === 'group' || TEAMS[dialogTeam2] !== undefined) : false;
  // Only allow score entry when both teams are resolved
  const canEnterScore = dialogMatch ? (dialogMatch.round === 'group' || (isTeam1Resolved && isTeam2Resolved)) : false;

  const completedMatches = Object.keys(results).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#002868]/5 via-white to-[#00A651]/5" dir="rtl">
      {/* Hero Header */}
      <header className="relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-gradient-to-bl from-[#002868] via-[#002868]/95 to-[#E31837]/80" />
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="hexagons" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
                <polygon points="24.8,22 37.3,29.2 37.3,43.7 24.8,50.9 12.3,43.7 12.3,29.2" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hexagons)" />
          </svg>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-12 text-center">
          {/* Geometric accent */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 rotate-45 bg-[#FFD700]" />
            <div className="w-6 h-6 rotate-45 bg-[#E31837]" />
            <div className="w-4 h-4 rotate-45 bg-[#00A651]" />
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-2 tracking-tight">
            كأس العالم 2026
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-1 font-medium">
            FIFA World Cup 2026™
          </p>
          <p className="text-sm text-[#FFD700] font-semibold mb-6">
            الولايات المتحدة · المكسيك · كندا
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-4 md:gap-8 flex-wrap">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <p className="text-[#FFD700] text-2xl font-bold">48</p>
              <p className="text-white/70 text-xs">منتخب</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <p className="text-[#FFD700] text-2xl font-bold">12</p>
              <p className="text-white/70 text-xs">مجموعة</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <p className="text-[#FFD700] text-2xl font-bold">104</p>
              <p className="text-white/70 text-xs">مباراة</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <p className="text-[#FFD700] text-2xl font-bold">{completedMatches}</p>
              <p className="text-white/70 text-xs">نتيجة مسجلة</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('matches')}
              className={`flex-shrink-0 px-5 py-3 text-sm font-bold transition-all border-b-2 ${
                activeTab === 'matches'
                  ? 'border-[#002868] text-[#002868]'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              ⚽ المباريات
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`flex-shrink-0 px-5 py-3 text-sm font-bold transition-all border-b-2 ${
                activeTab === 'groups'
                  ? 'border-[#002868] text-[#002868]'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              🏅 المجموعات
            </button>
            <button
              onClick={() => setActiveTab('knockout')}
              className={`flex-shrink-0 px-5 py-3 text-sm font-bold transition-all border-b-2 ${
                activeTab === 'knockout'
                  ? 'border-[#002868] text-[#002868]'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              🏆 الأدوار الإقصائية
            </button>

            {/* Reset button */}
            <div className="mr-auto flex items-center gap-2">
              {completedMatches > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('هل تريد مسح جميع النتائج؟')) {
                      resetAllResults();
                    }
                  }}
                  className="text-xs text-muted-foreground hover:text-[#E31837]"
                >
                  <RotateCcw className="w-3 h-3 ml-1" />
                  مسح الكل
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* MATCHES TAB */}
        {activeTab === 'matches' && (
          <div className="space-y-6">
            {/* Group Stage Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-[#002868] rounded-full" />
                <h2 className="text-xl font-bold text-[#002868]">دور المجموعات</h2>
                <Badge variant="secondary" className="bg-[#002868]/10 text-[#002868]">
                  72 مباراة
                </Badge>
              </div>

              <div className="space-y-3">
                {Object.entries(matchesByDate)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([date, matches]) => {
                    const isExpanded = expandedDays.has(date);
                    return (
                      <div key={date} className="rounded-xl overflow-hidden border border-border/30">
                        {/* Date header */}
                        <button
                          onClick={() => toggleDay(date)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-l from-muted/80 to-muted/40 hover:from-muted hover:to-muted/60 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#002868]">
                              {formatDateAr(date)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {matches.length} مباراة
                            </Badge>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>

                        {/* Matches grid */}
                        {isExpanded && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-3">
                            {matches.map(match => (
                              <MatchCard
                                key={match.id}
                                matchId={match.id}
                                onMatchClick={handleMatchClick}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Knockout Stage Preview */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-[#E31837] rounded-full" />
                <h2 className="text-xl font-bold text-[#E31837]">الأدوار الإقصائية</h2>
                <Badge variant="secondary" className="bg-[#E31837]/10 text-[#E31837]">
                  32 مباراة
                </Badge>
              </div>

              <div className="space-y-3">
                {Object.entries(knockoutByRound).map(([round, matches]) => {
                  const roundKey = round as string;
                  return (
                    <div key={roundKey} className="rounded-xl overflow-hidden border border-border/30">
                      <div className="px-4 py-2.5 bg-gradient-to-l from-[#E31837]/10 to-[#E31837]/5">
                        <span className="text-sm font-bold text-[#E31837]">
                          {ROUND_NAMES_AR[roundKey]}
                        </span>
                        <Badge variant="outline" className="text-xs mr-2">
                          {matches.length} مباراة
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-3">
                        {matches.map(match => (
                          <MatchCard
                            key={match.id}
                            matchId={match.id}
                            onMatchClick={handleMatchClick}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* GROUPS TAB */}
        {activeTab === 'groups' && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-6 bg-[#00A651] rounded-full" />
              <h2 className="text-xl font-bold text-[#002868]">ترتيب المجموعات</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {GROUP_NAMES.map(group => (
                <GroupTable
                  key={group}
                  group={group}
                  standings={standings[group] || []}
                  allStandings={standings}
                />
              ))}
            </div>

            {/* Qualification Info */}
            <div className="mt-6 p-4 bg-gradient-to-l from-[#FFD700]/10 to-[#FFD700]/5 rounded-xl border border-[#FFD700]/20">
              <h3 className="text-sm font-bold text-[#002868] mb-2">نظام التأهل</h3>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>يتأهل أول وثاني كل مجموعة مباشرة إلى دور الـ 32 (24 منتخب)</li>
                <li>يتأهل أفضل 8 منتخبات من أصحاب المركز الثالث إلى دور الـ 32</li>
                <li><span className="inline-block w-2 h-2 rounded-full bg-[#00A651] mr-1" /> متأهل مباشر</li>
                <li><span className="inline-block w-2 h-2 rounded-full bg-[#FFD700] mr-1" /> أفضل ثالث متأهل</li>
                <li><span className="inline-block w-2 h-2 rounded-full bg-[#E31837]/50 mr-1" /> مستبعد</li>
              </ul>
            </div>
          </div>
        )}

        {/* KNOCKOUT TAB */}
        {activeTab === 'knockout' && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-6 bg-[#E31837] rounded-full" />
              <h2 className="text-xl font-bold text-[#002868]">الأدوار الإقصائية</h2>
              <Trophy className="w-5 h-5 text-[#FFD700]" />
            </div>

            <KnockoutBracket onMatchClick={handleMatchClick} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#002868] mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center">
          <p className="text-white/60 text-xs">
            كأس العالم 2026™ — FIFA World Cup 2026™ — جميع الحقوق محفوظة
          </p>
          <p className="text-white/40 text-xs mt-1">
            هذا الموقع غير رسمي ويهدف إلى الترفيه فقط
          </p>
        </div>
      </footer>

      {/* Score Dialog */}
      <ScoreDialog
        matchId={dialogMatchId}
        team1={dialogTeam1}
        team2={dialogTeam2}
        isKnockout={isKnockoutDialog}
        canEnterScore={canEnterScore}
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
      />
    </div>
  );
}
