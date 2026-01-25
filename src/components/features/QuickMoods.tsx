'use client';

import { motion } from 'framer-motion';
import { QUICK_MOODS } from '@/lib/tmdb';
import { cn } from '@/lib/utils';

/**
 * Quick Mood Buttons
 * One-click suggestions like "I feel bored", "Surprise me"
 */

interface QuickMoodButtonsProps {
  onSelectMood: (moodId: string, genres: readonly number[]) => void;
  selectedMood?: string | null;
  className?: string;
}

export function QuickMoodButtons({
  onSelectMood,
  selectedMood,
  className,
}: QuickMoodButtonsProps) {
  return (
    <section className={cn('py-8', className)}>
      <h2 className="text-xl md:text-2xl font-bold text-white mb-4">
        How are you feeling today?
      </h2>
      <div className="flex flex-wrap gap-3">
        {QUICK_MOODS.map((mood, index) => (
          <motion.button
            key={mood.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelectMood(mood.id, mood.genres)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-full',
              'border transition-all duration-200',
              'hover:scale-105 active:scale-95',
              selectedMood === mood.id
                ? 'bg-primary-600 border-primary-500 text-white shadow-glow'
                : 'bg-dark-800 border-dark-600 text-gray-300 hover:border-primary-500 hover:text-white'
            )}
          >
            <span className="text-lg">{mood.icon}</span>
            <span className="font-medium">{mood.label}</span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}

/**
 * Compact mood selector for sidebar/filters
 */
export function MoodSelector({
  selected,
  onSelect,
  className,
}: {
  selected: string | null;
  onSelect: (moodId: string | null) => void;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium text-gray-400">Mood</label>
      <div className="grid grid-cols-2 gap-2">
        {QUICK_MOODS.slice(0, 6).map((mood) => (
          <button
            key={mood.id}
            onClick={() => onSelect(selected === mood.id ? null : mood.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
              'border transition-all duration-200',
              selected === mood.id
                ? 'bg-primary-600/20 border-primary-500 text-primary-400'
                : 'bg-dark-800 border-dark-700 text-gray-400 hover:text-white'
            )}
          >
            <span>{mood.icon}</span>
            <span className="truncate">{mood.label.replace('I ', '').replace(' me', '')}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
