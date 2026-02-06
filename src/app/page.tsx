import { Suspense } from 'react';
import { getTrendingMovies, getPopularMovies, getTopRatedMovies, getMovieVideos } from '@/lib/tmdb';
import { HeroSection } from '@/components/features';
import { MovieCarousel, CompactPosterSection } from '@/components/movies';
import { HeroSkeleton, MovieGridSkeleton } from '@/components/ui';
import { QuickMoodsSection } from './QuickMoodsSection';
import { FAQSchema } from '@/components/seo';

export const revalidate = 3600; // Revalidate every hour

/**
 * Home Page
 * Main landing page with hero, quick moods, and movie sections
 */

// Fetch all data in parallel for better performance
async function fetchHomePageData() {
  const [trendingDay, trendingWeek, popular, topRated] = await Promise.all([
    getTrendingMovies('day'),
    getTrendingMovies('week'),
    getPopularMovies(),
    getTopRatedMovies(),
  ]);
  
  return { trendingDay, trendingWeek, popular, topRated };
}

async function HeroContent() {
  const trending = await getTrendingMovies('day');
  const featuredMovie = trending.results[0];

  // Get trailer for featured movie
  const videos = await getMovieVideos(featuredMovie.id);
  const trailer = videos.results.find(
    (v) => v.site === 'YouTube' && v.type === 'Trailer'
  );

  return <HeroSection movie={featuredMovie} trailerKey={trailer?.key} />;
}

async function MovieSections() {
  const { trendingWeek, popular, topRated } = await fetchHomePageData();
  
  return (
    <>
      <CompactPosterSection
        title="🔥 Trending This Week"
        description="Most popular movies right now"
        movies={trendingWeek.results.slice(0, 18)}
        viewAllHref="/discover?sort=popularity.desc"
      />
      
      <MovieCarousel
        title="⭐ Popular Movies"
        description="Fan favorites everyone loves"
        movies={popular.results}
      />
      
      <CompactPosterSection
        title="🏆 Top Rated"
        description="Critically acclaimed masterpieces"
        movies={topRated.results.slice(0, 18)}
        viewAllHref="/discover?sort=vote_average.desc"
      />
    </>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Suspense fallback={<HeroSkeleton />}>
        <HeroContent />
      </Suspense>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-8 -mt-16 relative z-10">
        {/* Quick Mood Selection */}
        <QuickMoodsSection />

        {/* All Movie Sections - fetched in parallel */}
        <Suspense fallback={<MovieGridSkeleton count={12} />}>
          <MovieSections />
        </Suspense>

        {/* Internal Navigation Links */}
        <section className="py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <a href="/discover" className="group flex items-center gap-3 p-4 rounded-xl bg-dark-900/60 border border-dark-800 hover:border-primary-600/30 transition-colors">
              <span className="text-2xl">🎬</span>
              <div>
                <p className="text-white text-sm font-medium group-hover:text-primary-400 transition-colors">Discover Movies</p>
                <p className="text-gray-500 text-xs">Browse by genre & year</p>
              </div>
            </a>
            <a href="/tv" className="group flex items-center gap-3 p-4 rounded-xl bg-dark-900/60 border border-dark-800 hover:border-primary-600/30 transition-colors">
              <span className="text-2xl">📺</span>
              <div>
                <p className="text-white text-sm font-medium group-hover:text-primary-400 transition-colors">TV Series</p>
                <p className="text-gray-500 text-xs">Trending & top rated shows</p>
              </div>
            </a>
            <a href="/recommendations" className="group flex items-center gap-3 p-4 rounded-xl bg-dark-900/60 border border-dark-800 hover:border-primary-600/30 transition-colors">
              <span className="text-2xl">✨</span>
              <div>
                <p className="text-white text-sm font-medium group-hover:text-primary-400 transition-colors">AI Picks</p>
                <p className="text-gray-500 text-xs">Personalized for you</p>
              </div>
            </a>
            <a href="/watchlist" className="group flex items-center gap-3 p-4 rounded-xl bg-dark-900/60 border border-dark-800 hover:border-primary-600/30 transition-colors">
              <span className="text-2xl">🔖</span>
              <div>
                <p className="text-white text-sm font-medium group-hover:text-primary-400 transition-colors">Watchlist</p>
                <p className="text-gray-500 text-xs">Save for later</p>
              </div>
            </a>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Can&apos;t decide what to watch?
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Let our AI recommendation engine find the perfect movie based on your mood, favorite genres, and viewing history.
          </p>
          <a
            href="/recommendations"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-full transition-all duration-200 shadow-glow"
          >
            ✨ Get Personalized Recommendations
          </a>
        </section>

        {/* SEO Content Section — crawlable by search engines */}
        <section className="py-8 border-t border-dark-800/50">
          <h2 className="text-lg font-semibold text-white mb-3">About BingeBuddy</h2>
          <div className="text-sm text-gray-500 space-y-2 max-w-3xl">
            <p>
              BingeBuddy is a free AI-powered movie and TV show discovery platform. Browse trending films,
              explore top-rated series, and get personalized recommendations based on your mood and genre preferences.
            </p>
            <p>
              Search any movie or TV show to find ratings, trailers, cast information, and where to stream.
              Build your watchlist and never run out of things to watch.
            </p>
          </div>
        </section>

        {/* FAQ structured data for rich snippets */}
        <FAQSchema
          questions={[
            {
              question: 'How does BingeBuddy recommend movies?',
              answer: 'BingeBuddy uses AI to analyze your mood, genre preferences, and viewing history to suggest movies and TV shows tailored to your taste.',
            },
            {
              question: 'Is BingeBuddy free to use?',
              answer: 'Yes, BingeBuddy is completely free. Browse trending movies, get AI recommendations, and build your watchlist at no cost.',
            },
            {
              question: 'Can I find where to stream a movie?',
              answer: 'Yes, each movie and TV show page shows available streaming platforms so you know exactly where to watch.',
            },
          ]}
        />
      </div>
    </div>
  );
}
