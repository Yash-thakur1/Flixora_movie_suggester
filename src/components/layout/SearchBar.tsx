'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { useDebounce, useMovieSearch } from '@/hooks';
import { useSearchHistoryStore, useUIStore } from '@/store';
import { MovieCardHorizontal } from '@/components/movies';
import { SearchResultSkeleton } from '@/components/ui';
import { cn } from '@/lib/utils';

/**
 * Global Search Component
 * Full-featured search with auto-suggestions and history
 */

export function SearchBar({ onNavigate }: { onNavigate?: () => void } = {}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);
  const { results, isLoading, search, clear } = useMovieSearch();
  const { recentSearches, addSearch, removeSearch } = useSearchHistoryStore();
  const { isSearchOpen, closeSearch } = useUIStore();

  // Search when query changes
  useEffect(() => {
    if (debouncedQuery) {
      search(debouncedQuery);
    } else {
      clear();
    }
  }, [debouncedQuery, search, clear]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      addSearch(query.trim());
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsFocused(false);
      setQuery('');
      onNavigate?.();
    }
  };

  const handleResultClick = (movieId: number, title: string) => {
    addSearch(title);
    router.push(`/movie/${movieId}`);
    setIsFocused(false);
    setQuery('');
    clear();
    onNavigate?.();
  };

  const handleHistoryClick = (searchTerm: string) => {
    setQuery(searchTerm);
    search(searchTerm);
  };

  const showDropdown = isFocused && (query.length > 0 || recentSearches.length > 0);

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder="Search movies..."
            className={cn(
              'w-full bg-dark-800 border border-dark-600 rounded-full',
              'pl-12 pr-10 py-3 text-white placeholder:text-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'transition-all duration-200'
            )}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                clear();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </form>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              'absolute top-full left-0 right-0 mt-2 z-50',
              'bg-dark-800 border border-dark-600 rounded-xl shadow-2xl',
              'overflow-hidden max-h-[70vh] overflow-y-auto'
            )}
          >
            {/* Loading state */}
            {isLoading && (
              <div className="p-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SearchResultSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Search results */}
            {!isLoading && results.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide border-b border-dark-700">
                  <TrendingUp className="inline w-3 h-3 mr-1" />
                  Results
                </div>
                {results.map((movie) => (
                  <button
                    key={movie.id}
                    onClick={() => handleResultClick(movie.id, movie.title)}
                    className="w-full text-left"
                  >
                    <MovieCardHorizontal movie={movie} />
                  </button>
                ))}
              </div>
            )}

            {/* No results */}
            {!isLoading && query && results.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                <p>No movies found for "{query}"</p>
              </div>
            )}

            {/* Recent searches */}
            {!query && recentSearches.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide border-b border-dark-700">
                  <Clock className="inline w-3 h-3 mr-1" />
                  Recent Searches
                </div>
                {recentSearches.map((term) => (
                  <div
                    key={term}
                    className="flex items-center justify-between px-4 py-3 hover:bg-dark-700 transition-colors"
                  >
                    <button
                      onClick={() => handleHistoryClick(term)}
                      className="flex items-center gap-3 text-gray-300 hover:text-white"
                    >
                      <Clock className="w-4 h-4 text-gray-500" />
                      {term}
                    </button>
                    <button
                      onClick={() => removeSearch(term)}
                      className="text-gray-500 hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Mobile search overlay
 */
export function MobileSearchOverlay() {
  const { isSearchOpen, closeSearch } = useUIStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      inputRef.current?.focus();
    }
  }, [isSearchOpen]);

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-dark-950 p-4"
        >
          <div className="flex items-center gap-4 mb-4">
            <SearchBar onNavigate={closeSearch} />
            <button
              onClick={closeSearch}
              className="text-gray-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
