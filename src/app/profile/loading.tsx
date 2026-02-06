export default function ProfileLoading() {
  return (
    <div className="min-h-screen pb-16">
      <div className="container mx-auto px-4 md:px-8 py-8 max-w-5xl">
        {/* Profile Header Skeleton */}
        <div className="rounded-2xl overflow-hidden mb-8 bg-dark-900/50 border border-dark-800">
          <div className="px-6 py-10 md:px-10 md:py-14 flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-dark-700 animate-pulse" />
            <div className="text-center md:text-left flex-1 space-y-3">
              <div className="h-8 w-48 bg-dark-700 rounded-lg animate-pulse mx-auto md:mx-0" />
              <div className="h-4 w-64 bg-dark-700 rounded animate-pulse mx-auto md:mx-0" />
            </div>
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-dark-900/50 border border-dark-800 rounded-xl p-4 text-center">
              <div className="w-5 h-5 bg-dark-700 rounded mx-auto mb-2 animate-pulse" />
              <div className="h-8 w-12 bg-dark-700 rounded mx-auto mb-1 animate-pulse" />
              <div className="h-3 w-20 bg-dark-700 rounded mx-auto animate-pulse" />
            </div>
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-dark-900/50 border border-dark-800 rounded-2xl p-6 space-y-3">
            <div className="h-5 w-32 bg-dark-700 rounded animate-pulse" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-3 w-20 bg-dark-700 rounded animate-pulse" />
                <div className="flex-1 h-2 bg-dark-700 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
          <div className="bg-dark-900/50 border border-dark-800 rounded-2xl p-6 space-y-4">
            <div className="h-5 w-36 bg-dark-700 rounded animate-pulse" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-20 bg-dark-700 rounded animate-pulse" />
                <div className="h-4 w-28 bg-dark-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
