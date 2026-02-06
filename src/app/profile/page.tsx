'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useWatchlistStore, usePreferencesStore } from '@/store';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl, GENRES, TV_GENRES } from '@/lib/tmdb/config';
import { cn } from '@/lib/utils';
import {
  User, Mail, Calendar, Film, Tv, Heart, ThumbsDown,
  Clock, Star, Trash2, BookmarkCheck, TrendingUp, Sparkles, LogOut,
} from 'lucide-react';

// ============================================
// Genre name helper
// ============================================

function getGenreName(id: number): string {
  const all = [...GENRES, ...TV_GENRES];
  return all.find(g => g.id === id)?.name || `Genre ${id}`;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', hi: 'Hindi', ko: 'Korean', ja: 'Japanese', es: 'Spanish',
  fr: 'French', de: 'German', it: 'Italian', pt: 'Portuguese', zh: 'Chinese',
  ru: 'Russian', ar: 'Arabic', tr: 'Turkish', th: 'Thai', ta: 'Tamil',
  te: 'Telugu', ml: 'Malayalam', bn: 'Bengali', pl: 'Polish', nl: 'Dutch',
  sv: 'Swedish', da: 'Danish', no: 'Norwegian', fi: 'Finnish', id: 'Indonesian',
};

// ============================================
// Profile Page
// ============================================

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const watchlistItems = useWatchlistStore(s => s.items);
  const watchlistTVItems = useWatchlistStore(s => s.tvItems);
  const preferences = usePreferencesStore(s => s.preferences);
  const { stats, history, clearHistory } = useWatchHistory();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?callbackUrl=/profile');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const memberSince = user.id ? new Date().toLocaleDateString('en-US', { 
    month: 'long', year: 'numeric' 
  }) : 'Unknown';

  return (
    <div className="min-h-screen pb-16">
      <div className="container mx-auto px-4 md:px-8 py-8 max-w-5xl">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden mb-8"
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600/30 via-dark-900 to-dark-950" />
          
          <div className="relative px-6 py-10 md:px-10 md:py-14 flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || 'User'}
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full border-4 border-primary-500/50 shadow-xl"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center border-4 border-primary-500/50 shadow-xl">
                  <span className="text-3xl font-bold text-white">
                    {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full border-2 border-dark-950" />
            </div>

            {/* User info */}
            <div className="text-center md:text-left flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {user.name || 'Movie Enthusiast'}
              </h1>
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mt-2 text-gray-400 text-sm">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Member since {memberSince}
                </span>
              </div>
            </div>

            {/* Sign out button */}
            <button
              onClick={() => { logout(); router.push('/'); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-800/80 text-gray-300 hover:text-red-400 hover:bg-dark-700 transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <StatCard
            icon={<Film className="w-5 h-5" />}
            label="Movies Viewed"
            value={stats.movieCount}
            color="text-blue-400"
          />
          <StatCard
            icon={<Tv className="w-5 h-5" />}
            label="TV Shows Viewed"
            value={stats.tvCount}
            color="text-purple-400"
          />
          <StatCard
            icon={<BookmarkCheck className="w-5 h-5" />}
            label="Watchlist"
            value={watchlistItems.length + watchlistTVItems.length}
            color="text-green-400"
          />
          <StatCard
            icon={<Star className="w-5 h-5" />}
            label="Avg Rating"
            value={stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '—'}
            color="text-yellow-400"
          />
        </motion.div>

        {/* Two column layout on desktop */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Top Genres */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-dark-900/50 border border-dark-800 rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-400" />
              Top Genres
            </h2>
            {stats.topGenres.length > 0 ? (
              <div className="space-y-3">
                {stats.topGenres.slice(0, 8).map((genre) => {
                  const maxCount = stats.topGenres[0]?.count || 1;
                  const percentage = Math.round((genre.count / maxCount) * 100);
                  return (
                    <div key={genre.id} className="flex items-center gap-3">
                      <span className="text-sm text-gray-300 w-28 truncate">
                        {getGenreName(genre.id)}
                      </span>
                      <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">{genre.count}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Start watching to see your top genres!</p>
            )}
          </motion.section>

          {/* Preferences */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-dark-900/50 border border-dark-800 rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-400" />
              Your Preferences
            </h2>
            <div className="space-y-4">
              <PreferenceRow
                label="Genres"
                value={preferences.genres.length > 0 
                  ? preferences.genres.map(id => getGenreName(id)).join(', ')
                  : 'None set'}
              />
              <PreferenceRow
                label="Mood"
                value={preferences.mood || 'Any mood'}
              />
              <PreferenceRow
                label="Era"
                value={preferences.era || 'Any era'}
              />
              <PreferenceRow
                label="Rating"
                value={preferences.ratingPreference === 'any' ? 'Any rating' : preferences.ratingPreference}
              />
              <PreferenceRow
                label="Languages"
                value={
                  stats.topLanguages.length > 0
                    ? stats.topLanguages.slice(0, 3).map(l => LANGUAGE_NAMES[l.code] || l.code).join(', ')
                    : 'Multi-language'
                }
              />
            </div>
            <Link
              href="/recommendations"
              className="mt-4 inline-flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Get personalized recommendations →
            </Link>
          </motion.section>
        </div>

        {/* Watch History */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-dark-900/50 border border-dark-800 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-400" />
              Watch History
            </h2>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>

          {history.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {history.slice(0, 16).map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={item.type === 'movie' ? `/movie/${item.id}` : `/tv/${item.id}`}
                  className="group"
                >
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-dark-700">
                    {item.posterPath ? (
                      <Image
                        src={getImageUrl(item.posterPath, 'w185')}
                        alt={item.title}
                        fill
                        sizes="120px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="w-6 h-6 text-gray-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="mt-1.5 text-xs text-gray-400 truncate group-hover:text-white transition-colors">
                    {item.title}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Film className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                Your watch history will appear here as you explore movies and shows.
              </p>
              <Link
                href="/discover"
                className="mt-3 inline-flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors"
              >
                Start discovering →
              </Link>
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
}

// ============================================
// Sub-components
// ============================================

function StatCard({ icon, label, value, color }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | number; 
  color: string;
}) {
  return (
    <div className="bg-dark-900/50 border border-dark-800 rounded-xl p-4 text-center">
      <div className={cn('flex items-center justify-center mb-2', color)}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function PreferenceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm text-gray-200 max-w-[60%] text-right truncate">{value}</span>
    </div>
  );
}
