'use client';

import { useRouter } from 'next/navigation';
import { QuickMoodButtons } from '@/components/features';

/**
 * Client wrapper for QuickMoodButtons
 * Handles navigation to discover page with selected mood genres
 */
export function QuickMoodsSection() {
  const router = useRouter();

  const handleSelectMood = (moodId: string, genres: readonly number[]) => {
    if (genres.length === 0) {
      // "Surprise me" - go to random top rated
      router.push('/discover?sort=vote_average.desc');
    } else {
      // Navigate to discover with selected genres
      router.push(`/discover?genre=${genres.join(',')}`);
    }
  };

  return (
    <div className="py-8">
      <h2 className="text-xl md:text-2xl font-bold text-white mb-4">
        How are you feeling today?
      </h2>
      <p className="text-gray-400 mb-6">
        Click a mood to get instant recommendations
      </p>
      <QuickMoodButtons onSelectMood={handleSelectMood} />
    </div>
  );
}
