/**
 * Smart Prefetch System
 * 
 * Intelligently prefetches data based on:
 * - Viewport visibility (intersection observer)
 * - Hover intent (with delay to avoid false positives)
 * - Scroll direction and velocity
 * - User interaction patterns
 * - Network conditions
 */

import { useNetworkStore } from './network';

// ============================================
// Prefetch Configuration
// ============================================

export interface PrefetchConfig {
  // Timing
  hoverDelay: number;           // ms before prefetch on hover
  viewportMargin: string;       // Intersection observer margin
  
  // Limits
  maxConcurrent: number;        // Max concurrent prefetches
  maxQueueSize: number;         // Max items in prefetch queue
  
  // Network adaptations
  disableOnSlowNetwork: boolean;
  reducedPrefetchOnSlow: boolean;
}

const defaultConfig: PrefetchConfig = {
  hoverDelay: 100,
  viewportMargin: '200px',
  maxConcurrent: 3,
  maxQueueSize: 20,
  disableOnSlowNetwork: true,
  reducedPrefetchOnSlow: true,
};

let config: PrefetchConfig = { ...defaultConfig };

export function configurePrefetch(newConfig: Partial<PrefetchConfig>): void {
  config = { ...config, ...newConfig };
}

// ============================================
// Prefetch Queue Management
// ============================================

type PrefetchPriority = 'immediate' | 'high' | 'normal' | 'low';

interface PrefetchItem {
  id: number | string;
  type: 'movie' | 'tvshow' | 'list' | 'search';
  priority: PrefetchPriority;
  timestamp: number;
}

const prefetchQueue: PrefetchItem[] = [];
const prefetchInProgress = new Set<string>();
const prefetchComplete = new Set<string>();

/**
 * Get unique key for prefetch item
 */
function getPrefetchKey(item: PrefetchItem): string {
  return `${item.type}:${item.id}`;
}

/**
 * Check if prefetching is allowed based on network
 */
function canPrefetch(): boolean {
  const { isOffline, isSlowConnection } = useNetworkStore.getState();
  
  if (isOffline) return false;
  if (isSlowConnection && config.disableOnSlowNetwork) return false;
  
  return true;
}

/**
 * Add item to prefetch queue
 */
export function queuePrefetch(
  id: number | string,
  type: 'movie' | 'tvshow' | 'list' | 'search',
  priority: PrefetchPriority = 'normal'
): void {
  if (!canPrefetch()) return;
  
  const key = `${type}:${id}`;
  
  // Skip if already done or in progress
  if (prefetchComplete.has(key) || prefetchInProgress.has(key)) return;
  
  // Check if already in queue
  const existingIndex = prefetchQueue.findIndex(
    (item) => item.id === id && item.type === type
  );
  
  if (existingIndex !== -1) {
    // Update priority if higher
    const existing = prefetchQueue[existingIndex];
    const priorities: PrefetchPriority[] = ['low', 'normal', 'high', 'immediate'];
    if (priorities.indexOf(priority) > priorities.indexOf(existing.priority)) {
      existing.priority = priority;
      // Re-sort queue
      sortPrefetchQueue();
    }
    return;
  }
  
  // Add to queue
  prefetchQueue.push({
    id,
    type,
    priority,
    timestamp: Date.now(),
  });
  
  // Limit queue size
  if (prefetchQueue.length > config.maxQueueSize) {
    prefetchQueue.splice(config.maxQueueSize);
  }
  
  sortPrefetchQueue();
  processPrefetchQueue();
}

/**
 * Sort queue by priority and age
 */
function sortPrefetchQueue(): void {
  const priorityOrder: PrefetchPriority[] = ['immediate', 'high', 'normal', 'low'];
  
  prefetchQueue.sort((a, b) => {
    const priorityDiff = priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
    if (priorityDiff !== 0) return priorityDiff;
    return a.timestamp - b.timestamp;
  });
}

/**
 * Process the prefetch queue
 */
async function processPrefetchQueue(): Promise<void> {
  while (
    prefetchQueue.length > 0 &&
    prefetchInProgress.size < config.maxConcurrent &&
    canPrefetch()
  ) {
    const item = prefetchQueue.shift();
    if (!item) break;
    
    const key = getPrefetchKey(item);
    if (prefetchComplete.has(key) || prefetchInProgress.has(key)) continue;
    
    prefetchInProgress.add(key);
    
    // Execute prefetch (non-blocking)
    executePrefetch(item)
      .catch((error) => {
        console.warn(`[Prefetch] Failed for ${key}:`, error);
      })
      .finally(() => {
        prefetchInProgress.delete(key);
        prefetchComplete.add(key);
        processPrefetchQueue(); // Continue processing
      });
  }
}

/**
 * Execute a single prefetch
 */
async function executePrefetch(item: PrefetchItem): Promise<void> {
  const { isSlowConnection } = useNetworkStore.getState();
  
  switch (item.type) {
    case 'movie':
      const { prefetchMovieEssentials, prefetchMovieFull } = await import('./movieCache');
      if (isSlowConnection && config.reducedPrefetchOnSlow) {
        // Only fetch essentials on slow networks
        await prefetchMovieEssentials(item.id as number);
      } else {
        await prefetchMovieFull(item.id as number);
      }
      break;
      
    case 'tvshow':
      // TODO: Implement TV show prefetch
      break;
      
    case 'list':
      // Pre-cache list data
      break;
      
    case 'search':
      // Pre-cache search results
      break;
  }
}

// ============================================
// Viewport-based Prefetching
// ============================================

const viewportObservers = new Map<HTMLElement, IntersectionObserver>();

/**
 * Setup viewport prefetching for a container
 */
export function setupViewportPrefetch(
  container: HTMLElement,
  getMovieIds: () => number[]
): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const movieIds = getMovieIds();
          movieIds.forEach((id) => queuePrefetch(id, 'movie', 'normal'));
        }
      });
    },
    {
      rootMargin: config.viewportMargin,
      threshold: 0,
    }
  );
  
  observer.observe(container);
  viewportObservers.set(container, observer);
  
  return () => {
    observer.disconnect();
    viewportObservers.delete(container);
  };
}

// ============================================
// Hover Intent Prefetching
// ============================================

const hoverTimeouts = new Map<string, NodeJS.Timeout>();

/**
 * Handle hover start - queue prefetch with delay
 */
export function onHoverStart(id: number, type: 'movie' | 'tvshow' = 'movie'): void {
  const key = `${type}:${id}`;
  
  // Clear any existing timeout
  const existing = hoverTimeouts.get(key);
  if (existing) clearTimeout(existing);
  
  // Set new timeout
  const timeout = setTimeout(() => {
    queuePrefetch(id, type, 'high');
    hoverTimeouts.delete(key);
  }, config.hoverDelay);
  
  hoverTimeouts.set(key, timeout);
}

/**
 * Handle hover end - cancel if prefetch hasn't started
 */
export function onHoverEnd(id: number, type: 'movie' | 'tvshow' = 'movie'): void {
  const key = `${type}:${id}`;
  const timeout = hoverTimeouts.get(key);
  
  if (timeout) {
    clearTimeout(timeout);
    hoverTimeouts.delete(key);
  }
}

// ============================================
// Scroll Direction Detection
// ============================================

let lastScrollY = 0;
let scrollDirection: 'up' | 'down' = 'down';
let scrollVelocity = 0;

/**
 * Initialize scroll tracking
 */
export function initScrollTracking(): () => void {
  if (typeof window === 'undefined') return () => {};
  
  let lastTime = Date.now();
  
  const handleScroll = () => {
    const currentY = window.scrollY;
    const currentTime = Date.now();
    const timeDelta = currentTime - lastTime;
    
    if (timeDelta > 0) {
      scrollVelocity = Math.abs(currentY - lastScrollY) / timeDelta;
    }
    
    scrollDirection = currentY > lastScrollY ? 'down' : 'up';
    lastScrollY = currentY;
    lastTime = currentTime;
  };
  
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
}

/**
 * Get current scroll state
 */
export function getScrollState(): {
  direction: 'up' | 'down';
  velocity: number;
  position: number;
} {
  return {
    direction: scrollDirection,
    velocity: scrollVelocity,
    position: lastScrollY,
  };
}

// ============================================
// Predictive Prefetching
// ============================================

const clickHistory: { type: string; id: number; timestamp: number }[] = [];

/**
 * Record a user click for pattern learning
 */
export function recordClick(type: string, id: number): void {
  clickHistory.push({ type, id, timestamp: Date.now() });
  
  // Keep last 100 clicks
  if (clickHistory.length > 100) {
    clickHistory.shift();
  }
}

/**
 * Get predicted next items based on history
 */
export function getPredictedItems(): { type: string; id: number }[] {
  // Simple frequency-based prediction
  const counts = new Map<string, { count: number; type: string; id: number }>();
  
  clickHistory.forEach(({ type, id }) => {
    const key = `${type}:${id}`;
    const existing = counts.get(key);
    if (existing) {
      existing.count++;
    } else {
      counts.set(key, { count: 1, type, id });
    }
  });
  
  // Return top 5 most clicked
  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(({ type, id }) => ({ type, id }));
}

// ============================================
// Cleanup
// ============================================

/**
 * Clear all prefetch state
 */
export function clearPrefetchState(): void {
  prefetchQueue.length = 0;
  prefetchComplete.clear();
  
  hoverTimeouts.forEach((timeout) => clearTimeout(timeout));
  hoverTimeouts.clear();
  
  viewportObservers.forEach((observer) => observer.disconnect());
  viewportObservers.clear();
}
