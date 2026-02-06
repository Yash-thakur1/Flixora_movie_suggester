'use client';

import { useEffect } from 'react';
import { trackMediaView } from '@/hooks/useWatchHistory';

interface TVWatchTrackerProps {
  id: number;
  name: string;
  posterPath: string | null;
  genreIds: number[];
  voteAverage: number;
  firstAirDate: string | null;
  originalLanguage: string;
}

/**
 * Invisible client component that tracks TV show views in watch history
 */
export function TVWatchTracker({
  id,
  name,
  posterPath,
  genreIds,
  voteAverage,
  firstAirDate,
  originalLanguage,
}: TVWatchTrackerProps) {
  useEffect(() => {
    trackMediaView({
      id,
      type: 'tv',
      title: name,
      posterPath,
      genreIds,
      voteAverage,
      releaseDate: firstAirDate,
      originalLanguage,
    });
  }, [id, name, posterPath, genreIds, voteAverage, firstAirDate, originalLanguage]);

  return null;
}
