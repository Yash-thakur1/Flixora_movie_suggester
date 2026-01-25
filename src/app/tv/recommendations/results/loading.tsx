import { Skeleton } from '@/components/ui';

export default function TVResultsLoading() {
  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-10 w-80 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Results info */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-9 w-24" />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-[2/3] rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
