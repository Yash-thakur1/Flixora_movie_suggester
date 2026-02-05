'use client';

import { useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Movie } from '@/types/movie';
import { CompactPosterCard } from './CompactPosterCard';
import { cn } from '@/lib/utils';
import { useMovieViewportPrefetch } from '@/hooks';

/**
 * Horizontal scrollable movie carousel
 */

interface MovieCarouselProps {
  movies: Movie[];
  title?: string;
  description?: string;
  className?: string;
  prefetchOnScroll?: boolean;
}

export function MovieCarousel({
  movies,
  title,
  description,
  className,
  prefetchOnScroll = true,
}: MovieCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Get movie IDs for prefetching
  const movieIds = useMemo(() => movies.map(m => m.id), [movies]);
  
  // Prefetch movies when carousel enters viewport
  const prefetchRef = useMovieViewportPrefetch(movieIds, { 
    enabled: prefetchOnScroll,
    rootMargin: '300px' // Start prefetching when 300px before visible
  });

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    
    const scrollAmount = scrollRef.current.offsetWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section ref={prefetchRef} className={cn('relative py-4 md:py-6', className)}>
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
            'flex items-center justify-center text-white',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-300',
            'hover:bg-dark-700 focus:outline-none focus:ring-2 focus:ring-primary-500',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={() => scroll('right')}
          className={cn(
            'absolute right-2 top-1/2 -translate-y-1/2 z-10',
            'w-10 h-10 rounded-full bg-dark-800/90 backdrop-blur-sm',
            'flex items-center justify-center text-white',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-300',
            'hover:bg-dark-700 focus:outline-none focus:ring-2 focus:ring-primary-500'
          )}
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          className={cn(
            'flex gap-3 overflow-x-auto scrollbar-hide',
            'px-4 md:px-0 pb-4',
            'scroll-smooth snap-x snap-mandatory'
          )}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {movies.map((movie, index) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="shrink-0 w-[120px] sm:w-[140px] md:w-[160px] snap-start"
            >
              <CompactPosterCard movie={movie} priority={index < 5} />
            </motion.div>
          ))}
        </div>

        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-dark-950 to-transparent pointer-events-none md:hidden" />
        <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-dark-950 to-transparent pointer-events-none md:hidden" />
      </div>
    </section>
  );
}
