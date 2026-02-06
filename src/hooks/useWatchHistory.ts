'use client';

/**
 * Watch History Hook
 * 
 * Tracks movies/TV shows the user has viewed (clicked into detail page).
 * Stores per-user in localStorage with genre/tone extraction.
 * Guest users get session-scoped history via guest ID.
 */

import { useState, useEffect, useCallback } from 'react';

// ============================================
// Types
// ============================================

export interface WatchHistoryItem {
  id: number;
  type: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  genreIds: number[];
  voteAverage: number;
  releaseDate: string | null;
  originalLanguage: string;
  viewedAt: number; // timestamp
}

export interface WatchHistoryStats {
  totalViewed: number;
  movieCount: number;
  tvCount: number;
  topGenres: { id: number; count: number }[];
  topLanguages: { code: string; count: number }[];
  averageRating: number;
  recentlyViewed: WatchHistoryItem[];
}

// ============================================
// Constants
// ============================================

const HISTORY_PREFIX = 'bingebuddy-watch-history';
const MAX_HISTORY_ITEMS = 200;
const AUTH_KEY = 'bingebuddy-auth-session';
const GUEST_KEY = 'bingebuddy-guest-session-id';

// ============================================
// Helpers
// ============================================

function getUserIdentifier(): string {
  if (typeof window === 'undefined') return 'unknown';
  
  try {
    const authData = localStorage.getItem(AUTH_KEY);
    if (authData) {
      const session = JSON.parse(authData);
      if (session?.user?.id) return `user-${session.user.id}`;
    }
  } catch {}
  
  // Fall back to guest session
  let guestId = sessionStorage.getItem(GUEST_KEY);
  if (!guestId) {
    guestId = `guest_${crypto.randomUUID()}`;
    sessionStorage.setItem(GUEST_KEY, guestId);
  }
  return `guest-${guestId}`;
}

function getStorageKey(): string {
  return `${HISTORY_PREFIX}-${getUserIdentifier()}`;
}

function loadHistory(): WatchHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getStorageKey());
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveHistory(items: WatchHistoryItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(items.slice(0, MAX_HISTORY_ITEMS)));
  } catch {}
}

// ============================================
// Compute Stats
// ============================================

function computeStats(items: WatchHistoryItem[]): WatchHistoryStats {
  const movieCount = items.filter(i => i.type === 'movie').length;
  const tvCount = items.filter(i => i.type === 'tv').length;
  
  // Genre frequency
  const genreMap = new Map<number, number>();
  for (const item of items) {
    for (const gid of item.genreIds) {
      genreMap.set(gid, (genreMap.get(gid) || 0) + 1);
    }
  }
  const topGenres = Array.from(genreMap.entries())
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // Language frequency
  const langMap = new Map<string, number>();
  for (const item of items) {
    if (item.originalLanguage) {
      langMap.set(item.originalLanguage, (langMap.get(item.originalLanguage) || 0) + 1);
    }
  }
  const topLanguages = Array.from(langMap.entries())
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  // Average rating
  const ratedItems = items.filter(i => i.voteAverage > 0);
  const averageRating = ratedItems.length > 0
    ? ratedItems.reduce((sum, i) => sum + i.voteAverage, 0) / ratedItems.length
    : 0;
  
  return {
    totalViewed: items.length,
    movieCount,
    tvCount,
    topGenres,
    topLanguages,
    averageRating,
    recentlyViewed: items.slice(0, 20),
  };
}

// ============================================
// Hook
// ============================================

export function useWatchHistory() {
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [stats, setStats] = useState<WatchHistoryStats>({
    totalViewed: 0,
    movieCount: 0,
    tvCount: 0,
    topGenres: [],
    topLanguages: [],
    averageRating: 0,
    recentlyViewed: [],
  });
  
  // Load on mount
  useEffect(() => {
    const loaded = loadHistory();
    setHistory(loaded);
    setStats(computeStats(loaded));
  }, []);
  
  // Track a view
  const trackView = useCallback((item: Omit<WatchHistoryItem, 'viewedAt'>) => {
    setHistory(prev => {
      // Remove duplicate if already exists
      const filtered = prev.filter(h => !(h.id === item.id && h.type === item.type));
      const newItem: WatchHistoryItem = { ...item, viewedAt: Date.now() };
      const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      saveHistory(updated);
      setStats(computeStats(updated));
      return updated;
    });
  }, []);
  
  // Check if item has been viewed
  const hasViewed = useCallback((id: number, type: 'movie' | 'tv') => {
    return history.some(h => h.id === id && h.type === type);
  }, [history]);
  
  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
    setStats(computeStats([]));
    if (typeof window !== 'undefined') {
      localStorage.removeItem(getStorageKey());
    }
  }, []);
  
  // Get genre preferences (for chatbot personalization)
  const getGenrePreferences = useCallback((): Record<number, number> => {
    const weights: Record<number, number> = {};
    const now = Date.now();
    const MONTH = 30 * 24 * 60 * 60 * 1000;
    
    for (const item of history) {
      // Recency weighting: recent views count more
      const age = now - item.viewedAt;
      const recencyWeight = age < MONTH ? 1.0 : age < 3 * MONTH ? 0.7 : 0.4;
      
      for (const gid of item.genreIds) {
        weights[gid] = (weights[gid] || 0) + recencyWeight;
      }
    }
    
    // Normalize to 0-1 range
    const max = Math.max(...Object.values(weights), 1);
    for (const key of Object.keys(weights)) {
      weights[Number(key)] /= max;
    }
    
    return weights;
  }, [history]);
  
  return {
    history,
    stats,
    trackView,
    hasViewed,
    clearHistory,
    getGenrePreferences,
  };
}

// ============================================
// Standalone utility for tracking from server components
// ============================================

export function trackMediaView(item: Omit<WatchHistoryItem, 'viewedAt'>): void {
  if (typeof window === 'undefined') return;
  
  const current = loadHistory();
  const filtered = current.filter(h => !(h.id === item.id && h.type === item.type));
  const newItem: WatchHistoryItem = { ...item, viewedAt: Date.now() };
  const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
  saveHistory(updated);
  
  // Dispatch event so any mounted hook picks it up
  window.dispatchEvent(new CustomEvent('bingebuddy-watch-history-updated'));
}
