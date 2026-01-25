/**
 * Priority-Based Data Fetching System
 * 
 * Fetches data based on priority levels:
 * - Critical: Primary content (movie details, title, poster)
 * - High: Essential secondary content (overview, rating)
 * - Medium: Supporting content (cast top 5)
 * - Low: Deferred content (full cast, crew)
 * - Background: Optional content (similar, recommendations)
 */

import { deduplicatedFetch, queueRequest, type RequestPriority } from './requestManager';
import { cacheGet, cacheSet, type CacheTTL } from './multiLayerCache';
import { useNetworkStore } from './network';

// ============================================
// Priority Configuration
// ============================================

export type DataPriority = 'critical' | 'high' | 'medium' | 'low' | 'background';

interface PriorityConfig {
  requestPriority: RequestPriority;
  cacheTTL: CacheTTL;
  retries: number;
  timeout: number;
  defer: boolean; // Defer until after initial render
}

const priorityConfigs: Record<DataPriority, PriorityConfig> = {
  critical: {
    requestPriority: 'critical',
    cacheTTL: 'medium',
    retries: 3,
    timeout: 5000,
    defer: false,
  },
  high: {
    requestPriority: 'high',
    cacheTTL: 'medium',
    retries: 2,
    timeout: 5000,
    defer: false,
  },
  medium: {
    requestPriority: 'medium',
    cacheTTL: 'long',
    retries: 2,
    timeout: 8000,
    defer: true,
  },
  low: {
    requestPriority: 'low',
    cacheTTL: 'long',
    retries: 1,
    timeout: 10000,
    defer: true,
  },
  background: {
    requestPriority: 'background',
    cacheTTL: 'short',
    retries: 1,
    timeout: 15000,
    defer: true,
  },
};

// ============================================
// Fetch with Priority
// ============================================

export interface PriorityFetchOptions<T> {
  cacheKey: string;
  fetchFn: () => Promise<T>;
  priority: DataPriority;
  skipCache?: boolean;
  onProgress?: (progress: number) => void;
}

/**
 * Fetch data with priority and caching
 */
export async function priorityFetch<T>({
  cacheKey,
  fetchFn,
  priority,
  skipCache = false,
  onProgress,
}: PriorityFetchOptions<T>): Promise<T> {
  const config = priorityConfigs[priority];
  
  // Check cache first (unless skipped)
  if (!skipCache) {
    const cached = await cacheGet<T>(cacheKey, { ttl: config.cacheTTL });
    if (cached !== null) {
      onProgress?.(100);
      return cached;
    }
  }
  
  onProgress?.(10);
  
  // Queue the request with appropriate priority
  const result = await queueRequest<T>(
    cacheKey,
    async (signal) => {
      // Add timeout
      const timeoutId = setTimeout(() => {
        throw new Error(`Request timeout for ${cacheKey}`);
      }, config.timeout);
      
      try {
        const data = await fetchFn();
        onProgress?.(90);
        return data;
      } finally {
        clearTimeout(timeoutId);
      }
    },
    config.requestPriority
  );
  
  // Cache the result
  await cacheSet(cacheKey, result, { ttl: config.cacheTTL });
  onProgress?.(100);
  
  return result;
}

// ============================================
// Phased Data Loading
// ============================================

export interface PhaseConfig<T> {
  name: string;
  priority: DataPriority;
  cacheKey: string;
  fetchFn: () => Promise<T>;
  required?: boolean; // If true, failure stops loading
}

export interface PhasedLoadResult<T> {
  data: Partial<T>;
  loaded: Set<string>;
  failed: Set<string>;
  isComplete: boolean;
}

/**
 * Load data in phases based on priority
 */
export async function loadInPhases<T extends Record<string, unknown>>(
  phases: PhaseConfig<unknown>[],
  onPhaseComplete?: (phaseName: string, data: unknown) => void
): Promise<PhasedLoadResult<T>> {
  // Sort by priority
  const priorityOrder: DataPriority[] = ['critical', 'high', 'medium', 'low', 'background'];
  const sortedPhases = [...phases].sort((a, b) => {
    return priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
  });
  
  const result: PhasedLoadResult<T> = {
    data: {} as Partial<T>,
    loaded: new Set(),
    failed: new Set(),
    isComplete: false,
  };
  
  // Group by priority for parallel execution within same priority
  const groupedPhases = new Map<DataPriority, PhaseConfig<unknown>[]>();
  sortedPhases.forEach((phase) => {
    const group = groupedPhases.get(phase.priority) || [];
    group.push(phase);
    groupedPhases.set(phase.priority, group);
  });
  
  // Execute each priority group in order
  for (const priority of priorityOrder) {
    const group = groupedPhases.get(priority);
    if (!group) continue;
    
    // Execute this priority group in parallel
    const groupResults = await Promise.allSettled(
      group.map(async (phase) => {
        try {
          const data = await priorityFetch({
            cacheKey: phase.cacheKey,
            fetchFn: phase.fetchFn,
            priority: phase.priority,
          });
          
          (result.data as Record<string, unknown>)[phase.name] = data;
          result.loaded.add(phase.name);
          onPhaseComplete?.(phase.name, data);
          
          return { name: phase.name, success: true, data };
        } catch (error) {
          result.failed.add(phase.name);
          
          if (phase.required) {
            throw new Error(`Required phase ${phase.name} failed: ${error}`);
          }
          
          return { name: phase.name, success: false, error };
        }
      })
    );
    
    // Check for required phase failures
    const hasRequiredFailure = groupResults.some(
      (r, i) => r.status === 'rejected' && group[i].required
    );
    
    if (hasRequiredFailure) {
      break;
    }
  }
  
  result.isComplete = result.loaded.size === phases.length;
  return result;
}

// ============================================
// Movie Data Loading Phases
// ============================================

export interface MovieDataPhases {
  details: unknown;
  credits: unknown;
  videos: unknown;
  providers: unknown;
  similar: unknown;
  recommendations: unknown;
}

/**
 * Create phased loading configuration for movie data
 */
export function createMovieDataPhases(movieId: number): PhaseConfig<unknown>[] {
  const { isSlowConnection } = useNetworkStore.getState();
  
  const phases: PhaseConfig<unknown>[] = [
    {
      name: 'details',
      priority: 'critical',
      cacheKey: `movie:${movieId}:details`,
      fetchFn: async () => {
        const { getMovieDetails } = await import('./tmdb/api');
        return getMovieDetails(movieId);
      },
      required: true,
    },
    {
      name: 'credits',
      priority: 'high',
      cacheKey: `movie:${movieId}:credits`,
      fetchFn: async () => {
        const { getMovieCredits } = await import('./tmdb/api');
        return getMovieCredits(movieId);
      },
    },
  ];
  
  // Skip heavy content on slow connections
  if (!isSlowConnection) {
    phases.push(
      {
        name: 'videos',
        priority: 'medium',
        cacheKey: `movie:${movieId}:videos`,
        fetchFn: async () => {
          const { getMovieVideos } = await import('./tmdb/api');
          return getMovieVideos(movieId);
        },
      },
      {
        name: 'providers',
        priority: 'medium',
        cacheKey: `movie:${movieId}:providers`,
        fetchFn: async () => {
          const { getMovieWatchProviders } = await import('./tmdb/api');
          return getMovieWatchProviders(movieId);
        },
      }
    );
  }
  
  // Always add recommendations but as background priority
  phases.push(
    {
      name: 'similar',
      priority: 'background',
      cacheKey: `movie:${movieId}:similar`,
      fetchFn: async () => {
        const { getSimilarMovies } = await import('./tmdb/api');
        return getSimilarMovies(movieId);
      },
    },
    {
      name: 'recommendations',
      priority: 'background',
      cacheKey: `movie:${movieId}:recommendations`,
      fetchFn: async () => {
        const { getMovieRecommendations } = await import('./tmdb/api');
        return getMovieRecommendations(movieId);
      },
    }
  );
  
  return phases;
}

// ============================================
// Deferred Loading Hook
// ============================================

interface DeferredItem<T> {
  key: string;
  fetchFn: () => Promise<T>;
  priority: DataPriority;
}

const deferredQueue: DeferredItem<unknown>[] = [];
let isDeferredProcessing = false;

/**
 * Add item to deferred loading queue
 */
export function deferLoad<T>(
  key: string,
  fetchFn: () => Promise<T>,
  priority: DataPriority = 'low'
): void {
  deferredQueue.push({ key, fetchFn, priority });
  processDeferredQueue();
}

/**
 * Process deferred queue after initial render
 */
async function processDeferredQueue(): Promise<void> {
  if (isDeferredProcessing || deferredQueue.length === 0) return;
  
  isDeferredProcessing = true;
  
  // Wait for initial render
  await new Promise((resolve) => {
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(resolve);
    } else {
      setTimeout(resolve, 100);
    }
  });
  
  // Process items
  while (deferredQueue.length > 0) {
    const item = deferredQueue.shift();
    if (!item) break;
    
    try {
      await priorityFetch({
        cacheKey: item.key,
        fetchFn: item.fetchFn,
        priority: item.priority,
      });
    } catch (error) {
      console.warn(`[DeferredLoad] Failed to load ${item.key}:`, error);
    }
    
    // Yield to main thread
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  
  isDeferredProcessing = false;
}

// ============================================
// Network-Aware Data Limiting
// ============================================

/**
 * Limit array data based on network conditions
 */
export function limitDataForNetwork<T>(
  data: T[],
  limits: { fast: number; slow: number; offline: number }
): T[] {
  const { isOffline, isSlowConnection } = useNetworkStore.getState();
  
  if (isOffline) return data.slice(0, limits.offline);
  if (isSlowConnection) return data.slice(0, limits.slow);
  return data.slice(0, limits.fast);
}

/**
 * Check if heavy content should be loaded
 */
export function shouldLoadHeavyContent(): boolean {
  const { isOffline, isSlowConnection } = useNetworkStore.getState();
  return !isOffline && !isSlowConnection;
}
