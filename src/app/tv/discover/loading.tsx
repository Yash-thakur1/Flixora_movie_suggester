import { Skeleton } from '@/components/ui';

export default function TVDiscoverLoading() {
  return (
    <main className="min-h-screen bg-dark-950 py-24">
      <div className="container mx-auto px-4">
        {/* Title */}
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-96 mb-8" />

        {/* Filters */}
        <div className="mb-8 space-y-6">
          <div>
            <Skeleton className="h-4 w-16 mb-3" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 16 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-24 rounded-full" />
              ))}
            </div>
          </div>
          <div className="flex gap-4">
            <div>
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-10 w-40" />
            </div>
            <div>
              <Skeleton className="h-4 w-12 mb-2" />
              <Skeleton className="h-10 w-28" />
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[2/3] rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
