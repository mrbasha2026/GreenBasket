'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useWC2026Store } from '@/store/wc2026-store';
import { MATCHES, TEAMS, GROUP_NAMES, GROUP_NAMES_AR, ROUND_NAMES_AR } from '@/lib/wc2026-data';
import { calculateGroupStandings, formatDateAr, formatTimeAr, getMatchSaudiDate, formatMatchSaudiDateAr } from '@/lib/wc2026-logic';
import { MatchCard } from '@/components/wc2026/MatchCard';
import { GroupTable } from '@/components/wc2026/GroupTable';
import { KnockoutBracket } from '@/components/wc2026/KnockoutBracket';
import { ScoreDialog } from '@/components/wc2026/ScoreDialog';
import { TeamFlag } from '@/components/wc2026/TeamFlag';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, RotateCcw, ChevronDown, ChevronUp, Search, Star, Heart, Clock, Bell, BellRing } from 'lucide-react';
import { useMatchNotifications } from '@/hooks/useMatchNotifications';

export default function Home() {
  const { results, activeTab, setActiveTab, resetAllResults, hydrate, favoriteTeams, favoriteMatches } = useWC2026Store();
  const { permission, subscribedMatches, subscribedCount, toggleMatchNotification, isMatchSubscribed, requestPermission } = useMatchNotifications();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMatchId, setDialogMatchId] = useState<number | null>(null);

  // Search/filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');
  const [filterRound, setFilterRound] = useState('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'registered' | 'unregistered'>('all');

  // Hydrate from localStorage on mount + register service worker for PWA
  useEffect(() => {
    hydrate();
    // Register service worker for PWA install support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // SW registration failed - not critical
      });
    }
  }, [hydrate]);

  const standings = useMemo(() => calculateGroupStandings(results), [results]);

  // Filter matches based on search and filters
  const filterMatches = useCallback((matches: typeof MATCHES) => {
    return matches.filter(match => {
      // Search by team name
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const team1Ar = TEAMS[match.team1]?.nameAr?.toLowerCase() || '';
        const team1En = match.team1?.toLowerCase() || '';
        const team2Ar = TEAMS[match.team2]?.nameAr?.toLowerCase() || '';
        const team2En = match.team2?.toLowerCase() || '';
        if (
          !team1Ar.includes(query) &&
          !team1En.includes(query) &&
          !team2Ar.includes(query) &&
          !team2En.includes(query)
        ) {
          return false;
        }
      }
      // Filter by group
      if (filterGroup !== 'all') {
        if (match.round === 'group') {
          if (match.group !== filterGroup) return false;
        } else {
          // Knockout matches don't belong to a group
          return false;
        }
      }
      // Filter by round
      if (filterRound !== 'all') {
        if (match.round !== filterRound) return false;
      }
      // Filter by match status (registered/unregistered)
      if (filterStatus === 'registered') {
        if (!results[match.id]) return false;
      } else if (filterStatus === 'unregistered') {
        if (results[match.id]) return false;
      }
      // Filter by favorites
      if (showFavoritesOnly) {
        const isFavMatch = favoriteMatches.has(match.id);
        const involvesFavTeam = favoriteTeams.has(match.team1) || favoriteTeams.has(match.team2);
        if (!isFavMatch && !involvesFavTeam) return false;
      }
      return true;
    });
  }, [searchQuery, filterGroup, filterRound, filterStatus, showFavoritesOnly, favoriteMatches, favoriteTeams, results]);

  // Group matches by Saudi Arabia date (timezone-aware)
  const matchesByDate = useMemo(() => {
    const grouped: Record<string, typeof MATCHES> = {};
    const groupMatches = MATCHES.filter(m => m.round === 'group');
    const filtered = filterMatches(groupMatches);
    for (const match of filtered) {
      // Use Saudi date for grouping so late US matches appear on the correct Saudi day
      const saudiDate = match.time ? getMatchSaudiDate(match.date, match.time, match.venue) : match.date;
      if (!grouped[saudiDate]) grouped[saudiDate] = [];
      grouped[saudiDate].push(match);
    }
    return grouped;
  }, [filterMatches]);

  // Group knockout matches by round
  const knockoutByRound = useMemo(() => {
    const grouped: Record<string, typeof MATCHES> = {};
    const knockoutMatches = MATCHES.filter(m => m.round !== 'group');
    const filtered = filterMatches(knockoutMatches);
    for (const match of filtered) {
      const roundKey = match.round;
      if (!grouped[roundKey]) grouped[roundKey] = [];
      grouped[roundKey].push(match);
    }
    return grouped;
  }, [filterMatches]);

  // Initialize expanded days with first date using lazy init (Saudi dates)
  const [expandedDays, setExpandedDays] = useState<Set<string>>(() => {
    const dates = Object.keys(
      (() => {
        const grouped: Record<string, typeof MATCHES> = {};
        const groupMatches = MATCHES.filter(m => m.round === 'group');
        for (const match of groupMatches) {
          const saudiDate = match.time ? getMatchSaudiDate(match.date, match.time, match.venue) : match.date;
          if (!grouped[saudiDate]) grouped[saudiDate] = [];
          grouped[saudiDate].push(match);
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
          if (slotEligible.includes(tp.group) && !usedGroups.has(tp.group) && tp.points > 0) {
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

  // Favorites tab data
  const favoriteTeamsData = useMemo(() => {
    const teams: { team: string; group: string; position: number; standing: typeof standings[string][0] }[] = [];
    for (const teamName of favoriteTeams) {
      const teamData = TEAMS[teamName];
      if (!teamData) continue;
      const groupStandings = standings[teamData.group];
      if (!groupStandings) continue;
      const idx = groupStandings.findIndex(s => s.team === teamName);
      if (idx >= 0) {
        teams.push({ team: teamName, group: teamData.group, position: idx + 1, standing: groupStandings[idx] });
      }
    }
    return teams;
  }, [favoriteTeams, standings]);

  const favoriteMatchesData = useMemo(() => {
    return MATCHES.filter(m => favoriteMatches.has(m.id));
  }, [favoriteMatches]);

  // Matches involving favorite teams (group + knockout with resolved refs)
  const favoriteTeamMatches = useMemo(() => {
    if (favoriteTeams.size === 0) return [];
    return MATCHES.filter(match => {
      // For group stage, direct team name check
      if (match.round === 'group') {
        return favoriteTeams.has(match.team1) || favoriteTeams.has(match.team2);
      }
      // For knockout, try to resolve team refs
      const team1Resolved = match.team1Ref
        ? (resolveTeamRef(match.team1Ref) || match.team1)
        : match.team1;
      const team2Resolved = match.team2Ref
        ? (resolveTeamRef(match.team2Ref) || match.team2)
        : match.team2;
      return favoriteTeams.has(team1Resolved) || favoriteTeams.has(team2Resolved);
    });
  }, [favoriteTeams, resolveTeamRef]);

  const hasAnyFavorites = favoriteTeams.size > 0 || favoriteMatches.size > 0;

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
          {/* Logo */}
          <div className="flex items-center justify-center mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/wc2026-logo-white.png" alt="كأس العالم 2026" width={260} height={401} className="h-20 md:h-28 w-auto" />
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
            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex-shrink-0 px-5 py-3 text-sm font-bold transition-all border-b-2 ${
                activeTab === 'favorites'
                  ? 'border-[#FFD700] text-[#002868]'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              ⭐ المفضلة
              {(favoriteTeams.size > 0 || favoriteMatches.size > 0) && (
                <span className="mr-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#FFD700] text-[10px] font-bold text-[#002868]">
                  {favoriteTeams.size + favoriteMatches.size}
                </span>
              )}
            </button>

            {/* Reset & Notification buttons */}
            <div className="mr-auto flex items-center gap-2">
              {/* Notification status */}
              {permission === 'granted' && subscribedCount > 0 && (
                <button
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#00A651]/10 text-[#00A651] text-xs font-medium"
                  title={`${subscribedCount} إشعار مفعّل`}
                >
                  <BellRing className="w-3.5 h-3.5" />
                  <span>{subscribedCount}</span>
                </button>
              )}
              {permission !== 'granted' && (
                <button
                  onClick={requestPermission}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 text-muted-foreground text-xs font-medium hover:bg-muted transition-colors"
                  title="تفعيل الإشعارات"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>تفعيل الإشعارات</span>
                </button>
              )}
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
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* MATCHES TAB */}
        {activeTab === 'matches' && (
          <div className="space-y-8">
            {/* Filter Bar */}
            <Card className="p-4 border-border/50 bg-card/80 backdrop-blur-sm !py-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="ابحث عن منتخب..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-8 h-8 text-sm"
                  />
                </div>
                <Select value={filterGroup} onValueChange={setFilterGroup}>
                  <SelectTrigger className="h-8 text-sm w-[130px]">
                    <SelectValue placeholder="المجموعة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المجموعات</SelectItem>
                    {GROUP_NAMES.map(g => (
                      <SelectItem key={g} value={g}>{GROUP_NAMES_AR[g]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterRound} onValueChange={setFilterRound}>
                  <SelectTrigger className="h-8 text-sm w-[140px]">
                    <SelectValue placeholder="الدور" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الأدوار</SelectItem>
                    <SelectItem value="group">دور المجموعات</SelectItem>
                    <SelectItem value="r32">دور الـ 32</SelectItem>
                    <SelectItem value="r16">دور الـ 16</SelectItem>
                    <SelectItem value="qf">ربع النهائي</SelectItem>
                    <SelectItem value="sf">نصف النهائي</SelectItem>
                    <SelectItem value="3rd">المركز الثالث</SelectItem>
                    <SelectItem value="final">النهائي</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as 'all' | 'registered' | 'unregistered')}>
                  <SelectTrigger className="h-8 text-sm w-[130px]">
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المباريات</SelectItem>
                    <SelectItem value="registered">مسجلة النتيجة</SelectItem>
                    <SelectItem value="unregistered">غير مسجلة</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant={showFavoritesOnly ? 'default' : 'outline'}
                  size="sm"
                  className={`h-8 text-xs ${showFavoritesOnly ? 'bg-[#FFD700] text-[#002868] hover:bg-[#e6c200]' : ''}`}
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                >
                  <Star className={`w-3 h-3 ml-1 ${showFavoritesOnly ? 'fill-[#002868]' : ''}`} />
                  المفضلة فقط
                </Button>
              </div>
            </Card>

            {/* Group Stage Section */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1.5 h-7 bg-[#002868] rounded-full" />
                <h2 className="text-xl font-bold text-[#002868]">دور المجموعات</h2>
                <Badge variant="secondary" className="bg-[#002868]/10 text-[#002868]">
                  72 مباراة
                </Badge>
              </div>

              <div className="space-y-4">
                {Object.entries(matchesByDate)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([date, matches]) => {
                    const isExpanded = expandedDays.has(date);
                    return (
                      <div key={date} className="rounded-xl overflow-hidden border border-border/30 shadow-sm">
                        {/* Date header */}
                        <button
                          onClick={() => toggleDay(date)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-l from-muted/80 to-muted/40 hover:from-muted hover:to-muted/60 transition-all"
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
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                            {matches.map(match => (
                              <MatchCard
                                key={match.id}
                                matchId={match.id}
                                onMatchClick={handleMatchClick}
                                isNotifSubscribed={isMatchSubscribed(match.id)}
                                onToggleNotif={toggleMatchNotification}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                {Object.keys(matchesByDate).length === 0 && filterRound !== 'all' && filterRound !== 'group' && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    لا توجد مباريات في دور المجموعات تطابق الفلتر المحدد
                  </div>
                )}
              </div>
            </div>

            {/* Knockout Stage Preview */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1.5 h-7 bg-[#E31837] rounded-full" />
                <h2 className="text-xl font-bold text-[#E31837]">الأدوار الإقصائية</h2>
                <Badge variant="secondary" className="bg-[#E31837]/10 text-[#E31837]">
                  32 مباراة
                </Badge>
              </div>

              <div className="space-y-4">
                {Object.entries(knockoutByRound).map(([round, matches]) => {
                  const roundKey = round as string;
                  return (
                    <div key={roundKey} className="rounded-xl overflow-hidden border border-border/30 shadow-sm">
                      <div className="px-4 py-3 bg-gradient-to-l from-[#E31837]/10 to-[#E31837]/5">
                        <span className="text-sm font-bold text-[#E31837]">
                          {ROUND_NAMES_AR[roundKey]}
                        </span>
                        <Badge variant="outline" className="text-xs mr-2">
                          {matches.length} مباراة
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                        {matches.map(match => (
                          <MatchCard
                            key={match.id}
                            matchId={match.id}
                            onMatchClick={handleMatchClick}
                            isNotifSubscribed={isMatchSubscribed(match.id)}
                            onToggleNotif={toggleMatchNotification}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
                {Object.keys(knockoutByRound).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    لا توجد مباريات إقصائية تطابق الفلتر المحدد
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* GROUPS TAB */}
        {activeTab === 'groups' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-7 bg-[#00A651] rounded-full" />
              <h2 className="text-xl font-bold text-[#002868]">ترتيب المجموعات</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-7 bg-[#E31837] rounded-full" />
              <h2 className="text-xl font-bold text-[#002868]">الأدوار الإقصائية</h2>
              <Trophy className="w-5 h-5 text-[#FFD700]" />
            </div>

            <KnockoutBracket onMatchClick={handleMatchClick} />
          </div>
        )}

        {/* FAVORITES TAB */}
        {activeTab === 'favorites' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-7 bg-[#FFD700] rounded-full" />
              <h2 className="text-xl font-bold text-[#002868]">المفضلة</h2>
              <Star className="w-5 h-5 text-[#FFD700] fill-[#FFD700]" />
            </div>

            {!hasAnyFavorites ? (
              <Card className="p-8 border-dashed border-2 border-border/50 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-[#FFD700]/10 flex items-center justify-center">
                    <Heart className="w-8 h-8 text-[#FFD700]/50" />
                  </div>
                  <h3 className="text-lg font-bold text-muted-foreground">لم تقم بإضافة أي مفضلات بعد</h3>
                  <p className="text-sm text-muted-foreground/70 max-w-md">
                    اضغط على نجمة ⭐ بجانب أي منتخب في جداول المجموعات أو أي مباراة لإضافتها إلى المفضلة
                  </p>
                  <Button
                    variant="outline"
                    className="mt-2 border-[#FFD700] text-[#002868] hover:bg-[#FFD700]/10"
                    onClick={() => setActiveTab('groups')}
                  >
                    تصفح المجموعات
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Favorite Teams Section */}
                {favoriteTeamsData.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1 h-6 bg-[#002868] rounded-full" />
                      <h3 className="text-lg font-bold text-[#002868]">المنتخبات المفضلة</h3>
                      <Badge variant="secondary" className="bg-[#002868]/10 text-[#002868]">
                        {favoriteTeamsData.length} منتخب
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {favoriteTeamsData.map(({ team, group, position, standing }) => {
                        const teamData = TEAMS[team];
                        const isQualified = position <= 2;
                        return (
                          <Card key={team} className="p-4 border-border/50 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-3">
                              <TeamFlag teamName={team} size="lg" />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm truncate">{teamData?.nameAr || team}</h4>
                                <p className="text-xs text-muted-foreground">{GROUP_NAMES_AR[group]} · المركز {position}</p>
                              </div>
                              {isQualified && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#00A651]/10 text-[#00A651] text-xs font-bold">
                                  متأهل
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-5 gap-2 text-center">
                              <div>
                                <p className="text-xs text-muted-foreground">لعب</p>
                                <p className="text-sm font-bold">{standing.played}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">فوز</p>
                                <p className="text-sm font-bold text-[#00A651]">{standing.won}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">تعادل</p>
                                <p className="text-sm font-bold">{standing.drawn}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">خسارة</p>
                                <p className="text-sm font-bold text-[#E31837]">{standing.lost}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">نقاط</p>
                                <p className="text-sm font-bold text-[#002868]">{standing.points}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30 text-xs text-muted-foreground">
                              <span>له: {standing.goalsFor}</span>
                              <span>عليه: {standing.goalsAgainst}</span>
                              <span style={{ color: standing.goalDifference > 0 ? '#00A651' : standing.goalDifference < 0 ? '#E31837' : 'inherit' }}>
                                الفرق: {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                              </span>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Matches of Favorite Teams Section */}
                {favoriteTeamMatches.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1 h-6 bg-[#00A651] rounded-full" />
                      <h3 className="text-lg font-bold text-[#002868]">مباريات الفرق المفضلة</h3>
                      <Badge variant="secondary" className="bg-[#00A651]/10 text-[#00A651]">
                        {favoriteTeamMatches.length} مباراة
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {favoriteTeamMatches.map(match => (
                        <MatchCard
                          key={match.id}
                          matchId={match.id}
                          onMatchClick={handleMatchClick}
                          isNotifSubscribed={isMatchSubscribed(match.id)}
                          onToggleNotif={toggleMatchNotification}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Favorite Matches Section */}
                {favoriteMatchesData.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1 h-6 bg-[#E31837] rounded-full" />
                      <h3 className="text-lg font-bold text-[#002868]">المباريات المفضلة</h3>
                      <Badge variant="secondary" className="bg-[#E31837]/10 text-[#E31837]">
                        {favoriteMatchesData.length} مباراة
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {favoriteMatchesData.map(match => (
                        <MatchCard
                          key={match.id}
                          matchId={match.id}
                          onMatchClick={handleMatchClick}
                          isNotifSubscribed={isMatchSubscribed(match.id)}
                          onToggleNotif={toggleMatchNotification}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-l from-[#002868] to-[#001a4a] mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center">
          <p className="text-white/60 text-xs">
            كأس العالم 2026™ — FIFA World Cup 2026™
          </p>
          <p className="text-[#FFD700]/80 text-xs mt-1 font-semibold">
            جميع الحقوق محفوظة لـ SpeadySoft
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