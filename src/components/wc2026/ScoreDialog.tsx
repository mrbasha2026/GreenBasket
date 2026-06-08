'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWC2026Store } from '@/store/wc2026-store';
import { TEAMS } from '@/lib/wc2026-data';
import { MatchResult } from '@/lib/wc2026-logic';

interface ScoreDialogProps {
  matchId: number | null;
  team1: string;
  team2: string;
  isKnockout: boolean;
  canEnterScore: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function useScoreFormState(matchId: number | null, results: Record<number, MatchResult>) {
  const existing = matchId ? results[matchId] : null;
  return useMemo(() => ({
    homeGoals: existing ? String(existing.homeGoals) : '',
    awayGoals: existing ? String(existing.awayGoals) : '',
    homePenalties: existing?.homePenalties !== undefined ? String(existing.homePenalties) : '',
    awayPenalties: existing?.awayPenalties !== undefined ? String(existing.awayPenalties) : '',
    showPenalties: existing?.homePenalties !== undefined && existing?.awayPenalties !== undefined,
  }), [matchId, existing]);
}

export function ScoreDialog({
  matchId,
  team1,
  team2,
  isKnockout,
  canEnterScore,
  open,
  onOpenChange,
}: ScoreDialogProps) {
  const { results, setMatchResult, clearMatchResult } = useWC2026Store();
  const initialState = useScoreFormState(matchId, results);
  
  const [homeGoals, setHomeGoals] = useState(initialState.homeGoals);
  const [awayGoals, setAwayGoals] = useState(initialState.awayGoals);
  const [homePenalties, setHomePenalties] = useState(initialState.homePenalties);
  const [awayPenalties, setAwayPenalties] = useState(initialState.awayPenalties);
  const [showPenalties, setShowPenalties] = useState(initialState.showPenalties);

  // Reset form when dialog opens with a different match
  const [lastMatchId, setLastMatchId] = useState<number | null>(null);
  if (matchId !== lastMatchId && open) {
    setLastMatchId(matchId);
    const existing = matchId ? results[matchId] : null;
    if (existing) {
      setHomeGoals(String(existing.homeGoals));
      setAwayGoals(String(existing.awayGoals));
      if (existing.homePenalties !== undefined && existing.awayPenalties !== undefined) {
        setShowPenalties(true);
        setHomePenalties(String(existing.homePenalties));
        setAwayPenalties(String(existing.awayPenalties));
      } else {
        setShowPenalties(false);
        setHomePenalties('');
        setAwayPenalties('');
      }
    } else {
      setHomeGoals('');
      setAwayGoals('');
      setHomePenalties('');
      setAwayPenalties('');
      setShowPenalties(false);
    }
  }

  const team1Data = TEAMS[team1];
  const team2Data = TEAMS[team2];

  const handleSave = () => {
    if (!matchId || !canEnterScore) return;
    const hg = parseInt(homeGoals);
    const ag = parseInt(awayGoals);
    if (isNaN(hg) || isNaN(ag)) return;

    const result: MatchResult = { homeGoals: hg, awayGoals: ag };

    if (isKnockout && hg === ag && showPenalties) {
      const hp = parseInt(homePenalties);
      const ap = parseInt(awayPenalties);
      if (!isNaN(hp) && !isNaN(ap) && hp !== ap) {
        result.homePenalties = hp;
        result.awayPenalties = ap;
      }
    }

    setMatchResult(matchId, result);
    onOpenChange(false);
  };

  const handleClear = () => {
    if (!matchId) return;
    clearMatchResult(matchId);
    onOpenChange(false);
  };

  const hg = parseInt(homeGoals) || 0;
  const ag = parseInt(awayGoals) || 0;
  const isDraw = isKnockout && !isNaN(parseInt(homeGoals)) && !isNaN(parseInt(awayGoals)) && hg === ag;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-bold">
            إدخال النتيجة
          </DialogTitle>
        </DialogHeader>

        {!canEnterScore ? (
          <div className="py-6 text-center">
            <p className="text-muted-foreground text-sm">
              المنتخبات المتأهلة لهذه المباراة لم تتحدد بعد
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              يرجى إدخال نتائج المباريات السابقة أولاً
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center gap-4 py-4">
              {/* Team 1 */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <span className="text-3xl">{team1Data?.flag || '⚽'}</span>
                <span className="text-sm font-semibold text-center">
                  {team1Data?.nameAr || team1}
                </span>
              </div>

              {/* Score Inputs */}
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="99"
                  value={homeGoals}
                  onChange={(e) => setHomeGoals(e.target.value)}
                  className="w-16 h-12 text-center text-xl font-bold"
                  placeholder="-"
                />
                <span className="text-2xl font-bold text-muted-foreground">-</span>
                <Input
                  type="number"
                  min="0"
                  max="99"
                  value={awayGoals}
                  onChange={(e) => setAwayGoals(e.target.value)}
                  className="w-16 h-12 text-center text-xl font-bold"
                  placeholder="-"
                />
              </div>

              {/* Team 2 */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <span className="text-3xl">{team2Data?.flag || '⚽'}</span>
                <span className="text-sm font-semibold text-center">
                  {team2Data?.nameAr || team2}
                </span>
              </div>
            </div>

            {/* Penalty shootout for knockout draws */}
            {isDraw && (
              <div className="border-t pt-4 mt-2">
                <p className="text-center text-sm font-semibold text-amber-600 mb-3">
                  تعادل! أدخل نتيجة ركلات الترجيح
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="99"
                    value={homePenalties}
                    onChange={(e) => setHomePenalties(e.target.value)}
                    className="w-14 h-10 text-center text-lg font-bold"
                    placeholder="-"
                  />
                  <span className="text-sm text-muted-foreground">ركلات ترجيح</span>
                  <Input
                    type="number"
                    min="0"
                    max="99"
                    value={awayPenalties}
                    onChange={(e) => setAwayPenalties(e.target.value)}
                    className="w-14 h-10 text-center text-lg font-bold"
                    placeholder="-"
                  />
                </div>
              </div>
            )}

            {/* Show penalties if previously set */}
            {isKnockout && !isDraw && showPenalties && (
              <div className="border-t pt-4 mt-2">
                <p className="text-center text-sm text-muted-foreground mb-2">
                  ركلات الترجيح (مباراة محسوبة كتعادل)
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="99"
                    value={homePenalties}
                    onChange={(e) => setHomePenalties(e.target.value)}
                    className="w-14 h-10 text-center text-lg font-bold"
                    placeholder="-"
                  />
                  <span className="text-sm text-muted-foreground">ترجيح</span>
                  <Input
                    type="number"
                    min="0"
                    max="99"
                    value={awayPenalties}
                    onChange={(e) => setAwayPenalties(e.target.value)}
                    className="w-14 h-10 text-center text-lg font-bold"
                    placeholder="-"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleSave}
                className="flex-1 bg-[#00A651] hover:bg-[#008f45] text-white"
                disabled={!homeGoals && !awayGoals}
              >
                حفظ
              </Button>
              {matchId && results[matchId] && (
                <Button
                  onClick={handleClear}
                  variant="outline"
                  className="text-[#E31837] border-[#E31837] hover:bg-[#E31837]/10"
                >
                  مسح
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
