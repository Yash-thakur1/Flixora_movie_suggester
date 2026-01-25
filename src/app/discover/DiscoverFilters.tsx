'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { GENRES, SORT_OPTIONS } from '@/lib/tmdb';
import { cn } from '@/lib/utils';

export function DiscoverFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentGenres = searchParams.get('genre')?.split(',').map(Number) || [];
  const currentSort = searchParams.get('sort') || 'popularity.desc';
  const currentYear = searchParams.get('year') || '';

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page'); // Reset to page 1 on filter change
    router.push(`/discover?${params.toString()}`);
  };

  const toggleGenre = (genreId: number) => {
    const newGenres = currentGenres.includes(genreId)
      ? currentGenres.filter((id) => id !== genreId)
      : [...currentGenres, genreId];
    updateParams('genre', newGenres.join(','));
  };

  const currentYearValue = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYearValue - i);

  return (
    <div className="mb-8 space-y-6">
      {/* Genre Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3">Genres</h3>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((genre) => (
            <button
              key={genre.id}
              onClick={() => toggleGenre(genre.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                'border hover:scale-105',
                currentGenres.includes(genre.id)
                  ? 'bg-primary-600/20 border-primary-500 text-white'
                  : 'bg-dark-800 border-dark-600 text-gray-400 hover:text-white hover:border-primary-500/50'
              )}
            >
              {genre.icon} {genre.name}
            </button>
          ))}
        </div>
      </div>

      {/* Sort and Year */}
      <div className="flex flex-wrap gap-4">
        {/* Sort */}
        <div>
          <label className="text-sm font-medium text-gray-400 block mb-2">Sort By</label>
          <select
            value={currentSort}
            onChange={(e) => updateParams('sort', e.target.value)}
            className="bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div>
          <label className="text-sm font-medium text-gray-400 block mb-2">Year</label>
          <select
            value={currentYear}
            onChange={(e) => updateParams('year', e.target.value)}
            className="bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Years</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        {(currentGenres.length > 0 || currentYear) && (
          <div className="flex items-end">
            <button
              onClick={() => router.push('/discover')}
              className="px-4 py-2 text-primary-400 hover:text-primary-300 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
