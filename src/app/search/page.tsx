import { Suspense } from 'react';
import type { Metadata } from 'next';
import { searchMovies } from '@/lib/tmdb';
import { MovieGrid } from '@/components/movies';
import { MovieGridSkeleton } from '@/components/ui';
import { SearchBar } from '@/components/layout';

export const metadata: Metadata = {
  title: 'Search Movies',
  description: 'Search for movies by title.',
};

interface SearchPageProps {
  searchParams: { q?: string; page?: string };
}

async function SearchResults({ query, page }: { query: string; page: number }) {
  if (!query) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-dark-800 flex items-center justify-center">
          <span className="text-4xl">🔍</span>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Search for movies</h2>
        <p className="text-gray-400">Enter a movie title to get started</p>
      </div>
    );
  }

  const results = await searchMovies(query, page);

  if (results.results.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-dark-800 flex items-center justify-center">
          <span className="text-4xl">😕</span>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">No results found</h2>
        <p className="text-gray-400">Try a different search term</p>
      </div>
    );
  }

  return (
    <>
      <p className="text-gray-400 mb-6">
        Found {results.total_results.toLocaleString()} results for &ldquo;{query}&rdquo;
      </p>
      <MovieGrid movies={results.results} />

      {/* Pagination */}
      {results.total_pages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {page > 1 && (
            <a
              href={`/search?q=${encodeURIComponent(query)}&page=${page - 1}`}
              className="px-4 py-2 bg-dark-800 text-white rounded-lg hover:bg-dark-700 transition-colors"
            >
              Previous
            </a>
          )}
          <span className="px-4 py-2 text-gray-400">
            Page {page} of {Math.min(results.total_pages, 500)}
          </span>
          {page < Math.min(results.total_pages, 500) && (
            <a
              href={`/search?q=${encodeURIComponent(query)}&page=${page + 1}`}
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

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || '';
  const page = parseInt(searchParams.page || '1');

  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
          🔍 Search Movies
        </h1>
        <div className="max-w-xl">
          <SearchBar />
        </div>
      </div>

      <Suspense fallback={<MovieGridSkeleton />}>
        <SearchResults query={query} page={page} />
      </Suspense>
    </div>
  );
}
