'use client';

import { useMemo, useState } from 'react';
import { useWC2026Store } from '@/store/wc2026-store';
import { MATCHES, TEAMS, ROUND_NAMES_AR } from '@/lib/wc2026-data';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TeamFlag } from '@/components/wc2026/TeamFlag';
import { ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';

const toArabicDigits = (n: number | string): string => {
  return String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
};

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

  const totalPredictions = Object.keys(predictions).length;
  const totalMatches = MATCHES.length;

  // Calculate correct/wrong prediction counts
  const predictionStats = useMemo(() => {
    let exact = 0;
    let correctResult = 0;
    let wrong = 0;
    let checked = 0; // predictions that have actual results to compare
    for (const match of MATCHES) {
      const pred = predictions[match.id];
      const actual = results[match.id];
      if (pred && actual) {
        checked++;
        if (pred.homeGoals === actual.homeGoals && pred.awayGoals === actual.awayGoals) {
          exact++;
        } else {
          const predResult = pred.homeGoals > pred.awayGoals ? 'win' :
            pred.homeGoals < pred.awayGoals ? 'loss' : 'draw';
          const actualResult = actual.homeGoals > actual.awayGoals ? 'win' :
            actual.homeGoals < actual.awayGoals ? 'loss' : 'draw';
          if (predResult === actualResult) correctResult++;
          else wrong++;
        }
      }
    }
    return { exact, correctResult, wrong, checked };
  }, [predictions, results]);

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

  // Count predictions per round
  const predictedByRound = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const match of MATCHES) {
      if (!counts[match.round]) counts[match.round] = 0;
      if (predictions[match.id]) counts[match.round]++;
    }
    return counts;
  }, [predictions]);

  const roundOrder = ['group', 'r32', 'r16', 'qf', 'sf', '3rd', 'final'];

  return (
    <div className="space-y-6">
      {/* Progress Summary Card */}
      <Card className="p-6 border-border/50 bg-gradient-to-l from-[#002868]/5 to-[#00A651]/5 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-[#FFD700]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#002868] dark:text-[#FFD700]">توقعاتك</h3>
            <p className="text-xs text-muted-foreground">تقدم التوقعات للمباريات</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="text-center p-3 rounded-lg bg-[#00A651]/10 border border-[#00A651]/20">
            <p className="text-2xl font-extrabold text-[#00A651]">{toArabicDigits(totalPredictions)}</p>
            <p className="text-xs text-muted-foreground mt-1">مباراة متوقعة</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-[#002868]/10 border border-[#002868]/20">
            <p className="text-2xl font-extrabold text-[#002868] dark:text-blue-400">{toArabicDigits(totalMatches - totalPredictions)}</p>
            <p className="text-xs text-muted-foreground mt-1">مباراة متبقية</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-[#FFD700]/10 border border-[#FFD700]/20">
            <p className="text-2xl font-extrabold text-[#FFD700]">{toArabicDigits(predictionStats.exact + predictionStats.correctResult)}</p>
            <p className="text-xs text-muted-foreground mt-1">توقع صحيح</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-[#E31837]/10 border border-[#E31837]/20">
            <p className="text-2xl font-extrabold text-[#E31837]">{toArabicDigits(predictionStats.wrong)}</p>
            <p className="text-xs text-muted-foreground mt-1">توقع خاطئ</p>
          </div>
        </div>

        {/* Accuracy indicator */}
        {predictionStats.checked > 0 && (
          <div className="p-3 rounded-lg bg-muted/30 border border-border/30 mb-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-muted-foreground font-medium">دقة التوقعات</span>
              <span className="font-bold text-[#FFD700]">
                {toArabicDigits(Math.round(((predictionStats.exact + predictionStats.correctResult) / predictionStats.checked) * 100))}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden flex">
              <div
                className="h-full bg-[#FFD700] rounded-r-full transition-all duration-500"
                style={{ width: `${predictionStats.checked > 0 ? (predictionStats.exact / predictionStats.checked) * 100 : 0}%` }}
              />
              <div
                className="h-full bg-[#00A651] transition-all duration-500"
                style={{ width: `${predictionStats.checked > 0 ? (predictionStats.correctResult / predictionStats.checked) * 100 : 0}%` }}
              />
              <div
                className="h-full bg-[#E31837] rounded-l-full transition-all duration-500"
                style={{ width: `${predictionStats.checked > 0 ? (predictionStats.wrong / predictionStats.checked) * 100 : 0}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FFD700]" /> دقيقة {toArabicDigits(predictionStats.exact)}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#00A651]" /> صحيحة {toArabicDigits(predictionStats.correctResult)}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#E31837]" /> خاطئة {toArabicDigits(predictionStats.wrong)}</span>
            </div>
          </div>
        )}

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

      {/* Matches by Round - Prediction Entry */}
      <div className="space-y-3">
        {roundOrder.map(round => {
          const matches = matchesByRound[round];
          if (!matches) return null;
          const isExpanded = expandedRounds.has(round);
          const predicted = predictedByRound[round] || 0;

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
                  {predicted > 0 && (
                    <Badge className="bg-[#00A651]/20 text-[#00A651] text-xs border-[#00A651]/30">
                      {toArabicDigits(predicted)} توقع
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

                    const team1 = TEAMS[match.team1];
                    const team2 = TEAMS[match.team2];

                    // Check if prediction matches result
                    let matchStatus: 'exact' | 'result' | 'wrong' | null = null;
                    if (pred && actual) {
                      if (pred.homeGoals === actual.homeGoals && pred.awayGoals === actual.awayGoals) {
                        matchStatus = 'exact';
                      } else {
                        const predResult = pred.homeGoals > pred.awayGoals ? 'win' :
                          pred.homeGoals < pred.awayGoals ? 'loss' : 'draw';
                        const actualResult = actual.homeGoals > actual.awayGoals ? 'win' :
                          actual.homeGoals < actual.awayGoals ? 'loss' : 'draw';
                        matchStatus = predResult === actualResult ? 'result' : 'wrong';
                      }
                    }

                    return (
                      <div
                        key={match.id}
                        className={`p-3 rounded-lg border transition-all ${
                          matchStatus === 'exact'
                            ? 'border-[#FFD700]/40 bg-[#FFD700]/5'
                            : matchStatus === 'result'
                            ? 'border-[#00A651]/30 bg-[#00A651]/5'
                            : matchStatus === 'wrong'
                            ? 'border-[#E31837]/20 bg-[#E31837]/5'
                            : pred
                            ? 'border-[#002868]/20 bg-[#002868]/5'
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
                                <span className={`text-sm font-bold px-2 py-0.5 rounded ${
                                  matchStatus === 'exact' ? 'bg-[#FFD700]/10 text-[#FFD700]' :
                                  matchStatus === 'result' ? 'bg-[#00A651]/10 text-[#00A651]' :
                                  matchStatus === 'wrong' ? 'bg-[#E31837]/10 text-[#E31837]' :
                                  'bg-[#002868]/10 text-[#002868] dark:text-blue-400'
                                }`}>
                                  {toArabicDigits(pred.homeGoals)} - {toArabicDigits(pred.awayGoals)}
                                </span>
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

                        {/* Match result indicator */}
                        {matchStatus && (
                          <div className="mt-1 text-center">
                            <span className={`text-xs font-medium ${
                              matchStatus === 'exact' ? 'text-[#FFD700]' :
                              matchStatus === 'result' ? 'text-[#00A651]' :
                              'text-[#E31837]'
                            }`}>
                              {matchStatus === 'exact' ? 'نتيجة دقيقة!' :
                               matchStatus === 'result' ? 'نتيجة صحيحة' :
                               'توقع خاطئ'}
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

    </div>
  );
}
