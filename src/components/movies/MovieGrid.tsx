'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Movie } from '@/types/movie';
import { MovieCard } from './MovieCard';
import { MovieGridSkeleton } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useMovieViewportPrefetch } from '@/hooks';

/**
 * Responsive movie grid with animations and prefetching
 */

interface MovieGridProps {
  movies: Movie[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  columns?: 'auto' | 2 | 3 | 4 | 5 | 6;
  prefetchOnScroll?: boolean;
}

export function MovieGrid({
  movies,
  loading = false,
  emptyMessage = 'No movies found',
  className,
  columns = 'auto',
  prefetchOnScroll = true,
}: MovieGridProps) {
  // Get movie IDs for prefetching
  const movieIds = useMemo(() => movies.map(m => m.id), [movies]);
  
  // Prefetch movies when grid enters viewport
  const prefetchRef = useMovieViewportPrefetch(movieIds, { 
    enabled: prefetchOnScroll && !loading,
    rootMargin: '400px'
  });
  
  if (loading) {
    return <MovieGridSkeleton />;
  }

  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-24 h-24 mb-4 rounded-full bg-dark-800 flex items-center justify-center">
          <svg
            className="w-12 h-12 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
            />
          </svg>
        </div>
        <p className="text-gray-400 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  const gridClasses = {
    auto: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
  };

  return (
    <motion.div
      ref={prefetchRef}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.05,
          },
        },
      }}
      className={cn('grid gap-4 md:gap-6', gridClasses[columns], className)}
    >
      {movies.map((movie, index) => (
        <MovieCard key={movie.id} movie={movie} priority={index < 6} />
      ))}
    </motion.div>
  );
}

/**
 * Movie section with title and optional "View All" link
 */
interface MovieSectionProps {
  title: string;
  description?: string;
  movies: Movie[];
  loading?: boolean;
  viewAllHref?: string;
  className?: string;
}

export function MovieSection({
  title,
  description,
  movies,
  loading = false,
  viewAllHref,
  className,
}: MovieSectionProps) {
  return (
    <section className={cn('py-8', className)}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">{title}</h2>
          {description && (
            <p className="text-gray-400 mt-1">{description}</p>
          )}
        </div>
        {viewAllHref && (
          <a
            href={viewAllHref}
            className="text-primary-500 hover:text-primary-400 font-medium transition-colors"
          >
            View All →
          </a>
        )}
      </div>
      <MovieGrid movies={movies} loading={loading} />
    </section>
  );
}
