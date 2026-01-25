/**
 * Optimistic Navigation System
 * 
 * Provides instant page transitions by:
 * - Pre-rendering skeleton layouts immediately
 * - Loading data progressively in background
 * - Using cached data when available
 * - Transitioning smoothly between states
 */

import { create } from 'zustand';

// ============================================
// Navigation State Management
// ============================================

export type NavigationState = 'idle' | 'navigating' | 'loading-data' | 'complete';

interface NavigationStore {
  state: NavigationState;
  targetRoute: string | null;
  targetId: number | null;
  skeletonType: 'movie' | 'list' | 'search' | null;
  progress: number; // 0-100 for progress indicator
  
  // Actions
  startNavigation: (route: string, id?: number, type?: 'movie' | 'list' | 'search') => void;
  setProgress: (progress: number) => void;
  completeNavigation: () => void;
  resetNavigation: () => void;
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  state: 'idle',
  targetRoute: null,
  targetId: null,
  skeletonType: null,
  progress: 0,
  
  startNavigation: (route, id, type = 'list') => set({
    state: 'navigating',
    targetRoute: route,
    targetId: id ?? null,
    skeletonType: type,
    progress: 10,
  }),
  
  setProgress: (progress) => set({ progress }),
  
  completeNavigation: () => set({
    state: 'complete',
    progress: 100,
  }),
  
  resetNavigation: () => set({
    state: 'idle',
    targetRoute: null,
    targetId: null,
    skeletonType: null,
    progress: 0,
  }),
}));

// ============================================
// Route Prefetching
// ============================================

const prefetchedRoutes = new Set<string>();
const routeDataCache = new Map<string, { data: unknown; timestamp: number }>();

/**
 * Prefetch a route's data ahead of time
 */
export async function prefetchRoute(route: string): Promise<void> {
  if (prefetchedRoutes.has(route)) return;
  prefetchedRoutes.add(route);
  
  // Extract movie ID from route
  const movieMatch = route.match(/\/movie\/(\d+)/);
  if (movieMatch) {
    const movieId = parseInt(movieMatch[1], 10);
    const { prefetchMovieEssentials } = await import('./movieCache');
    await prefetchMovieEssentials(movieId);
  }
  
  // Handle other route patterns as needed
}

/**
 * Get cached route data
 */
export function getRouteData<T>(route: string): T | null {
  const cached = routeDataCache.get(route);
  if (!cached) return null;
  
  // Check if stale (5 minutes)
  if (Date.now() - cached.timestamp > 5 * 60 * 1000) {
    routeDataCache.delete(route);
    return null;
  }
  
  return cached.data as T;
}

/**
 * Cache route data
 */
export function cacheRouteData(route: string, data: unknown): void {
  routeDataCache.set(route, { data, timestamp: Date.now() });
}

// ============================================
// Progress Simulation
// ============================================

let progressInterval: NodeJS.Timeout | null = null;

/**
 * Start simulated progress for perceived performance
 */
export function startProgressSimulation(): void {
  const store = useNavigationStore.getState();
  
  if (progressInterval) {
    clearInterval(progressInterval);
  }
  
  let progress = 10;
  progressInterval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress >= 90) {
      progress = 90; // Cap at 90% until complete
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
    }
    store.setProgress(progress);
  }, 100);
}

/**
 * Complete progress and cleanup
 */
export function completeProgress(): void {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
  
  const store = useNavigationStore.getState();
  store.setProgress(100);
  
  setTimeout(() => {
    store.resetNavigation();
  }, 300);
}

// ============================================
// Link Prefetch on Hover
// ============================================

let hoverTimeout: NodeJS.Timeout | null = null;

/**
 * Handle link hover for prefetching
 */
export function handleLinkHover(href: string): void {
  if (hoverTimeout) {
    clearTimeout(hoverTimeout);
  }
  
  hoverTimeout = setTimeout(() => {
    prefetchRoute(href);
  }, 100);
}

/**
 * Cancel pending hover prefetch
 */
export function cancelLinkHover(): void {
  if (hoverTimeout) {
    clearTimeout(hoverTimeout);
    hoverTimeout = null;
  }
}
