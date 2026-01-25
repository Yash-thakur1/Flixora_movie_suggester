'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from './AuthProvider';
import { useWatchlistStore, usePreferencesStore, useSearchHistoryStore } from '@/store';

/**
 * Component that handles user session changes and data synchronization
 * - Uses localStorage for persistent authentication across browser sessions
 * - Implements stale-while-revalidate: loads from cache instantly, refreshes in background
 * - Clears all user data and cache on logout
 */
export function WatchlistSyncProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const previousUserId = useRef<string | null | undefined>(undefined);
  
  const watchlistStore = useWatchlistStore();
  const preferencesStore = usePreferencesStore();
  const searchHistoryStore = useSearchHistoryStore();

  useEffect(() => {
    // Wait for session to load
    if (isLoading) return;

    const currentUserId = user?.id || null;

    // Check if user changed
    if (previousUserId.current !== currentUserId) {
      console.log('[Auth] User changed:', previousUserId.current, '->', currentUserId);
      
      if (currentUserId) {
        // User logged in - load from cache first for instant UI, then refresh from server
        console.log('[Auth] Loading user data with SWR strategy');
        
        watchlistStore.setCurrentUser(currentUserId);
        preferencesStore.setCurrentUser(currentUserId);
        
        // Step 1: Load from cache instantly (stale-while-revalidate)
        const watchlistCacheHit = watchlistStore.loadFromCache();
        const preferencesCacheHit = preferencesStore.loadFromCache();
        
        // Step 2: Fetch fresh data from server in background
        if (watchlistCacheHit) {
          console.log('[Auth] Watchlist loaded from cache, revalidating...');
        }
        if (preferencesCacheHit) {
          console.log('[Auth] Preferences loaded from cache, revalidating...');
        }
        
        // Always fetch fresh data to revalidate
        watchlistStore.loadFromServer();
        preferencesStore.loadFromServer();
      } else {
        // User logged out - clear all user data for this session
        console.log('[Auth] Clearing user data on logout');
        
        watchlistStore.clearUserData();
        preferencesStore.clearUserData();
        searchHistoryStore.clearHistory();
      }

      previousUserId.current = currentUserId;
    }
  }, [user?.id, isLoading, isAuthenticated, watchlistStore, preferencesStore, searchHistoryStore]);

  return <>{children}</>;
}
