'use client';

import { cn } from '@/lib/utils';

/**
 * Skeleton loader component for loading states
 * Provides smooth shimmer animation
 */

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-shimmer bg-gradient-to-r from-dark-800 via-dark-700 to-dark-800 bg-[length:200%_100%]',
        className
      )}
    />
  );
}

/**
 * Movie card skeleton loader
 */
export function MovieCardSkeleton() {
  return (
    <div className="group relative overflow-hidden rounded-xl bg-dark-800">
      {/* Poster skeleton */}
      <Skeleton className="aspect-[2/3] w-full rounded-xl" />
      
      {/* Content skeleton */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-dark-950 to-transparent">
        <Skeleton className="h-5 w-3/4 rounded mb-2" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * Movie grid skeleton (multiple cards)
 */
export function MovieGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Hero section skeleton
 */
export function HeroSkeleton() {
  return (
    <div className="relative h-[70vh] min-h-[500px] w-full">
      <Skeleton className="absolute inset-0" />
      <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
        <Skeleton className="h-12 w-2/3 max-w-xl rounded mb-4" />
        <Skeleton className="h-6 w-1/2 max-w-md rounded mb-6" />
        <div className="flex gap-4">
          <Skeleton className="h-12 w-32 rounded-full" />
          <Skeleton className="h-12 w-40 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Cast card skeleton
 */
export function CastCardSkeleton() {
  return (
    <div className="flex flex-col items-center">
      <Skeleton className="w-24 h-24 rounded-full mb-3" />
      <Skeleton className="h-4 w-20 rounded mb-1" />
      <Skeleton className="h-3 w-16 rounded" />
    </div>
  );
}

/**
 * Movie details skeleton
 */
export function MovieDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-dark-950">
      {/* Hero backdrop skeleton */}
      <div className="relative h-[60vh] min-h-[400px]">
        <Skeleton className="absolute inset-0" />
        <div className="absolute inset-0 bg-hero-gradient" />
      </div>
      
      {/* Content skeleton */}
      <div className="relative -mt-40 px-4 md:px-8 lg:px-16 pb-16">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster skeleton */}
          <Skeleton className="w-64 h-96 rounded-xl shrink-0" />
          
          {/* Info skeleton */}
          <div className="flex-1 space-y-4">
            <Skeleton className="h-10 w-3/4 rounded" />
            <Skeleton className="h-6 w-1/2 rounded" />
            <div className="flex gap-3">
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-2/3 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Search result skeleton
 */
export function SearchResultSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton className="w-12 h-18 rounded shrink-0" />
      <div className="flex-1">
        <Skeleton className="h-4 w-3/4 rounded mb-2" />
        <Skeleton className="h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}
