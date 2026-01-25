'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trash2, Film, Tv } from 'lucide-react';
import { useWatchlistStore } from '@/store';
import { MovieGrid, TVShowGrid } from '@/components/movies';
import { Button } from '@/components/ui';

export default function WatchlistPage() {
  // Use selectors for proper reactivity
  const items = useWatchlistStore((state) => state.items);
  const tvItems = useWatchlistStore((state) => state.tvItems);
  const clearWatchlist = useWatchlistStore((state) => state.clearWatchlist);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'movies' | 'tv'>('movies');

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const totalItems = items.length + tvItems.length;

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-10 bg-dark-800 rounded w-1/3 mb-4" />
          <div className="h-6 bg-dark-800 rounded w-1/4 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-dark-800 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">
            📚 My Watchlist
          </h1>
          <p className="text-gray-400">
            {totalItems} {totalItems === 1 ? 'item' : 'items'} saved
            {items.length > 0 && tvItems.length > 0 && (
              <span className="text-gray-500">
                {' '}• {items.length} {items.length === 1 ? 'movie' : 'movies'}, {tvItems.length} {tvItems.length === 1 ? 'TV show' : 'TV shows'}
              </span>
            )}
          </p>
        </div>
        {totalItems > 0 && (
          <Button
            variant="ghost"
            onClick={() => {
              if (confirm('Are you sure you want to clear your entire watchlist?')) {
                clearWatchlist();
              }
            }}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      {totalItems === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-24 h-24 mb-4 rounded-full bg-dark-800 flex items-center justify-center">
            <Film className="w-12 h-12 text-gray-600" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Your watchlist is empty</h2>
          <p className="text-gray-400 mb-6 max-w-md">
            Start adding movies and TV shows you want to watch later by clicking the bookmark icon.
          </p>
          <div className="flex gap-4">
            <Link href="/discover">
              <Button>Discover Movies</Button>
            </Link>
            <Link href="/tv">
              <Button variant="secondary">Browse TV Shows</Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mb-8 border-b border-dark-700">
            <button
              onClick={() => setActiveTab('movies')}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${
                activeTab === 'movies'
                  ? 'text-primary-400 border-primary-400'
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
            >
              <Film className="w-4 h-4" />
              Movies
              {items.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === 'movies' ? 'bg-primary-500/20 text-primary-300' : 'bg-dark-700 text-gray-400'
                }`}>
                  {items.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('tv')}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${
                activeTab === 'tv'
                  ? 'text-primary-400 border-primary-400'
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
            >
              <Tv className="w-4 h-4" />
              TV Shows
              {tvItems.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === 'tv' ? 'bg-primary-500/20 text-primary-300' : 'bg-dark-700 text-gray-400'
                }`}>
                  {tvItems.length}
                </span>
              )}
            </button>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'movies' ? (
            items.length > 0 ? (
              <MovieGrid movies={items} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 mb-4 rounded-full bg-dark-800 flex items-center justify-center">
                  <Film className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No movies yet</h3>
                <p className="text-gray-400 mb-4">Add movies to your watchlist to see them here.</p>
                <Link href="/discover">
                  <Button size="sm">Discover Movies</Button>
                </Link>
              </div>
            )
          ) : (
            tvItems.length > 0 ? (
              <TVShowGrid shows={tvItems} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 mb-4 rounded-full bg-dark-800 flex items-center justify-center">
                  <Tv className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No TV shows yet</h3>
                <p className="text-gray-400 mb-4">Add TV shows to your watchlist to see them here.</p>
                <Link href="/tv">
                  <Button size="sm">Browse TV Shows</Button>
                </Link>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
