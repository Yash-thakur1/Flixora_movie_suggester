'use client';

import Image from 'next/image';
import { ExternalLink, Tv, ShoppingCart, DollarSign, Gift } from 'lucide-react';
import { WatchProvider, WatchProviderCountry } from '@/types/movie';
import { cn } from '@/lib/utils';

/**
 * Watch Providers Section
 * Displays streaming platforms where a movie is available
 */

// Direct URLs for streaming platforms (search/browse URLs)
const PROVIDER_URLS: Record<number, string> = {
  // Subscription Streaming
  8: 'https://www.netflix.com/search?q=', // Netflix
  9: 'https://www.amazon.com/s?k=', // Amazon Prime Video
  337: 'https://www.disneyplus.com/search?q=', // Disney+
  384: 'https://www.max.com/search?q=', // HBO Max
  15: 'https://www.hulu.com/search?q=', // Hulu
  531: 'https://www.paramountplus.com/search/?q=', // Paramount+
  350: 'https://tv.apple.com/search?term=', // Apple TV+
  386: 'https://www.peacocktv.com/watch/search?q=', // Peacock
  283: 'https://www.crunchyroll.com/search?q=', // Crunchyroll
  1899: 'https://www.max.com/search?q=', // Max
  
  // Free Streaming
  257: 'https://www.fubo.tv/search?q=', // fuboTV
  73: 'https://tubitv.com/search/', // Tubi
  300: 'https://pluto.tv/search/details/', // Pluto TV
  
  // Rent/Buy
  2: 'https://tv.apple.com/search?term=', // Apple TV
  3: 'https://play.google.com/store/search?q=', // Google Play Movies
  7: 'https://www.vudu.com/content/movies/search?searchString=', // Vudu
  10: 'https://www.amazon.com/s?k=', // Amazon Video
  192: 'https://www.youtube.com/results?search_query=', // YouTube
  
  // India
  119: 'https://www.primevideo.com/search?phrase=', // Amazon Prime Video (India)
  122: 'https://www.hotstar.com/in/search?q=', // Hotstar
  220: 'https://www.jiocinema.com/search/', // JioCinema
  121: 'https://www.voot.com/search?q=', // Voot
  232: 'https://www.zee5.com/search?q=', // ZEE5
  315: 'https://www.sonyliv.com/search?q=', // SonyLIV
};

// Fallback: Direct website URLs for providers without search
const PROVIDER_HOME_URLS: Record<number, string> = {
  8: 'https://www.netflix.com',
  9: 'https://www.primevideo.com',
  337: 'https://www.disneyplus.com',
  384: 'https://www.max.com',
  15: 'https://www.hulu.com',
  531: 'https://www.paramountplus.com',
  350: 'https://tv.apple.com',
  386: 'https://www.peacocktv.com',
  1899: 'https://www.max.com',
  73: 'https://tubitv.com',
  300: 'https://pluto.tv',
  122: 'https://www.hotstar.com',
  220: 'https://www.jiocinema.com',
  232: 'https://www.zee5.com',
  315: 'https://www.sonyliv.com',
};

function getProviderUrl(providerId: number, movieTitle: string): string {
  const searchUrl = PROVIDER_URLS[providerId];
  if (searchUrl) {
    return `${searchUrl}${encodeURIComponent(movieTitle)}`;
  }
  
  const homeUrl = PROVIDER_HOME_URLS[providerId];
  if (homeUrl) {
    return homeUrl;
  }
  
  // Fallback to Google search for the movie on that platform
  return `https://www.google.com/search?q=${encodeURIComponent(movieTitle + ' watch online')}`;
}

interface WatchProvidersSectionProps {
  providers: WatchProviderCountry | null;
  movieTitle: string;
  className?: string;
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

interface ProviderLogoProps {
  provider: WatchProvider;
  movieTitle: string;
}

function ProviderLogo({ provider, movieTitle }: ProviderLogoProps) {
  const url = getProviderUrl(provider.provider_id, movieTitle);
  
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block"
      title={`Watch on ${provider.provider_name}`}
    >
      <div
        className="relative w-12 h-12 rounded-lg overflow-hidden bg-dark-700 ring-1 ring-dark-600 hover:ring-primary-500 transition-all hover:scale-110 cursor-pointer"
      >
        <Image
          src={`${TMDB_IMAGE_BASE}/w92${provider.logo_path}`}
          alt={provider.provider_name}
          fill
          className="object-cover"
          sizes="48px"
        />
      </div>
      <div className="absolute -bottom-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <ExternalLink className="w-3 h-3 text-primary-400" />
      </div>
      {/* Tooltip */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-dark-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
        {provider.provider_name}
      </div>
    </a>
  );
}

interface ProviderCategoryProps {
  title: string;
  icon: React.ReactNode;
  providers: WatchProvider[];
  badgeColor: string;
  movieTitle: string;
}

function ProviderCategory({ title, icon, providers, badgeColor, movieTitle }: ProviderCategoryProps) {
  if (!providers || providers.length === 0) return null;

  // Sort by display priority
  const sortedProviders = [...providers].sort((a, b) => a.display_priority - b.display_priority);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className={cn('p-1.5 rounded-lg', badgeColor)}>{icon}</span>
        <h4 className="font-medium text-white">{title}</h4>
        <span className="text-xs text-gray-500">({providers.length})</span>
      </div>
      <div className="flex flex-wrap gap-3">
        {sortedProviders.slice(0, 8).map((provider) => (
          <ProviderLogo
            key={provider.provider_id}
            provider={provider}
            movieTitle={movieTitle}
          />
        ))}
      </div>
    </div>
  );
}

export function WatchProvidersSection({
  providers,
  movieTitle,
  className,
}: WatchProvidersSectionProps) {
  if (!providers) {
    return (
      <section className={cn('py-6', className)}>
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Tv className="w-5 h-5 text-primary-500" />
          Where to Watch
        </h3>
        <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-6 text-center">
          <p className="text-gray-400">
            Streaming availability information is not available for this movie in your region.
          </p>
        </div>
      </section>
    );
  }

  const hasAnyProvider =
    (providers.flatrate?.length ?? 0) > 0 ||
    (providers.free?.length ?? 0) > 0 ||
    (providers.ads?.length ?? 0) > 0 ||
    (providers.rent?.length ?? 0) > 0 ||
    (providers.buy?.length ?? 0) > 0;

  if (!hasAnyProvider) {
    return (
      <section className={cn('py-6', className)}>
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Tv className="w-5 h-5 text-primary-500" />
          Where to Watch
        </h3>
        <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-6 text-center">
          <p className="text-gray-400">
            No streaming options available for &ldquo;{movieTitle}&rdquo; in your region.
          </p>
        </div>
      </section>
    );
  }

  // Combine free and ads providers
  const freeProviders = [...(providers.free || []), ...(providers.ads || [])];
  // Remove duplicates
  const uniqueFreeProviders = freeProviders.filter(
    (provider, index, self) =>
      index === self.findIndex((p) => p.provider_id === provider.provider_id)
  );

  return (
    <section className={cn('py-6', className)}>
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Tv className="w-5 h-5 text-primary-500" />
        Where to Watch
      </h3>

      <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-6 space-y-6">
        {/* Subscription / Streaming */}
        <ProviderCategory
          title="Stream"
          icon={<Tv className="w-4 h-4 text-blue-400" />}
          providers={providers.flatrate || []}
          badgeColor="bg-blue-500/20"
          movieTitle={movieTitle}
        />

        {/* Free */}
        <ProviderCategory
          title="Free"
          icon={<Gift className="w-4 h-4 text-green-400" />}
          providers={uniqueFreeProviders}
          badgeColor="bg-green-500/20"
          movieTitle={movieTitle}
        />

        {/* Rent */}
        <ProviderCategory
          title="Rent"
          icon={<DollarSign className="w-4 h-4 text-yellow-400" />}
          providers={providers.rent || []}
          badgeColor="bg-yellow-500/20"
          movieTitle={movieTitle}
        />

        {/* Buy */}
        <ProviderCategory
          title="Buy"
          icon={<ShoppingCart className="w-4 h-4 text-purple-400" />}
          providers={providers.buy || []}
          badgeColor="bg-purple-500/20"
          movieTitle={movieTitle}
        />

        {/* Click hint */}
        <p className="text-xs text-gray-500 pt-2 border-t border-dark-700">
          Click on any platform to watch directly
        </p>
      </div>
    </section>
  );
}

export default WatchProvidersSection;
