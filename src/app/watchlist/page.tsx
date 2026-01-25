'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Trash2, Film } from 'lucide-react';
import { useWatchlistStore } from '@/store';
import { MovieGrid } from '@/components/movies';
import { Button } from '@/components/ui';

export default function WatchlistPage() {
  const { items, clearWatchlist } = useWatchlistStore();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">
            📚 My Watchlist
          </h1>
          <p className="text-gray-400">
            {items.length} {items.length === 1 ? 'movie' : 'movies'} saved
          </p>
        </div>
        {items.length > 0 && (
          <Button
            variant="ghost"
            onClick={() => {
              if (confirm('Are you sure you want to clear your watchlist?')) {
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

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-24 h-24 mb-4 rounded-full bg-dark-800 flex items-center justify-center">
            <Film className="w-12 h-12 text-gray-600" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Your watchlist is empty</h2>
          <p className="text-gray-400 mb-6 max-w-md">
            Start adding movies you want to watch later by clicking the bookmark icon on any movie.
          </p>
          <Link href="/discover">
            <Button>Discover Movies</Button>
          </Link>
        </div>
      ) : (
        <MovieGrid movies={items} />
      )}
    </div>
  );
}
