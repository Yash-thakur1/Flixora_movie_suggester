'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play, Info, Bookmark, BookmarkCheck } from 'lucide-react';
import { TVShow } from '@/types/movie';
import { getImageUrl, getYear, getTVGenreName } from '@/lib/tmdb';
import { Button, RatingBadge, Badge } from '@/components/ui';
import { useWatchlistStore, useUIStore } from '@/store';
import { cn } from '@/lib/utils';

/**
 * TV Hero Section Component
 * Large featured TV show banner with backdrop image
 */

interface TVHeroSectionProps {
  show: TVShow;
  trailerKey?: string | null;
}

export function TVHeroSection({ show, trailerKey }: TVHeroSectionProps) {
  const addTVShowToWatchlist = useWatchlistStore((state) => state.addTVShowToWatchlist);
  const removeTVShowFromWatchlist = useWatchlistStore((state) => state.removeTVShowFromWatchlist);
  const inWatchlist = useWatchlistStore((state) => state.tvItems.some((s) => s.id === show.id));
  const { openTrailerModal } = useUIStore();

  const handleWatchlistToggle = () => {
    if (inWatchlist) {
      removeTVShowFromWatchlist(show.id);
    } else {
      addTVShowToWatchlist(show);
    }
  };

  return (
    <section className="relative h-[80vh] min-h-[600px] w-full overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src={getImageUrl(show.backdrop_path, 'original')}
          alt={show.name}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-dark-950 via-dark-950/60 to-transparent" />
        <div className="absolute inset-0 bg-hero-gradient" />
      </div>

      {/* Content */}
      <div className="relative h-full container mx-auto px-4 md:px-8 flex items-end pb-16 md:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          {/* TV Series Badge */}
          <Badge variant="primary" className="mb-4">
            TV Series
          </Badge>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-4 leading-tight">
            {show.name}
          </h1>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <RatingBadge rating={show.vote_average} size="lg" />
            <span className="text-gray-300">{getYear(show.first_air_date)}</span>
            <span className="text-gray-500">•</span>
            <div className="flex gap-2">
              {show.genre_ids.slice(0, 3).map((id) => (
                <Badge key={id} variant="genre">
                  {getTVGenreName(id)}
                </Badge>
              ))}
            </div>
          </div>

          {/* Overview */}
          <p className="text-gray-300 text-lg line-clamp-3 mb-6">
            {show.overview}
          </p>

          {/* Actions */}
          <div className="flex flex-wrap gap-4">
            {trailerKey && (
              <Button
                size="lg"
                onClick={() => openTrailerModal(trailerKey, show.name)}
                className="gap-2"
              >
                <Play className="w-5 h-5" fill="currentColor" />
                Watch Trailer
              </Button>
            )}
            <Link href={`/tv/${show.id}`}>
              <Button variant="secondary" size="lg" className="gap-2">
                <Info className="w-5 h-5" />
                More Info
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              onClick={handleWatchlistToggle}
              className={cn('gap-2', inWatchlist && 'border-primary-500 text-primary-400')}
            >
              {inWatchlist ? (
                <>
                  <BookmarkCheck className="w-5 h-5" />
                  In Watchlist
                </>
              ) : (
                <>
                  <Bookmark className="w-5 h-5" />
                  Add to List
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Mini Hero for TV show details page
 */
interface TVMiniHeroProps {
  show: TVShow;
  children?: React.ReactNode;
}

export function TVMiniHero({ show, children }: TVMiniHeroProps) {
  return (
    <div className="relative h-[50vh] min-h-[400px] w-full overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={getImageUrl(show.backdrop_path, 'original')}
          alt={show.name}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/50 to-dark-950/30" />
      </div>
      {children}
    </div>
  );
}
