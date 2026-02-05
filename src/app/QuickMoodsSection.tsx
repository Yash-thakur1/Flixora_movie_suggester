'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QUICK_MOODS } from '@/lib/tmdb/config';
import { DropdownSelect, DropdownOption } from '@/components/ui/DropdownSelect';

/**
 * QuickMoodsSection — dropdown version
 * "How are you feeling today?" with a single compact dropdown
 */

const moodOptions: DropdownOption[] = QUICK_MOODS.map((m) => ({
  value: m.id,
  label: m.label,
  icon: m.icon,
}));

export function QuickMoodsSection() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | number | null>(null);

  const handleChange = (value: string | number | null) => {
    setSelected(value);
    if (!value) return;
    const mood = QUICK_MOODS.find((m) => m.id === value);
    if (!mood) return;

    if (mood.genres.length === 0) {
      router.push('/discover?sort=vote_average.desc');
    } else {
      router.push(`/discover?genre=${mood.genres.join(',')}`);
    }
  };

  return (
    <div className="py-4">
      <DropdownSelect
        options={moodOptions}
        value={selected}
        onChange={handleChange}
        placeholder="😊 How are you feeling today?"
        label="Quick Mood"
        className="max-w-xs"
      />
    </div>
  );
}
