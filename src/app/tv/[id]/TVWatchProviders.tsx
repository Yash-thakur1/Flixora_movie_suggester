'use client';

import Image from 'next/image';
import { ExternalLink, Tv, ShoppingCart, DollarSign, Gift } from 'lucide-react';
import { WatchProvider, WatchProviderCountry } from '@/types/movie';
import { cn } from '@/lib/utils';

/**
 * TV Watch Providers Section
 * Displays streaming platforms where a TV show is available
 */

// Direct URLs for streaming platforms (search/browse URLs)
const PROVIDER_URLS: Record<number, string> = {
  8: 'https://www.netflix.com/search?q=',
  9: 'https://www.amazon.com/s?k=',
  337: 'https://www.disneyplus.com/search?q=',
  384: 'https://www.max.com/search?q=',
  15: 'https://www.hulu.com/search?q=',
  531: 'https://www.paramountplus.com/search/?q=',
  350: 'https://tv.apple.com/search?term=',
  386: 'https://www.peacocktv.com/watch/search?q=',
  283: 'https://www.crunchyroll.com/search?q=',
  1899: 'https://www.max.com/search?q=',
  257: 'https://www.fubo.tv/search?q=',
  73: 'https://tubitv.com/search/',
  300: 'https://pluto.tv/search/details/',
  2: 'https://tv.apple.com/search?term=',
  3: 'https://play.google.com/store/search?q=',
  119: 'https://www.primevideo.com/search?phrase=',
  122: 'https://www.hotstar.com/in/search?q=',
  220: 'https://www.jiocinema.com/search/',
  232: 'https://www.zee5.com/search?q=',
  315: 'https://www.sonyliv.com/search?q=',
};

const PROVIDER_HOME_URLS: Record<number, string> = {
  8: 'https://www.netflix.com',
  9: 'https://www.primevideo.com',
  337: 'https://www.disneyplus.com',
  384: 'https://www.max.com',
  15: 'https://www.hulu.com',
  122: 'https://www.hotstar.com',
  220: 'https://www.jiocinema.com',
};

function getProviderUrl(providerId: number, showTitle: string): string {
  const searchUrl = PROVIDER_URLS[providerId];
  if (searchUrl) {
    return `${searchUrl}${encodeURIComponent(showTitle)}`;
  }
  const homeUrl = PROVIDER_HOME_URLS[providerId];
  if (homeUrl) {
    return homeUrl;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(showTitle + ' watch online')}`;
}

interface TVWatchProvidersSectionProps {
  providers: WatchProviderCountry | null;
  showTitle: string;
  className?: string;
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

interface ProviderLogoProps {
  provider: WatchProvider;
  showTitle: string;
}

function ProviderLogo({ provider, showTitle }: ProviderLogoProps) {
  const url = getProviderUrl(provider.provider_id, showTitle);
  
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block"
      title={`Watch on ${provider.provider_name}`}
    >
      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-dark-700 ring-1 ring-dark-600 hover:ring-primary-500 transition-all hover:scale-110 cursor-pointer">
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
  showTitle: string;
}

function ProviderCategory({ title, icon, providers, badgeColor, showTitle }: ProviderCategoryProps) {
  if (!providers || providers.length === 0) return null;

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
          <ProviderLogo key={provider.provider_id} provider={provider} showTitle={showTitle} />
        ))}
      </div>
    </div>
  );
}

export function TVWatchProvidersSection({ providers, showTitle, className }: TVWatchProvidersSectionProps) {
  if (!providers) return null;

  const hasProviders = providers.flatrate?.length || providers.rent?.length || 
                       providers.buy?.length || providers.free?.length || providers.ads?.length;

  if (!hasProviders) return null;

  const freeProviders = [...(providers.free || []), ...(providers.ads || [])];

  return (
    <section className={cn('mt-12', className)}>
      <h2 className="text-2xl font-bold text-white mb-6">📺 Where to Watch</h2>
      
      <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <ProviderCategory
            title="Stream"
            icon={<Tv className="w-4 h-4 text-green-400" />}
            providers={providers.flatrate || []}
            badgeColor="bg-green-500/20"
            showTitle={showTitle}
          />
          
          {freeProviders.length > 0 && (
            <ProviderCategory
              title="Free"
              icon={<Gift className="w-4 h-4 text-purple-400" />}
              providers={freeProviders}
              badgeColor="bg-purple-500/20"
              showTitle={showTitle}
            />
          )}
          
          <ProviderCategory
            title="Rent"
            icon={<DollarSign className="w-4 h-4 text-yellow-400" />}
            providers={providers.rent || []}
            badgeColor="bg-yellow-500/20"
            showTitle={showTitle}
          />
          
          <ProviderCategory
            title="Buy"
            icon={<ShoppingCart className="w-4 h-4 text-blue-400" />}
            providers={providers.buy || []}
            badgeColor="bg-blue-500/20"
            showTitle={showTitle}
          />
        </div>
      </div>
    </section>
  );
}
