'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { TV_GENRES, TV_SORT_OPTIONS } from '@/lib/tmdb';
import { DropdownSelect, DropdownOption } from '@/components/ui/DropdownSelect';

const genreOptions: DropdownOption[] = TV_GENRES.map((g) => ({
  value: g.id,
  label: g.name,
  icon: g.icon,
}));

const sortOptions: DropdownOption[] = TV_SORT_OPTIONS.map((s) => ({
  value: s.value,
  label: s.label,
}));

export function TVDiscoverFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentGenres = searchParams.get('genres')?.split(',').map(Number) || [];
  const currentSort = searchParams.get('sort') || '';
  const currentYear = searchParams.get('year') || '';

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    router.push(`/tv/discover?${params.toString()}`);
  };

  const handleGenreChange = (values: (string | number)[]) => {
    updateParams('genres', values.map(Number).join(','));
  };

  const handleSortChange = (value: string | number | null) => {
    updateParams('sort', (value as string) || '');
  };

  const currentYearValue = new Date().getFullYear();
  const yearOptions: DropdownOption[] = [
    { value: '', label: 'All Years' },
    ...Array.from({ length: 50 }, (_, i) => ({
      value: currentYearValue - i,
      label: String(currentYearValue - i),
    })),
  ];

  return (
    <div className="mb-6 flex flex-wrap items-end gap-3">
      <DropdownSelect
        mode="multi"
        options={genreOptions}
        value={currentGenres}
        onChange={handleGenreChange}
        placeholder="All Genres"
        label="Genres"
        className="w-48"
      />

      <DropdownSelect
        options={sortOptions}
        value={currentSort}
        onChange={handleSortChange}
        placeholder="Sort by"
        label="Sort By"
        className="w-44"
      />

      <DropdownSelect
        options={yearOptions}
        value={currentYear ? Number(currentYear) : null}
        onChange={(v) => updateParams('year', v ? String(v) : '')}
        placeholder="All Years"
        label="Year"
        className="w-36"
      />

      {(currentGenres.length > 0 || currentYear) && (
        <button
          onClick={() => router.push('/tv/discover')}
          className="text-sm text-primary-400 hover:text-primary-300 transition-colors pb-1"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
