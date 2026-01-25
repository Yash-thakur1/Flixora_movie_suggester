'use client';

import { useState, useEffect, Suspense, lazy, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { 
  getImageUrl, 
  formatRuntime, 
  formatDate, 
  getMainTrailer 
} from '@/lib/tmdb';
import { 
  getMovieCache, 
  updateMovieCache, 
  CachedMovieData 
} from '@/lib/movieCache';
import { RatingBadge, Badge, Skeleton } from '@/components/ui';
import { MovieDetailsActions } from './MovieDetailsActions';
import { cn } from '@/lib/utils';
import { MovieDetails, Credits, Cast, Crew, WatchProviderCountry } from '@/types/movie';

// ============================================
// Phase 1: Essential Content (Renders Instantly)
// ============================================

interface EssentialContentProps {
  details: MovieDetails;
  director?: Crew;
  trailer?: string | null;
}

function EssentialContent({ details, director, trailer }: EssentialContentProps) {
  return (
    <>
      {/* Hero Backdrop */}
      <div className="relative h-[50vh] min-h-[400px] w-full overflow-hidden">
        <Image
          src={getImageUrl(details.backdrop_path, 'w1280')}
          alt={details.title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
          quality={75}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/50 to-dark-950/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-dark-950 via-transparent to-transparent" />
      </div>

      {/* Main Content */}
      <div className="relative -mt-64 container mx-auto px-4 md:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Poster */}
          <div className="shrink-0">
            <div className="relative w-64 h-96 rounded-xl overflow-hidden shadow-2xl mx-auto lg:mx-0">
              <Image
                src={getImageUrl(details.poster_path, 'w500')}
                alt={details.title}
                fill
                className="object-cover"
                priority
                sizes="256px"
                quality={85}
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            {/* Title */}
            <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-2">
              {details.title}
            </h1>
            
            {/* Tagline */}
            {details.tagline && (
              <p className="text-xl text-gray-400 italic mb-4">&ldquo;{details.tagline}&rdquo;</p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <RatingBadge rating={details.vote_average} size="lg" />
              <span className="text-gray-300">{formatDate(details.release_date)}</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-300">{formatRuntime(details.runtime)}</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-300">{details.original_language.toUpperCase()}</span>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-6">
              {details.genres.map((genre) => (
                <Badge key={genre.id} variant="genre">
                  {genre.name}
                </Badge>
              ))}
            </div>

            {/* Overview */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Overview</h3>
              <p className="text-gray-300 leading-relaxed">{details.overview}</p>
            </div>

            {/* Director */}
            {director && (
              <div className="mb-6">
                <span className="text-gray-400">Director:</span>{' '}
                <span className="text-white font-medium">{director.name}</span>
              </div>
            )}

            {/* Actions */}
            <MovieDetailsActions
              movie={{
                id: details.id,
                title: details.title,
                overview: details.overview,
                poster_path: details.poster_path,
                backdrop_path: details.backdrop_path,
                release_date: details.release_date,
                vote_average: details.vote_average,
                vote_count: details.vote_count,
                popularity: details.popularity,
                genre_ids: details.genres.map((g) => g.id),
                adult: details.adult,
                original_language: details.original_language,
                original_title: details.original_title,
                video: details.video,
              }}
              trailerKey={trailer ?? null}
            />
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================
// Phase 2: Deferred Content (Loads Progressively)
// ============================================

// Lazy load heavy components
const CastSection = lazy(() => import('@/components/movies/CastSection').then(m => ({ default: m.CastSection })));
const CrewSection = lazy(() => import('@/components/movies/CastSection').then(m => ({ default: m.CrewSection })));
const TrailerPlayer = lazy(() => import('@/components/movies/TrailerModal').then(m => ({ default: m.TrailerPlayer })));
const WatchProvidersSection = lazy(() => import('@/components/movies/WatchProviders').then(m => ({ default: m.WatchProvidersSection })));
const MovieCarousel = lazy(() => import('@/components/movies/MovieCarousel').then(m => ({ default: m.MovieCarousel })));

// Skeleton for deferred content
function DeferredSkeleton() {
  return (
    <div className="animate-pulse space-y-6 py-6">
      <div className="h-8 w-48 bg-dark-800 rounded" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="shrink-0">
            <div className="w-24 h-24 bg-dark-800 rounded-full" />
            <div className="h-4 w-20 bg-dark-800 rounded mt-2 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface DeferredContentProps {
  movieId: number;
  credits?: Credits;
  trailer?: string | null;
  providers?: WatchProviderCountry | null;
  movieTitle: string;
}

function DeferredContent({ movieId, credits, trailer, providers, movieTitle }: DeferredContentProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Small delay to ensure essential content renders first
    const timer = requestAnimationFrame(() => {
      setIsLoaded(true);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  if (!isLoaded) {
    return <DeferredSkeleton />;
  }

  return (
    <div className="container mx-auto px-4 md:px-8 pb-16">
      {/* Where to Watch */}
      {providers && (
        <Suspense fallback={<DeferredSkeleton />}>
          <WatchProvidersSection providers={providers} movieTitle={movieTitle} />
        </Suspense>
      )}

      {/* Trailer */}
      {trailer && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-4">🎬 Trailer</h2>
          <Suspense fallback={<div className="aspect-video max-w-4xl bg-dark-800 rounded-xl animate-pulse" />}>
            <TrailerPlayer videoKey={trailer} title={movieTitle} className="max-w-4xl" />
          </Suspense>
        </section>
      )}

      {/* Cast */}
      {credits && credits.cast.length > 0 && (
        <Suspense fallback={<DeferredSkeleton />}>
          <CastSection cast={credits.cast} />
        </Suspense>
      )}

      {/* Crew */}
      {credits && credits.crew.length > 0 && (
        <Suspense fallback={<DeferredSkeleton />}>
          <CrewSection crew={credits.crew} />
        </Suspense>
      )}
    </div>
  );
}

// ============================================
// Phase 3: Related Content (Loads Last)
// ============================================

interface RelatedContentProps {
  movieId: number;
}

function RelatedContent({ movieId }: RelatedContentProps) {
  const [similar, setSimilar] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Delay loading related content until after initial render
    const timer = setTimeout(async () => {
      try {
        const { getMovieCache, updateMovieCache } = await import('@/lib/movieCache');
        const { getSimilarMovies, getMovieRecommendations } = await import('@/lib/tmdb/api');
        
        const cached = getMovieCache(movieId);
        
        // Use cached data if available
        if (cached.hasSimilar && cached.hasRecommendations && cached.data) {
          setSimilar(cached.data.similar);
          setRecommendations(cached.data.recommendations);
          setIsLoading(false);
          return;
        }

        // Fetch only what's missing
        const promises: Promise<void>[] = [];
        
        if (!cached.hasSimilar) {
          promises.push(
            getSimilarMovies(movieId).then(data => {
              setSimilar(data);
              updateMovieCache(movieId, { similar: data });
            })
          );
        } else if (cached.data?.similar) {
          setSimilar(cached.data.similar);
        }

        if (!cached.hasRecommendations) {
          promises.push(
            getMovieRecommendations(movieId).then(data => {
              setRecommendations(data);
              updateMovieCache(movieId, { recommendations: data });
            })
          );
        } else if (cached.data?.recommendations) {
          setRecommendations(cached.data.recommendations);
        }

        await Promise.all(promises);
      } catch (error) {
        console.error('Failed to load related content:', error);
      } finally {
        setIsLoading(false);
      }
    }, 500); // 500ms delay for related content

    return () => clearTimeout(timer);
  }, [movieId]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-8 pb-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-dark-800 rounded" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="shrink-0 w-[200px] aspect-[2/3] bg-dark-800 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hasContent = recommendations?.results?.length > 0 || similar?.results?.length > 0;
  if (!hasContent) return null;

  return (
    <div className="container mx-auto px-4 md:px-8 pb-16">
      <Suspense fallback={null}>
        {recommendations?.results?.length > 0 && (
          <MovieCarousel
            title="🎯 Recommended For You"
            description="Based on this movie"
            movies={recommendations.results}
            prefetchOnScroll={true}
          />
        )}
        {similar?.results?.length > 0 && (
          <MovieCarousel
            title="🎬 Similar Movies"
            description="Movies like this one"
            movies={similar.results}
            prefetchOnScroll={true}
          />
        )}
      </Suspense>
    </div>
  );
}

// ============================================
// Main Optimized Movie Page Component
// ============================================

interface OptimizedMoviePageProps {
  movieId: number;
  // Server-side pre-fetched data
  initialDetails?: MovieDetails;
  initialCredits?: Credits;
  initialTrailer?: string | null;
  initialProviders?: WatchProviderCountry | null;
}

export function OptimizedMoviePage({
  movieId,
  initialDetails,
  initialCredits,
  initialTrailer,
  initialProviders,
}: OptimizedMoviePageProps) {
  const [details, setDetails] = useState<MovieDetails | null>(initialDetails || null);
  const [credits, setCredits] = useState<Credits | null>(initialCredits || null);
  const [trailer, setTrailer] = useState<string | null>(initialTrailer || null);
  const [providers, setProviders] = useState<WatchProviderCountry | null>(initialProviders || null);
  const [isLoading, setIsLoading] = useState(!initialDetails);
  const [error, setError] = useState<string | null>(null);

  // Cache initial data on mount
  useEffect(() => {
    if (initialDetails) {
      updateMovieCache(movieId, { details: initialDetails });
    }
    if (initialCredits) {
      updateMovieCache(movieId, { credits: initialCredits });
    }
  }, [movieId, initialDetails, initialCredits]);

  // Load from cache or fetch if no initial data
  useEffect(() => {
    if (initialDetails) return; // Already have server data

    const loadFromCacheOrFetch = async () => {
      const cached = getMovieCache(movieId);

      // Use cached data immediately
      if (cached.data?.details) {
        setDetails(cached.data.details);
        setIsLoading(false);
      }
      if (cached.data?.credits) {
        setCredits(cached.data.credits);
      }
      if (cached.data?.videos) {
        const mainTrailer = getMainTrailer(cached.data.videos);
        setTrailer(mainTrailer);
      }
      if (cached.data?.providers) {
        const watchProviders = cached.data.providers.results?.US || 
          cached.data.providers.results?.IN || 
          Object.values(cached.data.providers.results || {})[0] || null;
        setProviders(watchProviders);
      }

      // If stale or missing, revalidate in background
      if (!cached.hasDetails || cached.isStale) {
        try {
          const { getMovieDetails, getMovieCredits, getMovieVideos, getMovieWatchProviders } = await import('@/lib/tmdb/api');
          
          // Fetch essential data first
          const detailsData = await getMovieDetails(movieId);
          setDetails(detailsData);
          updateMovieCache(movieId, { details: detailsData });
          setIsLoading(false);

          // Fetch secondary data in parallel
          const [creditsData, videosData, providersData] = await Promise.all([
            getMovieCredits(movieId),
            getMovieVideos(movieId),
            getMovieWatchProviders(movieId),
          ]);

          setCredits(creditsData);
          updateMovieCache(movieId, { credits: creditsData });

          const mainTrailer = getMainTrailer(videosData);
          setTrailer(mainTrailer);
          updateMovieCache(movieId, { videos: videosData });

          const watchProviders = providersData.results?.US || 
            providersData.results?.IN || 
            Object.values(providersData.results || {})[0] || null;
          setProviders(watchProviders);
          updateMovieCache(movieId, { providers: providersData });
        } catch (err) {
          console.error('Failed to fetch movie details:', err);
          if (!details) {
            setError('Failed to load movie details');
          }
          setIsLoading(false);
        }
      }
    };

    loadFromCacheOrFetch();
  }, [movieId, initialDetails, details]);

  const director = useMemo(() => 
    credits?.crew.find((c) => c.job === 'Director'),
    [credits]
  );

  if (isLoading) {
    return <MovieDetailsLoadingSkeleton />;
  }

  if (error || !details) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
          <p className="text-gray-400">{error || 'Movie not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Phase 1: Essential content renders immediately */}
      <EssentialContent 
        details={details} 
        director={director} 
        trailer={trailer}
      />

      {/* Phase 2: Deferred content loads progressively */}
      <DeferredContent
        movieId={movieId}
        credits={credits || undefined}
        trailer={trailer}
        providers={providers}
        movieTitle={details.title}
      />

      {/* Phase 3: Related content loads last */}
      <RelatedContent movieId={movieId} />
    </div>
  );
}

// Loading skeleton for initial load
function MovieDetailsLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-dark-950 animate-pulse">
      {/* Hero skeleton */}
      <div className="h-[50vh] min-h-[400px] bg-dark-900" />
      
      <div className="relative -mt-64 container mx-auto px-4 md:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Poster skeleton */}
          <div className="shrink-0">
            <div className="w-64 h-96 rounded-xl bg-dark-800 mx-auto lg:mx-0" />
          </div>
          
          {/* Info skeleton */}
          <div className="flex-1 space-y-4">
            <div className="h-12 w-3/4 bg-dark-800 rounded" />
            <div className="h-6 w-1/2 bg-dark-800 rounded" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 w-20 bg-dark-800 rounded-full" />
              ))}
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-dark-800 rounded" />
              <div className="h-4 w-full bg-dark-800 rounded" />
              <div className="h-4 w-2/3 bg-dark-800 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OptimizedMoviePage;
