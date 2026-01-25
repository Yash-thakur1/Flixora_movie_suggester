'use client';

import { motion } from 'framer-motion';
import { GENRES } from '@/lib/tmdb';
import { cn } from '@/lib/utils';

/**
 * Genre Selector Component
 * Interactive genre selection with visual feedback
 */

interface GenreSelectorProps {
  selectedGenres: number[];
  onToggleGenre: (genreId: number) => void;
  variant?: 'grid' | 'inline' | 'compact';
  className?: string;
}

export function GenreSelector({
  selectedGenres,
  onToggleGenre,
  variant = 'grid',
  className,
}: GenreSelectorProps) {
  const containerClasses = {
    grid: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3',
    inline: 'flex flex-wrap gap-2',
    compact: 'flex flex-wrap gap-2',
  };

  const buttonClasses = {
    grid: 'flex flex-col items-center justify-center p-4 rounded-xl',
    inline: 'flex items-center gap-2 px-4 py-2 rounded-full',
    compact: 'px-3 py-1.5 rounded-lg text-sm',
  };

  return (
    <div className={cn(containerClasses[variant], className)}>
      {GENRES.map((genre, index) => {
        const isSelected = selectedGenres.includes(genre.id);

        return (
          <motion.button
            key={genre.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
            onClick={() => onToggleGenre(genre.id)}
            className={cn(
              buttonClasses[variant],
              'border transition-all duration-200',
              'hover:scale-105 active:scale-95',
              isSelected
                ? 'bg-primary-600/20 border-primary-500 text-white'
                : 'bg-dark-800 border-dark-600 text-gray-300 hover:border-primary-500/50'
            )}
            style={
              isSelected
                ? { borderColor: genre.color, boxShadow: `0 0 20px ${genre.color}30` }
                : undefined
            }
          >
            {variant === 'grid' && (
              <>
                <span className="text-2xl mb-2">{genre.icon}</span>
                <span className="font-medium text-sm">{genre.name}</span>
              </>
            )}
            {variant === 'inline' && (
              <>
                <span>{genre.icon}</span>
                <span className="font-medium">{genre.name}</span>
              </>
            )}
            {variant === 'compact' && (
              <span>
                {genre.icon} {genre.name}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

/**
 * Genre tags display (read-only)
 */
interface GenreTagsProps {
  genreIds: number[];
  limit?: number;
  className?: string;
}

export function GenreTags({ genreIds, limit = 3, className }: GenreTagsProps) {
  const genres = genreIds
    .map((id) => GENRES.find((g) => g.id === id))
    .filter(Boolean)
    .slice(0, limit);

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {genres.map((genre) => (
        <span
          key={genre!.id}
          className="px-2.5 py-1 rounded-full text-xs font-medium bg-dark-800/80 text-gray-300 border border-dark-600"
          style={{ borderColor: `${genre!.color}50` }}
        >
          {genre!.icon} {genre!.name}
        </span>
      ))}
    </div>
  );
}
