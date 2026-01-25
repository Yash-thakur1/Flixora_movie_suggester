/**
 * Custom hooks for data fetching and common operations
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Movie, PaginatedResponse } from '@/types/movie';
import { searchMovies } from '@/lib/tmdb';
import { debounce } from '@/lib/utils';

// ============================================
// useDebounce Hook
// ============================================

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================
// useMovieSearch Hook
// ============================================

interface UseMovieSearchReturn {
  results: Movie[];
  isLoading: boolean;
  error: Error | null;
  search: (query: string) => void;
  clear: () => void;
}

export function useMovieSearch(): UseMovieSearchReturn {
  const [results, setResults] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const search = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await searchMovies(query);
        setResults(response.results.slice(0, 8)); // Limit for dropdown
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Search failed'));
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { results, isLoading, error, search, clear };
}

// ============================================
// useInfiniteScroll Hook
// ============================================

interface UseInfiniteScrollOptions<T> {
  fetchFn: (page: number) => Promise<PaginatedResponse<T>>;
  initialPage?: number;
}

interface UseInfiniteScrollReturn<T> {
  items: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => void;
  reset: () => void;
}

export function useInfiniteScroll<T>({
  fetchFn,
  initialPage = 1,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Initial load
  useEffect(() => {
    const loadInitial = async () => {
      setIsLoading(true);
      try {
        const response = await fetchFn(initialPage);
        setItems(response.results);
        setHasMore(response.page < response.total_pages);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load'));
      } finally {
        setIsLoading(false);
      }
    };

    loadInitial();
  }, [fetchFn, initialPage]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await fetchFn(nextPage);
      setItems((prev) => [...prev, ...response.results]);
      setPage(nextPage);
      setHasMore(response.page < response.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load more'));
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchFn, page, isLoadingMore, hasMore]);

  const reset = useCallback(() => {
    setItems([]);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
  }, [initialPage]);

  return { items, isLoading, isLoadingMore, error, hasMore, loadMore, reset };
}

// ============================================
// useIntersectionObserver Hook
// ============================================

interface UseIntersectionObserverOptions {
  threshold?: number;
  root?: Element | null;
  rootMargin?: string;
}

export function useIntersectionObserver(
  callback: () => void,
  options: UseIntersectionObserverOptions = {}
): React.RefObject<HTMLDivElement> {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback();
        }
      },
      {
        threshold: options.threshold ?? 0.1,
        root: options.root ?? null,
        rootMargin: options.rootMargin ?? '100px',
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [callback, options.threshold, options.root, options.rootMargin]);

  return ref;
}

// ============================================
// useLocalStorage Hook
// ============================================

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

// ============================================
// useMediaQuery Hook
// ============================================

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

// ============================================
// useKeyPress Hook
// ============================================

export function useKeyPress(targetKey: string, callback: () => void): void {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === targetKey) {
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [targetKey, callback]);
}

// ============================================
// Movie Prefetch Hooks
// ============================================

/**
 * Hook to prefetch movie data when card is hovered
 */
export function useMoviePrefetch(movieId: number): {
  onMouseEnter: () => void;
  onFocus: () => void;
} {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleHover = useCallback(() => {
    // Small delay to avoid prefetching on quick mouse passes
    timeoutRef.current = setTimeout(async () => {
      const { prefetchMovieEssentials } = await import('@/lib/movieCache');
      prefetchMovieEssentials(movieId);
    }, 150);
  }, [movieId]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    onMouseEnter: handleHover,
    onFocus: handleHover,
  };
}

/**
 * Hook to prefetch movies when they enter the viewport
 */
export function useMovieViewportPrefetch(
  movieIds: number[],
  options: { enabled?: boolean; rootMargin?: string } = {}
): React.RefObject<HTMLDivElement> {
  const { enabled = true, rootMargin = '200px' } = options;
  const ref = useRef<HTMLDivElement>(null);
  const prefetchedRef = useRef(new Set<number>());

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting) {
          const { queueMoviesForPrefetch } = await import('@/lib/movieCache');
          const newIds = movieIds.filter(id => !prefetchedRef.current.has(id));
          if (newIds.length > 0) {
            queueMoviesForPrefetch(newIds);
            newIds.forEach(id => prefetchedRef.current.add(id));
          }
        }
      },
      { rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [movieIds, enabled, rootMargin]);

  return ref;
}

/**
 * Hook to use cached movie data with SWR pattern
 */
export function useMovieData(movieId: number): {
  data: import('@/lib/movieCache').CachedMovieData | null;
  isLoading: boolean;
  isStale: boolean;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<import('@/lib/movieCache').CachedMovieData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const { prefetchMovieFull, getMovieCache } = await import('@/lib/movieCache');
      await prefetchMovieFull(movieId);
      const cached = getMovieCache(movieId);
      if (cached.data) {
        setData(cached.data as import('@/lib/movieCache').CachedMovieData);
        setIsStale(cached.isStale);
      }
    } finally {
      setIsLoading(false);
    }
  }, [movieId]);

  useEffect(() => {
    const loadData = async () => {
      const { getMovieCache, prefetchMovieFull } = await import('@/lib/movieCache');
      const cached = getMovieCache(movieId);
      
      if (cached.data) {
        setData(cached.data as import('@/lib/movieCache').CachedMovieData);
        setIsStale(cached.isStale);
        setIsLoading(false);
        
        // Revalidate in background if stale
        if (cached.isStale) {
          prefetchMovieFull(movieId).then(() => {
            const fresh = getMovieCache(movieId);
            if (fresh.data) {
              setData(fresh.data as import('@/lib/movieCache').CachedMovieData);
              setIsStale(false);
            }
          });
        }
      } else {
        // No cache, fetch fresh
        await prefetchMovieFull(movieId);
        const fresh = getMovieCache(movieId);
        if (fresh.data) {
          setData(fresh.data as import('@/lib/movieCache').CachedMovieData);
        }
        setIsLoading(false);
      }
    };

    loadData();
  }, [movieId]);

  return { data, isLoading, isStale, refetch };
}
