import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';
import {
  getMovieDetails,
  getMovieCredits,
  getMovieVideos,
  getMovieWatchProviders,
  getSimilarMovies,
  getMovieRecommendations,
  getImageUrl,
  formatRuntime,
  formatDate,
  getMainTrailer,
} from '@/lib/tmdb';
import { RatingBadge, Badge, MovieDetailsSkeleton } from '@/components/ui';
import { CastSection, CrewSection, TrailerPlayer, MovieCarousel, WatchProvidersSection } from '@/components/movies';
import { MovieDetailsActions } from './MovieDetailsActions';
import { cn } from '@/lib/utils';
import { WatchProviderCountry, Credits, Cast, Crew } from '@/types/movie';

interface MoviePageProps {
  params: { id: string };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: MoviePageProps): Promise<Metadata> {
  try {
    const movie = await getMovieDetails(parseInt(params.id));
    return {
      title: `${movie.title} (${new Date(movie.release_date).getFullYear()})`,
      description: movie.overview,
      openGraph: {
        title: movie.title,
        description: movie.overview,
        images: [getImageUrl(movie.poster_path, 'w500')],
      },
    };
  } catch {
    return { title: 'Movie Not Found' };
  }
}

async function MovieContent({ id }: { id: number }) {
  // Fetch movie details first (required)
  const details = await getMovieDetails(id);
  
  // Fetch optional data with error handling
  let credits: Credits = { id, cast: [] as Cast[], crew: [] as Crew[] };
  let trailer: string | null = null;
  let watchProviders: WatchProviderCountry | null = null;
  
  try {
    const [creditsResult, videos, providers] = await Promise.all([
      getMovieCredits(id),
      getMovieVideos(id),
      getMovieWatchProviders(id),
    ]);
    credits = creditsResult;
    trailer = getMainTrailer(videos);
    // Get US providers by default, fallback to first available country
    watchProviders = providers.results?.US || providers.results?.IN || 
      Object.values(providers.results || {})[0] || null;
  } catch (error) {
    console.error('Error loading credits/videos/providers:', error);
  }

  const director = credits.crew.find((c) => c.job === 'Director');

  return (
    <>
      {/* Hero Backdrop */}
      <div className="relative h-[50vh] min-h-[400px] w-full overflow-hidden">
        <Image
          src={getImageUrl(details.backdrop_path, 'original')}
          alt={details.title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/50 to-dark-950/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-dark-950 via-transparent to-transparent" />
      </div>

      {/* Main Content */}
      <div className="relative -mt-64 container mx-auto px-4 md:px-8 pb-16">
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
              trailerKey={trailer}
            />
          </div>
        </div>

        {/* Where to Watch Section */}
        <WatchProvidersSection providers={watchProviders} movieTitle={details.title} />

        {/* Trailer Section */}
        {trailer && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-4">🎬 Trailer</h2>
            <TrailerPlayer videoKey={trailer} title={details.title} className="max-w-4xl" />
          </section>
        )}

        {/* Cast */}
        <CastSection cast={credits.cast} />

        {/* Crew */}
        <CrewSection crew={credits.crew} />
      </div>
    </>
  );
}

async function SimilarMoviesSection({ id }: { id: number }) {
  try {
    const [similar, recommendations] = await Promise.all([
      getSimilarMovies(id),
      getMovieRecommendations(id),
    ]);

    const hasContent = recommendations.results.length > 0 || similar.results.length > 0;
    
    if (!hasContent) return null;

    return (
      <div className="container mx-auto px-4 md:px-8 pb-16">
        {recommendations.results.length > 0 && (
          <MovieCarousel
            title="🎯 Recommended For You"
            description="Based on this movie"
            movies={recommendations.results}
          />
        )}
        {similar.results.length > 0 && (
          <MovieCarousel
            title="🎬 Similar Movies"
            description="Movies like this one"
            movies={similar.results}
          />
        )}
      </div>
    );
  } catch (error) {
    console.error('Error loading similar movies:', error);
    return null; // Gracefully hide section on error
  }
}

export default async function MoviePage({ params }: MoviePageProps) {
  const id = parseInt(params.id);

  if (isNaN(id)) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <Suspense fallback={<MovieDetailsSkeleton />}>
        <MovieContent id={id} />
      </Suspense>

      <Suspense fallback={null}>
        <SimilarMoviesSection id={id} />
      </Suspense>
    </div>
  );
}
