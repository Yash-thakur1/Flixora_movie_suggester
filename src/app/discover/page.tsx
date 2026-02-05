import { Suspense } from 'react';
import type { Metadata } from 'next';
import { discoverMovies } from '@/lib/tmdb';
import { CompactPosterGrid } from '@/components/movies';
import { MovieGridSkeleton } from '@/components/ui';
import { DiscoverFilters } from './DiscoverFilters';

export const metadata: Metadata = {
  title: 'Discover Movies',
  description: 'Browse and discover movies by genre, year, rating, and more.',
};

interface DiscoverPageProps {
  searchParams: {
    genre?: string;
    year?: string;
    sort?: string;
    page?: string;
  };
}

async function DiscoverContent({ searchParams }: DiscoverPageProps) {
  const page = parseInt(searchParams.page || '1');
  const genreIds = searchParams.genre?.split(',').map(Number).filter(Boolean) || [];
  const year = searchParams.year ? parseInt(searchParams.year) : undefined;
  const sortBy = (searchParams.sort as string) || '';

  const movies = await discoverMovies({
    page,
    with_genres: genreIds.length > 0 ? genreIds.join(',') : undefined,
    primary_release_year: year,
    ...(sortBy ? { sort_by: sortBy as any } : {}),
    'vote_count.gte': 50,
  });

  return (
    <>
      <div className="mb-4">
        <p className="text-sm text-gray-400">
          Found {movies.total_results.toLocaleString()} movies
        </p>
      </div>

      <CompactPosterGrid movies={movies.results} />

      {/* Pagination */}
      {movies.total_pages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {page > 1 && (
            <a
              href={`/discover?${new URLSearchParams({
                ...searchParams,
                page: String(page - 1),
              })}`}
              className="px-4 py-2 bg-dark-800 text-white rounded-lg hover:bg-dark-700 transition-colors"
            >
              Previous
            </a>
          )}
          <span className="px-4 py-2 text-gray-400">
            Page {page} of {Math.min(movies.total_pages, 500)}
          </span>
          {page < Math.min(movies.total_pages, 500) && (
            <a
              href={`/discover?${new URLSearchParams({
                ...searchParams,
                page: String(page + 1),
              })}`}
              className="px-4 py-2 bg-dark-800 text-white rounded-lg hover:bg-dark-700 transition-colors"
            >
              Next
            </a>
          )}
        </div>
      )}
    </>
  );
}

export default function DiscoverPage({ searchParams }: DiscoverPageProps) {
  return (
    <div className="container mx-auto px-4 md:px-8 py-4 md:py-6">
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-1">
          🎬 Discover Movies
        </h1>
        <p className="text-sm text-gray-400">
          Browse through thousands of movies and find your next favorite
        </p>
      </div>

      {/* Filters */}
      <DiscoverFilters />

      {/* Results */}
      <Suspense fallback={<MovieGridSkeleton />}>
        <DiscoverContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
