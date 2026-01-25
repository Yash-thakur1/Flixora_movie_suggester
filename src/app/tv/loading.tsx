import { HeroSkeleton, MovieGridSkeleton } from '@/components/ui';

export default function TVLoading() {
  return (
    <div className="min-h-screen">
      <HeroSkeleton />
      <div className="container mx-auto px-4 md:px-8 -mt-16 relative z-10">
        <div className="py-8">
          <div className="h-8 w-64 bg-dark-800 rounded-lg animate-pulse mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square bg-dark-800 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
        <MovieGridSkeleton count={12} />
      </div>
    </div>
  );
}
