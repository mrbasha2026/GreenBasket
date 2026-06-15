// FIFA World Cup 2026 Zustand Store
import { create } from 'zustand';
import { MatchResult } from '@/lib/wc2026-logic';

export interface LiveScore {
  homeGoals: number;
  awayGoals: number;
  status: string; // 1H, HT, 2H, ET, BT, P, etc.
  elapsed: number | null; // minute of match
  homePenalties?: number;
  awayPenalties?: number;
}

interface WC2026State {
  results: Record<number, MatchResult>;
  predictions: Record<number, MatchResult>;
  activeTab: string;
  editingMatch: number | null;
  hydrated: boolean;
  favoriteTeams: Set<string>;
  favoriteMatches: Set<number>;

  // Auto-results state
  autoResultsEnabled: boolean;
  lastFetchTime: number | null;
  fetchError: string | null;
  isFetching: boolean;
  liveMatchStatuses: Record<number, string>; // matchId → status (1H, HT, 2H, FT, etc.)
  liveScores: Record<number, LiveScore>; // matchId → current live score

  // Actions
  setMatchResult: (matchId: number, result: MatchResult) => void;
  setAutoResults: (results: Record<number, MatchResult>) => void;
  clearMatchResult: (matchId: number) => void;
  setActiveTab: (tab: string) => void;
  setEditingMatch: (matchId: number | null) => void;
  resetAllResults: () => void;
  hydrate: () => void;
  toggleFavoriteTeam: (teamName: string) => void;
  toggleFavoriteMatch: (matchId: number) => void;
  setPrediction: (matchId: number, result: MatchResult) => void;
  clearPrediction: (matchId: number) => void;
  setAutoResultsEnabled: (enabled: boolean) => void;
  setFetchState: (isFetching: boolean, error: string | null, lastFetchTime: number | null) => void;
  setLiveMatchStatuses: (statuses: Record<number, string>) => void;
  setLiveScores: (scores: Record<number, LiveScore>) => void;
}

const STORAGE_KEY = 'wc2026-results';
const PREDICTIONS_KEY = 'wc2026-predictions';
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

function loadPredictions(): Record<number, MatchResult> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(PREDICTIONS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return {};
}

function savePredictions(predictions: Record<number, MatchResult>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREDICTIONS_KEY, JSON.stringify(predictions));
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

const AUTO_RESULTS_KEY = 'wc2026-auto-results-enabled';

export const useWC2026Store = create<WC2026State>((set) => ({
  results: {},
  predictions: {},
  activeTab: 'matches',
  editingMatch: null,
  hydrated: false,
  favoriteTeams: new Set<string>(),
  favoriteMatches: new Set<number>(),
  autoResultsEnabled: false,
  lastFetchTime: null,
  fetchError: null,
  isFetching: false,
  liveMatchStatuses: {},
  liveScores: {},

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
    const storedPredictions = loadPredictions();
    const storedFavorites = loadFavoriteTeams();
    const storedFavMatches = loadFavoriteMatches();
    const autoResultsEnabled = localStorage.getItem(AUTO_RESULTS_KEY) === 'true';
    set({ results: storedResults, predictions: storedPredictions, favoriteTeams: storedFavorites, favoriteMatches: storedFavMatches, autoResultsEnabled, hydrated: true });
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
  setPrediction: (matchId, result) =>
    set((state) => {
      const newPredictions = { ...state.predictions, [matchId]: result };
      savePredictions(newPredictions);
      return { predictions: newPredictions };
    }),
  clearPrediction: (matchId) =>
    set((state) => {
      const newPredictions = { ...state.predictions };
      delete newPredictions[matchId];
      savePredictions(newPredictions);
      return { predictions: newPredictions };
    }),
  setAutoResults: (autoResults) =>
    set((state) => {
      // Merge auto-results with existing results (auto-results take priority for finished matches)
      const newResults = { ...state.results };
      for (const [matchId, result] of Object.entries(autoResults)) {
        newResults[parseInt(matchId)] = result;
      }
      saveResults(newResults);
      return { results: newResults };
    }),
  setAutoResultsEnabled: (enabled) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTO_RESULTS_KEY, String(enabled));
    }
    set({ autoResultsEnabled: enabled });
  },
  setFetchState: (isFetching, error, lastFetchTime) =>
    set({ isFetching, fetchError: error, ...(lastFetchTime !== null ? { lastFetchTime } : {}) }),
  setLiveMatchStatuses: (statuses) =>
    set({ liveMatchStatuses: statuses }),
  setLiveScores: (scores) =>
    set({ liveScores: scores }),
}));
