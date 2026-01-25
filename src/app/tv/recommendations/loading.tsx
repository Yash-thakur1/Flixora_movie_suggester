import { Skeleton } from '@/components/ui';

export default function TVRecommendationsLoading() {
  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      <div className="text-center mb-8">
        <Skeleton className="h-10 w-80 mx-auto mb-2" />
        <Skeleton className="h-5 w-96 mx-auto" />
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="flex-1 h-1 mx-1 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-4 w-24 mx-auto" />
        </div>

        {/* Content */}
        <Skeleton className="h-8 w-48 mx-auto mb-2" />
        <Skeleton className="h-5 w-64 mx-auto mb-6" />
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between gap-4 mt-8">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  );
}
