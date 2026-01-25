/**
 * Fallback Recommendations System
 * 
 * Provides rule-based recommendations when the AI can't find matches
 * or when there are errors. Uses cached data and popular content.
 */

import { MediaItem } from './chatService';
import { Movie, TVShow } from '@/types/movie';
import { 
  getTrendingMovies, 
  getPopularMovies, 
  getTopRatedMovies,
  getTrendingTVShows,
  getPopularTVShows,
  getTopRatedTVShows,
  discoverMovies,
  discoverTVShows
} from '@/lib/tmdb/api';
import { GENRES, TV_GENRES, QUICK_MOODS, TV_QUICK_MOODS } from '@/lib/tmdb/config';

// ============================================
// Types
// ============================================

export interface FallbackResult {
  items: MediaItem[];
  source: string;
  explanation: string;
}

// ============================================
// Cached Fallback Data
// ============================================

let cachedTrendingMovies: Movie[] = [];
let cachedTrendingTV: TVShow[] = [];
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Refresh fallback cache
 */
async function refreshCache(): Promise<void> {
  const now = Date.now();
  if (now - cacheTimestamp < CACHE_TTL && cachedTrendingMovies.length > 0) {
    return; // Cache is still valid
  }
  
  try {
    const [movies, tv] = await Promise.all([
      getTrendingMovies('week', 1),
      getTrendingTVShows('week', 1)
    ]);
    
    cachedTrendingMovies = movies.results;
    cachedTrendingTV = tv.results;
    cacheTimestamp = now;
  } catch (error) {
    console.error('Failed to refresh fallback cache:', error);
  }
}

/**
 * Convert Movie to MediaItem
 */
function movieToMediaItem(movie: Movie): MediaItem {
  return {
    id: movie.id,
    type: 'movie',
    title: movie.title,
    posterPath: movie.poster_path,
    backdropPath: movie.backdrop_path,
    overview: movie.overview,
    releaseDate: movie.release_date,
    voteAverage: movie.vote_average,
    genreIds: movie.genre_ids
  };
}

/**
 * Convert TVShow to MediaItem
 */
function tvShowToMediaItem(show: TVShow): MediaItem {
  return {
    id: show.id,
    type: 'tv',
    title: show.name,
    posterPath: show.poster_path,
    backdropPath: show.backdrop_path,
    overview: show.overview,
    releaseDate: show.first_air_date || null,
    voteAverage: show.vote_average,
    genreIds: show.genre_ids
  };
}

// ============================================
// Fallback Strategies
// ============================================

/**
 * Get random trending content from cache
 */
export async function getTrendingFallback(count: number = 6): Promise<FallbackResult> {
  await refreshCache();
  
  const movies = cachedTrendingMovies.slice(0, Math.ceil(count / 2));
  const tvShows = cachedTrendingTV.slice(0, Math.floor(count / 2));
  
  const items: MediaItem[] = [
    ...movies.map(movieToMediaItem),
    ...tvShows.map(tvShowToMediaItem)
  ].slice(0, count);
  
  return {
    items,
    source: 'trending',
    explanation: 'Here\'s what\'s popular right now:'
  };
}

/**
 * Get genre-based fallback
 */
export async function getGenreFallback(
  genreIds: readonly number[] | number[], 
  mediaType: 'movie' | 'tv' | 'both' = 'both',
  count: number = 6
): Promise<FallbackResult> {
  const items: MediaItem[] = [];
  const genres = [...genreIds]; // Convert readonly to mutable
  
  try {
    if (mediaType === 'movie' || mediaType === 'both') {
      const movies = await discoverMovies({
        with_genres: genres.join(','),
        sort_by: 'popularity.desc',
        page: 1
      });
      items.push(...movies.results.slice(0, mediaType === 'both' ? 3 : count).map(movieToMediaItem));
    }
    
    if (mediaType === 'tv' || mediaType === 'both') {
      const tvShows = await discoverTVShows({
        with_genres: genres.join(','),
        sort_by: 'popularity.desc',
        page: 1
      });
      items.push(...tvShows.results.slice(0, mediaType === 'both' ? 3 : count).map(tvShowToMediaItem));
    }
  } catch (error) {
    console.error('Genre fallback error:', error);
    return getTrendingFallback(count);
  }
  
  const genreList = mediaType === 'tv' ? TV_GENRES : GENRES;
  const genreNames = genres
    .map(id => genreList.find(g => g.id === id)?.name)
    .filter(Boolean)
    .slice(0, 3);
  
  return {
    items: items.slice(0, count),
    source: 'genre',
    explanation: `Popular ${genreNames.join(' & ')} picks:`
  };
}

/**
 * Get mood-based fallback
 */
export async function getMoodFallback(
  moodId: string,
  mediaType: 'movie' | 'tv' | 'both' = 'both',
  count: number = 6
): Promise<FallbackResult> {
  const moodList = mediaType === 'tv' ? TV_QUICK_MOODS : QUICK_MOODS;
  const mood = moodList.find(m => m.id === moodId);
  
  if (!mood || mood.genres.length === 0) {
    return getTrendingFallback(count);
  }
  
  const result = await getGenreFallback(mood.genres, mediaType, count);
  
  return {
    ...result,
    source: 'mood',
    explanation: `${mood.icon} ${mood.description}`
  };
}

/**
 * Get top-rated fallback
 */
export async function getTopRatedFallback(
  mediaType: 'movie' | 'tv' | 'both' = 'both',
  count: number = 6
): Promise<FallbackResult> {
  const items: MediaItem[] = [];
  
  try {
    if (mediaType === 'movie' || mediaType === 'both') {
      const movies = await getTopRatedMovies(1);
      items.push(...movies.results.slice(0, mediaType === 'both' ? 3 : count).map(movieToMediaItem));
    }
    
    if (mediaType === 'tv' || mediaType === 'both') {
      const tvShows = await getTopRatedTVShows(1);
      items.push(...tvShows.results.slice(0, mediaType === 'both' ? 3 : count).map(tvShowToMediaItem));
    }
  } catch (error) {
    console.error('Top rated fallback error:', error);
    return getTrendingFallback(count);
  }
  
  return {
    items: items.slice(0, count),
    source: 'top_rated',
    explanation: '⭐ All-time favorites you shouldn\'t miss:'
  };
}

/**
 * Get random surprise content
 */
export async function getSurpriseFallback(count: number = 6): Promise<FallbackResult> {
  await refreshCache();
  
  // Shuffle and pick random items
  const allContent: MediaItem[] = [
    ...cachedTrendingMovies.map(movieToMediaItem),
    ...cachedTrendingTV.map(tvShowToMediaItem)
  ];
  
  // Fisher-Yates shuffle
  for (let i = allContent.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allContent[i], allContent[j]] = [allContent[j], allContent[i]];
  }
  
  return {
    items: allContent.slice(0, count),
    source: 'surprise',
    explanation: '🎲 Here\'s a random selection for you:'
  };
}

/**
 * Smart fallback based on context
 */
export async function getSmartFallback(
  context: {
    genres?: number[];
    moods?: string[];
    mediaType?: 'movie' | 'tv' | 'both';
    wasError?: boolean;
  },
  count: number = 6
): Promise<FallbackResult> {
  const { genres, moods, mediaType = 'both', wasError } = context;
  
  // If there was an error, just return trending
  if (wasError) {
    return getTrendingFallback(count);
  }
  
  // If moods were specified, try mood-based fallback
  if (moods && moods.length > 0) {
    const moodList = mediaType === 'tv' ? TV_QUICK_MOODS : QUICK_MOODS;
    
    // Map mood strings to quick mood IDs
    const moodMap: Record<string, string> = {
      happy: 'laugh',
      sad: 'cry',
      excited: 'action',
      scared: 'scared',
      romantic: 'romance',
      curious: 'think',
      bored: 'bored'
    };
    
    for (const mood of moods) {
      const moodId = moodMap[mood];
      if (moodId && moodList.find(m => m.id === moodId)) {
        return getMoodFallback(moodId, mediaType, count);
      }
    }
  }
  
  // If genres were specified, try genre-based fallback
  if (genres && genres.length > 0) {
    return getGenreFallback(genres, mediaType, count);
  }
  
  // Default to trending
  return getTrendingFallback(count);
}

export default {
  getTrendingFallback,
  getGenreFallback,
  getMoodFallback,
  getTopRatedFallback,
  getSurpriseFallback,
  getSmartFallback
};
