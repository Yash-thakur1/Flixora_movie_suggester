import { MovieGridSkeleton } from '@/components/ui';

export default function ResultsLoading() {
  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-4 w-32 bg-dark-700 rounded animate-pulse mb-4" />
        <div className="h-10 w-80 bg-dark-700 rounded animate-pulse mb-2" />
        <div className="h-5 w-64 bg-dark-700 rounded animate-pulse" />
      </div>

      {/* Results skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-5 w-48 bg-dark-700 rounded animate-pulse" />
        <div className="h-9 w-24 bg-dark-700 rounded animate-pulse" />
      </div>
      <MovieGridSkeleton count={12} />
    </div>
  );
}
