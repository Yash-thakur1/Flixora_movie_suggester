'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TV_QUICK_MOODS } from '@/lib/tmdb/config';
import { DropdownSelect, DropdownOption } from '@/components/ui/DropdownSelect';

/**
 * TVQuickMoodsSection — dropdown version
 * "What are you in the mood for?" with a single compact dropdown
 */

const moodOptions: DropdownOption[] = TV_QUICK_MOODS.map((m) => ({
  value: m.id,
  label: m.label,
  icon: m.icon,
}));

export function TVQuickMoodsSection() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | number | null>(null);

  const handleChange = (value: string | number | null) => {
    setSelected(value);
    if (!value) return;
    const mood = TV_QUICK_MOODS.find((m) => m.id === value);
    if (!mood) return;

    if (mood.genres.length === 0) {
      router.push('/tv/discover?sort=vote_average.desc');
    } else {
      router.push(`/tv/discover?genres=${mood.genres.join(',')}`);
    }
  };

  return (
    <div className="py-4">
      <DropdownSelect
        options={moodOptions}
        value={selected}
        onChange={handleChange}
        placeholder="📺 What are you in the mood for?"
        label="Quick Mood"
        className="max-w-xs"
      />
    </div>
  );
}
