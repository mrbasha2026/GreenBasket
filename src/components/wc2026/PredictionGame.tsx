'use client';

import { useMemo, useState } from 'react';
import { useWC2026Store } from '@/store/wc2026-store';
import { MATCHES, TEAMS, ROUND_NAMES_AR } from '@/lib/wc2026-data';
import { MatchResult } from '@/lib/wc2026-logic';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TeamFlag } from '@/components/wc2026/TeamFlag';
import { Trophy, Target, TrendingUp, Users, ChevronDown, ChevronUp, Star, Zap } from 'lucide-react';

// Scoring system per round
const SCORING: Record<string, { correctResult: number; exactScore: number }> = {
  'group': { correctResult: 1, exactScore: 3 },
  'r32': { correctResult: 2, exactScore: 5 },
  'r16': { correctResult: 2, exactScore: 5 },
  'qf': { correctResult: 4, exactScore: 8 },
  'sf': { correctResult: 5, exactScore: 10 },
  '3rd': { correctResult: 5, exactScore: 10 },
  'final': { correctResult: 8, exactScore: 15 },
};

// Simulated leaderboard
const SIMULATED_LEADERBOARD = [
  { name: 'محمد العلي', points: 245, exactScores: 32, correctResults: 48 },
  { name: 'أحمد الحربي', points: 218, exactScores: 28, correctResults: 42 },
  { name: 'فاطمة الزهراني', points: 196, exactScores: 25, correctResults: 38 },
  { name: 'عبدالله القحطاني', points: 183, exactScores: 22, correctResults: 36 },
  { name: 'نورة السعيد', points: 167, exactScores: 20, correctResults: 33 },
  { name: 'خالد الشمري', points: 154, exactScores: 18, correctResults: 31 },
  { name: 'سارة الدوسري', points: 142, exactScores: 16, correctResults: 29 },
  { name: 'عمر الغامدي', points: 128, exactScores: 14, correctResults: 27 },
  { name: 'ريم العتيبي', points: 115, exactScores: 12, correctResults: 25 },
  { name: 'يوسف المالكي', points: 98, exactScores: 10, correctResults: 22 },
];

const toArabicDigits = (n: number | string): string => {
  return String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
};

function calculatePoints(
  prediction: MatchResult,
  actual: MatchResult,
  round: string
): { points: number; type: 'exact' | 'result' | 'wrong' } {
  const scoring = SCORING[round] || SCORING['group'];

  // Exact score match
  if (prediction.homeGoals === actual.homeGoals && prediction.awayGoals === actual.awayGoals) {
    return { points: scoring.exactScore, type: 'exact' };
  }

  // Correct result (win/draw/loss)
  const predResult = prediction.homeGoals > prediction.awayGoals ? 'win' :
    prediction.homeGoals < prediction.awayGoals ? 'loss' : 'draw';
  const actualResult = actual.homeGoals > actual.awayGoals ? 'win' :
    actual.homeGoals < actual.awayGoals ? 'loss' : 'draw';

  if (predResult === actualResult) {
    return { points: scoring.correctResult, type: 'result' };
  }

  return { points: 0, type: 'wrong' };
}

export function PredictionGame() {
  const { predictions, results, setPrediction } = useWC2026Store();
  const [expandedRounds, setExpandedRounds] = useState<Set<string>>(new Set(['group']));
  const [editingMatch, setEditingMatch] = useState<number | null>(null);
  const [editHome, setEditHome] = useState<string>('');
  const [editAway, setEditAway] = useState<string>('');

  // Group matches by round
  const matchesByRound = useMemo(() => {
    const grouped: Record<string, typeof MATCHES> = {};
    for (const match of MATCHES) {
      if (!grouped[match.round]) grouped[match.round] = [];
      grouped[match.round].push(match);
    }
    return grouped;
  }, []);

  // Calculate points summary
  const pointsSummary = useMemo(() => {
    let totalPoints = 0;
    let totalExact = 0;
    let totalCorrectResult = 0;
    let totalWrong = 0;
    const byRound: Record<string, { points: number; exact: number; result: number; wrong: number; predicted: number; total: number }> = {};

    for (const [round, matches] of Object.entries(matchesByRound)) {
      byRound[round] = { points: 0, exact: 0, result: 0, wrong: 0, predicted: 0, total: matches.length };
      for (const match of matches) {
        const pred = predictions[match.id];
        const actual = results[match.id];
        if (pred) {
          byRound[round].predicted++;
          if (actual) {
            const calc = calculatePoints(pred, actual, round);
            byRound[round].points += calc.points;
            if (calc.type === 'exact') { byRound[round].exact++; totalExact++; }
            else if (calc.type === 'result') { byRound[round].result++; totalCorrectResult++; }
            else { byRound[round].wrong++; totalWrong++; }
            totalPoints += calc.points;
          }
        }
      }
    }

    return { totalPoints, totalExact, totalCorrectResult, totalWrong, byRound };
  }, [predictions, results, matchesByRound]);

  const totalPredictions = Object.keys(predictions).length;
  const totalMatches = MATCHES.length;

  const toggleRound = (round: string) => {
    setExpandedRounds(prev => {
      const next = new Set(prev);
      if (next.has(round)) next.delete(round);
      else next.add(round);
      return next;
    });
  };

  const startEditing = (matchId: number) => {
    const existing = predictions[matchId];
    setEditHome(existing ? String(existing.homeGoals) : '');
    setEditAway(existing ? String(existing.awayGoals) : '');
    setEditingMatch(matchId);
  };

  const savePrediction = () => {
    if (editingMatch === null) return;
    const home = parseInt(editHome);
    const away = parseInt(editAway);
    if (isNaN(home) || isNaN(away) || home < 0 || away < 0) return;
    setPrediction(editingMatch, { homeGoals: home, awayGoals: away });
    setEditingMatch(null);
    setEditHome('');
    setEditAway('');
  };

  const cancelEditing = () => {
    setEditingMatch(null);
    setEditHome('');
    setEditAway('');
  };

  // Merge user into leaderboard
  const leaderboard = useMemo(() => {
    const userEntry = { name: 'أنت', points: pointsSummary.totalPoints, exactScores: pointsSummary.totalExact, correctResults: pointsSummary.totalCorrectResult, isUser: true as const };
    const all = [...SIMULATED_LEADERBOARD.map(e => ({ ...e, isUser: false as const })), userEntry];
    all.sort((a, b) => b.points - a.points);
    return all;
  }, [pointsSummary]);

  const roundOrder = ['group', 'r32', 'r16', 'qf', 'sf', '3rd', 'final'];

  return (
    <div className="space-y-6">
      {/* Points Summary Card */}
      <Card className="p-6 border-border/50 bg-gradient-to-l from-[#002868]/5 to-[#00A651]/5 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-[#FFD700]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#002868] dark:text-[#FFD700]">نقاطك</h3>
            <p className="text-xs text-muted-foreground">مجموع النقاط المكتسبة</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 rounded-lg bg-[#FFD700]/10 border border-[#FFD700]/20">
            <p className="text-2xl font-extrabold text-[#FFD700]">{toArabicDigits(pointsSummary.totalPoints)}</p>
            <p className="text-xs text-muted-foreground mt-1">مجموع النقاط</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-[#00A651]/10 border border-[#00A651]/20">
            <p className="text-2xl font-extrabold text-[#00A651]">{toArabicDigits(pointsSummary.totalExact)}</p>
            <p className="text-xs text-muted-foreground mt-1">نتيجة دقيقة</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-[#002868]/10 border border-[#002868]/20">
            <p className="text-2xl font-extrabold text-[#002868] dark:text-blue-400">{toArabicDigits(pointsSummary.totalCorrectResult)}</p>
            <p className="text-xs text-muted-foreground mt-1">نتيجة صحيحة</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">تقدم التوقعات</span>
            <span className="font-bold text-[#002868] dark:text-blue-400">
              {toArabicDigits(totalPredictions)} / {toArabicDigits(totalMatches)} مباراة
            </span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-[#00A651] to-[#002868] rounded-full transition-all duration-500"
              style={{ width: `${totalMatches > 0 ? (totalPredictions / totalMatches) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {toArabicDigits(Math.round((totalPredictions / totalMatches) * 100))}% من المباريات
          </p>
        </div>
      </Card>

      {/* Points Breakdown by Stage */}
      <Card className="p-4 border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-[#E31837]" />
          <h3 className="text-sm font-bold text-[#002868] dark:text-blue-400">تفاصيل النقاط حسب الدور</h3>
        </div>
        <div className="space-y-2">
          {roundOrder.map(round => {
            const data = pointsSummary.byRound[round];
            if (!data) return null;
            return (
              <div key={round} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-xs">
                <span className="font-medium">{ROUND_NAMES_AR[round]}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[#FFD700]">🏅 {toArabicDigits(data.exact)}</span>
                  <span className="text-[#00A651]">✓ {toArabicDigits(data.result)}</span>
                  <span className="text-[#E31837]">✗ {toArabicDigits(data.wrong)}</span>
                  <Badge variant="secondary" className="bg-[#002868]/10 text-[#002868] dark:text-blue-400 text-xs">
                    {toArabicDigits(data.points)} نقطة
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Scoring System Info */}
      <Card className="p-4 border-border/50 bg-card/80">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-[#FFD700]" />
          <h3 className="text-sm font-bold text-[#002868] dark:text-blue-400">نظام النقاط</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {roundOrder.map(round => {
            const scoring = SCORING[round];
            return (
              <div key={round} className="flex items-center justify-between p-2 rounded bg-muted/30">
                <span className="font-medium">{ROUND_NAMES_AR[round]}</span>
                <span>
                  <span className="text-[#FFD700]">🏅 {scoring.exactScore}</span>
                  <span className="text-muted-foreground mx-1">|</span>
                  <span className="text-[#00A651]">✓ {scoring.correctResult}</span>
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          🏅 نتيجة دقيقة &nbsp;|&nbsp; ✓ نتيجة صحيحة (فوز/تعادل/خسارة)
        </p>
      </Card>

      {/* Matches by Round - Prediction Entry */}
      <div className="space-y-3">
        {roundOrder.map(round => {
          const matches = matchesByRound[round];
          if (!matches) return null;
          const isExpanded = expandedRounds.has(round);
          const roundData = pointsSummary.byRound[round];

          return (
            <Card key={round} className="overflow-hidden border-border/30">
              <button
                onClick={() => toggleRound(round)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-l from-muted/80 to-muted/40 hover:from-muted hover:to-muted/60 transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#002868] dark:text-blue-400">
                    {ROUND_NAMES_AR[round]}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {toArabicDigits(matches.length)} مباراة
                  </Badge>
                  {roundData && roundData.predicted > 0 && (
                    <Badge className="bg-[#FFD700]/20 text-[#FFD700] text-xs border-[#FFD700]/30">
                      {toArabicDigits(roundData.points)} نقطة
                    </Badge>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {isExpanded && (
                <div className="p-3 space-y-2">
                  {matches.map(match => {
                    const pred = predictions[match.id];
                    const actual = results[match.id];
                    const isEditing = editingMatch === match.id;
                    let pointInfo: { points: number; type: 'exact' | 'result' | 'wrong' } | null = null;

                    if (pred && actual) {
                      pointInfo = calculatePoints(pred, actual, round);
                    }

                    const team1 = TEAMS[match.team1];
                    const team2 = TEAMS[match.team2];

                    return (
                      <div
                        key={match.id}
                        className={`p-3 rounded-lg border transition-all ${
                          pointInfo
                            ? pointInfo.type === 'exact'
                              ? 'border-[#FFD700]/40 bg-[#FFD700]/5'
                              : pointInfo.type === 'result'
                              ? 'border-gray-400/40 bg-gray-100/50 dark:bg-gray-800/30'
                              : 'border-[#E31837]/20 bg-[#E31837]/5'
                            : pred
                            ? 'border-[#00A651]/30 bg-[#00A651]/5'
                            : 'border-border/30 bg-card'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          {/* Teams */}
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <TeamFlag teamName={match.team1} size="sm" />
                            <span className="text-xs font-bold truncate">
                              {team1?.nameAr || match.team1}
                            </span>
                          </div>

                          {/* Prediction / Score area */}
                          <div className="flex items-center gap-2">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  min="0"
                                  max="99"
                                  value={editHome}
                                  onChange={e => setEditHome(e.target.value)}
                                  className="w-12 h-8 text-center text-sm p-0"
                                  placeholder="-"
                                />
                                <span className="text-xs text-muted-foreground">-</span>
                                <Input
                                  type="number"
                                  min="0"
                                  max="99"
                                  value={editAway}
                                  onChange={e => setEditAway(e.target.value)}
                                  className="w-12 h-8 text-center text-sm p-0"
                                  placeholder="-"
                                />
                                <Button size="sm" className="h-8 text-xs bg-[#00A651] hover:bg-[#008f45] ml-1" onClick={savePrediction}>
                                  حفظ
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={cancelEditing}>
                                  إلغاء
                                </Button>
                              </div>
                            ) : pred ? (
                              <div className="flex items-center gap-1 cursor-pointer" onClick={() => startEditing(match.id)}>
                                <span className="text-sm font-bold bg-[#00A651]/10 text-[#00A651] px-2 py-0.5 rounded">
                                  {toArabicDigits(pred.homeGoals)} - {toArabicDigits(pred.awayGoals)}
                                </span>
                                {pointInfo && (
                                  <Badge className={`text-xs ${
                                    pointInfo.type === 'exact'
                                      ? 'bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/30'
                                      : pointInfo.type === 'result'
                                      ? 'bg-gray-400/20 text-gray-500 dark:text-gray-400 border-gray-400/30'
                                      : 'bg-[#E31837]/20 text-[#E31837] border-[#E31837]/30'
                                  }`}>
                                    {toArabicDigits(pointInfo.points)}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs"
                                onClick={() => startEditing(match.id)}
                              >
                                توقع
                              </Button>
                            )}
                          </div>

                          {/* Team 2 */}
                          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                            <span className="text-xs font-bold truncate">
                              {team2?.nameAr || match.team2}
                            </span>
                            <TeamFlag teamName={match.team2} size="sm" />
                          </div>
                        </div>

                        {/* Point indicator legend */}
                        {pointInfo && (
                          <div className="mt-1 text-center">
                            <span className={`text-xs font-medium ${
                              pointInfo.type === 'exact' ? 'text-[#FFD700]' :
                              pointInfo.type === 'result' ? 'text-gray-500 dark:text-gray-400' :
                              'text-[#E31837]'
                            }`}>
                              {pointInfo.type === 'exact' ? '🏅 نتيجة دقيقة!' :
                               pointInfo.type === 'result' ? '✓ نتيجة صحيحة' :
                               '✗ توقع خاطئ'}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Leaderboard */}
      <Card className="p-4 border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-[#002868] dark:text-blue-400" />
          <h3 className="text-sm font-bold text-[#002868] dark:text-blue-400">لوحة المتصدرين</h3>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {leaderboard.map((entry, idx) => (
            <div
              key={entry.name}
              className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                'isUser' in entry && entry.isUser
                  ? 'bg-[#002868]/10 border border-[#002868]/20'
                  : 'bg-muted/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  idx === 0 ? 'bg-[#FFD700] text-[#002868]' :
                  idx === 1 ? 'bg-gray-300 text-gray-700' :
                  idx === 2 ? 'bg-amber-600 text-white' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {toArabicDigits(idx + 1)}
                </span>
                <div>
                  <p className={`text-sm font-bold ${
                    'isUser' in entry && entry.isUser ? 'text-[#002868] dark:text-blue-400' : ''
                  }`}>
                    {entry.name} {'isUser' in entry && entry.isUser && '(أنت)'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    🏅 {toArabicDigits(entry.exactScores)} | ✓ {toArabicDigits(entry.correctResults)}
                  </p>
                </div>
              </div>
              <div className="text-left">
                <p className="text-sm font-extrabold text-[#FFD700]">{toArabicDigits(entry.points)}</p>
                <p className="text-xs text-muted-foreground">نقطة</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
