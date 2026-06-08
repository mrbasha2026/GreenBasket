// FIFA World Cup 2026 Zustand Store
import { create } from 'zustand';
import { MatchResult } from '@/lib/wc2026-logic';

interface WC2026State {
  results: Record<number, MatchResult>;
  activeTab: string;
  editingMatch: number | null;
  hydrated: boolean;
  favoriteTeams: Set<string>;
  favoriteMatches: Set<number>;

  // Actions
  setMatchResult: (matchId: number, result: MatchResult) => void;
  clearMatchResult: (matchId: number) => void;
  setActiveTab: (tab: string) => void;
  setEditingMatch: (matchId: number | null) => void;
  resetAllResults: () => void;
  hydrate: () => void;
  toggleFavoriteTeam: (teamName: string) => void;
  toggleFavoriteMatch: (matchId: number) => void;
}

const STORAGE_KEY = 'wc2026-results';
const FAVORITES_KEY = 'wc2026-favorites';
const FAV_MATCHES_KEY = 'wc2026-fav-matches';

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

function loadFavoriteTeams(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch {
    // Ignore parse errors
  }
  return new Set();
}

function saveFavoriteTeams(favorites: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
  } catch {
    // Ignore storage errors
  }
}

function loadFavoriteMatches(): Set<number> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem(FAV_MATCHES_KEY);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch {
    // Ignore parse errors
  }
  return new Set();
}

function saveFavoriteMatches(favorites: Set<number>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FAV_MATCHES_KEY, JSON.stringify([...favorites]));
  } catch {
    // Ignore storage errors
  }
}

export const useWC2026Store = create<WC2026State>((set) => ({
  results: {},
  activeTab: 'matches',
  editingMatch: null,
  hydrated: false,
  favoriteTeams: new Set<string>(),
  favoriteMatches: new Set<number>(),

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
    const storedFavorites = loadFavoriteTeams();
    const storedFavMatches = loadFavoriteMatches();
    set({ results: storedResults, favoriteTeams: storedFavorites, favoriteMatches: storedFavMatches, hydrated: true });
  },
  toggleFavoriteTeam: (teamName) =>
    set((state) => {
      const newFavorites = new Set(state.favoriteTeams);
      if (newFavorites.has(teamName)) {
        newFavorites.delete(teamName);
      } else {
        newFavorites.add(teamName);
      }
      saveFavoriteTeams(newFavorites);
      return { favoriteTeams: newFavorites };
    }),
  toggleFavoriteMatch: (matchId) =>
    set((state) => {
      const newFavorites = new Set(state.favoriteMatches);
      if (newFavorites.has(matchId)) {
        newFavorites.delete(matchId);
      } else {
        newFavorites.add(matchId);
      }
      saveFavoriteMatches(newFavorites);
      return { favoriteMatches: newFavorites };
    }),
}));