/**
 * Global Application Store
 * Uses Zustand for lightweight, scalable state management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Movie, UserPreferences, Mood, Era, RatingPreference, DurationPreference } from '@/types/movie';

// ============================================
// Watchlist Store
// ============================================

interface WatchlistState {
  items: Movie[];
  addToWatchlist: (movie: Movie) => void;
  removeFromWatchlist: (movieId: number) => void;
  isInWatchlist: (movieId: number) => boolean;
  clearWatchlist: () => void;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addToWatchlist: (movie) => {
        const exists = get().items.some((m) => m.id === movie.id);
        if (!exists) {
          set((state) => ({ items: [...state.items, movie] }));
        }
      },
      
      removeFromWatchlist: (movieId) => {
        set((state) => ({
          items: state.items.filter((m) => m.id !== movieId),
        }));
      },
      
      isInWatchlist: (movieId) => {
        return get().items.some((m) => m.id === movieId);
      },
      
      clearWatchlist: () => set({ items: [] }),
    }),
    {
      name: 'flixora-watchlist',
    }
  )
);

// ============================================
// User Preferences Store
// ============================================

interface PreferencesState {
  preferences: UserPreferences;
  setGenres: (genres: number[]) => void;
  toggleGenre: (genreId: number) => void;
  setMood: (mood: Mood | null) => void;
  setLanguages: (languages: string[]) => void;
  setEra: (era: Era | null) => void;
  setRatingPreference: (rating: RatingPreference) => void;
  setDurationPreference: (duration: DurationPreference) => void;
  resetPreferences: () => void;
  hasActivePreferences: () => boolean;
}

const defaultPreferences: UserPreferences = {
  genres: [],
  mood: null,
  languages: [],
  era: null,
  ratingPreference: 'any',
  durationPreference: 'any',
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      preferences: defaultPreferences,
      
      setGenres: (genres) => {
        set((state) => ({
          preferences: { ...state.preferences, genres },
        }));
      },
      
      toggleGenre: (genreId) => {
        set((state) => {
          const genres = state.preferences.genres.includes(genreId)
            ? state.preferences.genres.filter((id) => id !== genreId)
            : [...state.preferences.genres, genreId];
          return { preferences: { ...state.preferences, genres } };
        });
      },
      
      setMood: (mood) => {
        set((state) => ({
          preferences: { ...state.preferences, mood },
        }));
      },
      
      setLanguages: (languages) => {
        set((state) => ({
          preferences: { ...state.preferences, languages },
        }));
      },
      
      setEra: (era) => {
        set((state) => ({
          preferences: { ...state.preferences, era },
        }));
      },
      
      setRatingPreference: (ratingPreference) => {
        set((state) => ({
          preferences: { ...state.preferences, ratingPreference },
        }));
      },
      
      setDurationPreference: (durationPreference) => {
        set((state) => ({
          preferences: { ...state.preferences, durationPreference },
        }));
      },
      
      resetPreferences: () => set({ preferences: defaultPreferences }),
      
      hasActivePreferences: () => {
        const { preferences } = get();
        return (
          preferences.genres.length > 0 ||
          preferences.mood !== null ||
          preferences.languages.length > 0 ||
          preferences.era !== null ||
          preferences.ratingPreference !== 'any' ||
          preferences.durationPreference !== 'any'
        );
      },
    }),
    {
      name: 'flixora-preferences',
    }
  )
);

// ============================================
// UI State Store (non-persisted)
// ============================================

interface UIState {
  isSearchOpen: boolean;
  isTrailerModalOpen: boolean;
  currentTrailerKey: string | null;
  currentTrailerTitle: string;
  isMobileMenuOpen: boolean;
  
  openSearch: () => void;
  closeSearch: () => void;
  openTrailerModal: (key: string, title: string) => void;
  closeTrailerModal: () => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSearchOpen: false,
  isTrailerModalOpen: false,
  currentTrailerKey: null,
  currentTrailerTitle: '',
  isMobileMenuOpen: false,
  
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),
  
  openTrailerModal: (key, title) =>
    set({ isTrailerModalOpen: true, currentTrailerKey: key, currentTrailerTitle: title }),
  closeTrailerModal: () =>
    set({ isTrailerModalOpen: false, currentTrailerKey: null, currentTrailerTitle: '' }),
  
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
}));

// ============================================
// Search History Store
// ============================================

interface SearchHistoryState {
  recentSearches: string[];
  addSearch: (query: string) => void;
  removeSearch: (query: string) => void;
  clearHistory: () => void;
}

export const useSearchHistoryStore = create<SearchHistoryState>()(
  persist(
    (set, get) => ({
      recentSearches: [],
      
      addSearch: (query) => {
        const trimmed = query.trim();
        if (!trimmed) return;
        
        set((state) => {
          const filtered = state.recentSearches.filter((s) => s !== trimmed);
          return {
            recentSearches: [trimmed, ...filtered].slice(0, 10), // Keep last 10
          };
        });
      },
      
      removeSearch: (query) => {
        set((state) => ({
          recentSearches: state.recentSearches.filter((s) => s !== query),
        }));
      },
      
      clearHistory: () => set({ recentSearches: [] }),
    }),
    {
      name: 'flixora-search-history',
    }
  )
);
