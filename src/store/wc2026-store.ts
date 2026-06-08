// FIFA World Cup 2026 Zustand Store
import { create } from 'zustand';
import { MatchResult } from '@/lib/wc2026-logic';

interface WC2026State {
  results: Record<number, MatchResult>;
  activeTab: string;
  editingMatch: number | null;
  hydrated: boolean;

  // Actions
  setMatchResult: (matchId: number, result: MatchResult) => void;
  clearMatchResult: (matchId: number) => void;
  setActiveTab: (tab: string) => void;
  setEditingMatch: (matchId: number | null) => void;
  resetAllResults: () => void;
  hydrate: () => void;
}

const STORAGE_KEY = 'wc2026-results';

function loadResults(): Record<number, MatchResult> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return {};
}

function saveResults(results: Record<number, MatchResult>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
  } catch {
    // Ignore storage errors
  }
}

export const useWC2026Store = create<WC2026State>((set) => ({
  results: {},
  activeTab: 'matches',
  editingMatch: null,
  hydrated: false,

  setMatchResult: (matchId, result) =>
    set((state) => {
      const newResults = { ...state.results, [matchId]: result };
      saveResults(newResults);
      return { results: newResults, editingMatch: null };
    }),

  clearMatchResult: (matchId) =>
    set((state) => {
      const newResults = { ...state.results };
      delete newResults[matchId];
      saveResults(newResults);
      return { results: newResults };
    }),

  setActiveTab: (tab) => set({ activeTab: tab }),
  setEditingMatch: (matchId) => set({ editingMatch: matchId }),
  resetAllResults: () => {
    saveResults({});
    set({ results: {}, editingMatch: null });
  },
  hydrate: () => {
    const storedResults = loadResults();
    set({ results: storedResults, hydrated: true });
  },
}));
