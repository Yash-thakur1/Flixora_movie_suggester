import { MetadataRoute } from 'next';
import { getTrendingMovies, getPopularMovies, getTopRatedMovies, getTrendingTVShows, getPopularTVShows } from '@/lib/tmdb';

const SITE_URL = 'https://www.bingebuddy.in';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages with priorities
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/discover`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/recommendations`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/watchlist`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/tv`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/tv/discover`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/tv/recommendations`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  // Fetch popular/trending content for dynamic URLs
  let movieUrls: MetadataRoute.Sitemap = [];
  let tvUrls: MetadataRoute.Sitemap = [];

  try {
    const [trending, popular, topRated] = await Promise.all([
      getTrendingMovies('week'),
      getPopularMovies(),
      getTopRatedMovies(),
    ]);

    // Combine and dedupe movie IDs
    const movieIds = new Set<number>();
    [...trending.results, ...popular.results, ...topRated.results].forEach((m) =>
      movieIds.add(m.id)
    );

    movieUrls = Array.from(movieIds).map((id) => ({
      url: `${SITE_URL}/movie/${id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('Sitemap: failed to fetch movies', error);
  }

  try {
    const [trendingTV, popularTV] = await Promise.all([
      getTrendingTVShows('week'),
      getPopularTVShows(),
    ]);

    const tvIds = new Set<number>();
    [...trendingTV.results, ...popularTV.results].forEach((s) => tvIds.add(s.id));

    tvUrls = Array.from(tvIds).map((id) => ({
      url: `${SITE_URL}/tv/${id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error('Sitemap: failed to fetch TV shows', error);
  }

  return [...staticPages, ...movieUrls, ...tvUrls];
}
