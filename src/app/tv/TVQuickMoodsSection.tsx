'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { TV_QUICK_MOODS } from '@/lib/tmdb/config';
import { cn } from '@/lib/utils';

/**
 * TV Quick Moods Section Component (Client-side)
 * Handles the interactive mood selection for TV shows
 */
export function TVQuickMoodsSection() {
  const router = useRouter();

  const handleMoodClick = (moodId: string, genres: readonly number[]) => {
    if (genres.length === 0) {
      // Surprise me - go to discover with random sort
      router.push('/tv/discover?sort=vote_average.desc');
    } else {
      // Navigate to discover with selected genres
      router.push(`/tv/discover?genres=${genres.join(',')}`);
    }
  };

  return (
    <section className="py-8">
      <h2 className="text-xl md:text-2xl font-bold text-white mb-4">
        What are you in the mood for?
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {TV_QUICK_MOODS.map((mood, index) => (
          <motion.button
            key={mood.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleMoodClick(mood.id, mood.genres)}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-xl',
              'bg-dark-800/50 hover:bg-dark-700 border border-dark-700',
              'transition-all duration-200 hover:scale-105 hover:border-primary-500/50',
              'group cursor-pointer'
            )}
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">
              {mood.icon}
            </span>
            <span className="text-sm text-gray-300 group-hover:text-white text-center">
              {mood.label}
            </span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
