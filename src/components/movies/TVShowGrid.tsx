'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TVShow } from '@/types/movie';
import { TVShowCard } from './TVShowCard';
import { CompactPosterCard } from './CompactPosterCard';
import { MovieGridSkeleton } from '@/components/ui';
import { cn } from '@/lib/utils';

/**
 * Responsive TV show grid with animations
 */

interface TVShowGridProps {
  shows: TVShow[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  columns?: 'auto' | 2 | 3 | 4 | 5 | 6;
}

export function TVShowGrid({
  shows,
  loading = false,
  emptyMessage = 'No TV shows found',
  className,
  columns = 'auto',
}: TVShowGridProps) {
  if (loading) {
    return <MovieGridSkeleton />;
  }

  if (shows.length === 0) {
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
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
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
      {shows.map((show, index) => (
        <TVShowCard key={show.id} show={show} priority={index < 6} />
      ))}
    </motion.div>
  );
}

/**
 * TV Show section with title and optional "View All" link
 */
interface TVShowSectionProps {
  title: string;
  description?: string;
  shows: TVShow[];
  loading?: boolean;
  viewAllHref?: string;
  className?: string;
}

export function TVShowSection({
  title,
  description,
  shows,
  loading = false,
  viewAllHref,
  className,
}: TVShowSectionProps) {
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
      <TVShowGrid shows={shows} loading={loading} />
    </section>
  );
}

/**
 * Horizontal scrollable TV show carousel
 */
interface TVShowCarouselProps {
  shows: TVShow[];
  title?: string;
  description?: string;
  className?: string;
}

export function TVShowCarousel({
  shows,
  title,
  description,
  className,
}: TVShowCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    
    const scrollAmount = scrollRef.current.offsetWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section className={cn('relative py-4 md:py-6', className)}>
      {/* Header */}
      {(title || description) && (
        <div className="mb-3 px-4 md:px-0">
          {title && (
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{title}</h2>
          )}
          {description && (
            <p className="text-sm text-gray-400 mt-0.5">{description}</p>
          )}
        </div>
      )}

      {/* Carousel container */}
      <div className="relative group">
        {/* Navigation buttons */}
        <button
          onClick={() => scroll('left')}
          className={cn(
            'absolute left-2 top-1/2 -translate-y-1/2 z-10',
            'w-10 h-10 rounded-full bg-dark-800/90 backdrop-blur-sm',
            'flex items-center justify-center',
            'text-white opacity-0 group-hover:opacity-100 transition-opacity',
            'hover:bg-dark-700 shadow-lg',
            'disabled:opacity-50'
          )}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <button
          onClick={() => scroll('right')}
          className={cn(
            'absolute right-2 top-1/2 -translate-y-1/2 z-10',
            'w-10 h-10 rounded-full bg-dark-800/90 backdrop-blur-sm',
            'flex items-center justify-center',
            'text-white opacity-0 group-hover:opacity-100 transition-opacity',
            'hover:bg-dark-700 shadow-lg',
            'disabled:opacity-50'
          )}
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth px-4 md:px-0"
        >
          {shows.map((show, index) => (
            <div key={show.id} className="flex-shrink-0 w-[120px] sm:w-[140px] md:w-[160px]">
              <CompactPosterCard tvShow={show} priority={index < 4} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
