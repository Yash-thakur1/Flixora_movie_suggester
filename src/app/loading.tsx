import { HeroSkeleton, MovieGridSkeleton } from '@/components/ui';

export default function Loading() {
  return (
    <div className="min-h-screen">
      <HeroSkeleton />
      <div className="container mx-auto px-4 md:px-8 py-8">
        <MovieGridSkeleton />
      </div>
    </div>
  );
}
