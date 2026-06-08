import { writable } from 'svelte/store';
import { allMatches } from './data.js';

// Load from localStorage
function loadFromStorage(key, defaultValue) {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

// Scores store: { [matchId]: { home: number, away: number, homePenalty?: number, awayPenalty?: number } }
function createScoresStore() {
  const defaultScores = {};
  allMatches.forEach(m => {
    defaultScores[m.id] = { home: null, away: null, homePenalty: null, awayPenalty: null };
  });

  const stored = loadFromStorage('wc2026-scores', defaultScores);
  const { subscribe, set, update } = writable(stored);

  subscribe(value => {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('wc2026-scores', JSON.stringify(value)); } catch {}
    }
  });

  return {
    subscribe,
    set,
    update,
    setScore: (matchId, home, away, homePenalty = null, awayPenalty = null) => {
      update(scores => ({
        ...scores,
        [matchId]: { home, away, homePenalty, awayPenalty }
      }));
    },
    reset: () => {
      const reset = {};
      allMatches.forEach(m => {
        reset[m.id] = { home: null, away: null, homePenalty: null, awayPenalty: null };
      });
      set(reset);
    }
  };
}

// Favorite teams store
function createFavoritesStore() {
  const stored = loadFromStorage('wc2026-fav-teams', []);
  const { subscribe, set, update } = writable(stored);

  subscribe(value => {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('wc2026-fav-teams', JSON.stringify(value)); } catch {}
    }
  });

  return {
    subscribe,
    toggle: (teamId) => {
      update(favs => {
        if (favs.includes(teamId)) return favs.filter(f => f !== teamId);
        return [...favs, teamId];
      });
    },
    isFavorite: (teamId, favs) => favs.includes(teamId),
  };
}

// Favorite matches store
function createFavMatchesStore() {
  const stored = loadFromStorage('wc2026-fav-matches', []);
  const { subscribe, set, update } = writable(stored);

  subscribe(value => {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('wc2026-fav-matches', JSON.stringify(value)); } catch {}
    }
  });

  return {
    subscribe,
    toggle: (matchId) => {
      update(favs => {
        if (favs.includes(matchId)) return favs.filter(f => f !== matchId);
        return [...favs, matchId];
      });
    },
  };
}

export const scores = createScoresStore();
export const favoriteTeams = createFavoritesStore();
export const favoriteMatches = createFavMatchesStore();
