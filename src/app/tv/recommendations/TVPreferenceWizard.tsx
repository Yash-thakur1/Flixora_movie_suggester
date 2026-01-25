'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';
import { TV_GENRES, ERA_PRESETS, LANGUAGES } from '@/lib/tmdb';
import { cn } from '@/lib/utils';

type WizardStep = 'genres' | 'mood' | 'era' | 'language' | 'rating';

const steps: { id: WizardStep; title: string; description: string }[] = [
  { id: 'genres', title: 'Pick your genres', description: 'Select genres you love' },
  { id: 'mood', title: "What's your mood?", description: 'How are you feeling today?' },
  { id: 'era', title: 'Pick an era', description: 'Classic or modern?' },
  { id: 'language', title: 'Language preference', description: 'What languages do you prefer?' },
  { id: 'rating', title: 'Rating preference', description: 'Quality matters!' },
];

const TV_MOODS = [
  { id: 'binge', label: '📺 Binge-worthy', description: 'Can\'t stop watching' },
  { id: 'action', label: '💪 Action-packed', description: 'Thrilling adventures' },
  { id: 'comedy', label: '😂 Comedy', description: 'Make me laugh' },
  { id: 'drama', label: '🎭 Drama', description: 'Deep emotional stories' },
  { id: 'mystery', label: '🔍 Mystery', description: 'Whodunits and puzzles' },
  { id: 'scifi', label: '🚀 Sci-Fi', description: 'Futuristic worlds' },
];

export function TVPreferenceWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedEra, setSelectedEra] = useState<string | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [ratingPreference, setRatingPreference] = useState<'any' | 'high' | 'top'>('any');

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Complete wizard - build query params
      const params = new URLSearchParams();
      
      if (selectedGenres.length > 0) {
        params.set('genres', selectedGenres.join(','));
      }
      
      if (selectedEra && ERA_PRESETS[selectedEra as keyof typeof ERA_PRESETS]) {
        const eraRange = ERA_PRESETS[selectedEra as keyof typeof ERA_PRESETS];
        if (eraRange.from) params.set('year_gte', eraRange.from.toString());
        if (eraRange.to) params.set('year_lte', eraRange.to.toString());
      }
      
      if (selectedLanguages.length > 0) {
        params.set('language', selectedLanguages[0]);
      }
      
      if (ratingPreference === 'high') {
        params.set('vote_gte', '6');
      } else if (ratingPreference === 'top') {
        params.set('vote_gte', '8');
      }
      
      router.push(`/tv/recommendations/results?${params.toString()}`);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const toggleGenre = (genreId: number) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    );
  };

  const toggleLanguage = (langCode: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(langCode)
        ? prev.filter((l) => l !== langCode)
        : [...prev, langCode]
    );
  };

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'genres':
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TV_GENRES.map((genre) => (
              <button
                key={genre.id}
                onClick={() => toggleGenre(genre.id)}
                className={cn(
                  'p-4 rounded-xl border text-center transition-all',
                  selectedGenres.includes(genre.id)
                    ? 'bg-primary-600/20 border-primary-500 text-white'
                    : 'bg-dark-800 border-dark-600 text-gray-300 hover:border-primary-500/50'
                )}
              >
                <span className="text-2xl mb-2 block">{genre.icon}</span>
                <span className="text-sm">{genre.name}</span>
              </button>
            ))}
          </div>
        );

      case 'mood':
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {TV_MOODS.map((mood) => (
              <button
                key={mood.id}
                onClick={() => setSelectedMood(selectedMood === mood.id ? null : mood.id)}
                className={cn(
                  'p-4 rounded-xl border text-center transition-all',
                  selectedMood === mood.id
                    ? 'bg-primary-600/20 border-primary-500 text-white'
                    : 'bg-dark-800 border-dark-600 text-gray-300 hover:border-primary-500/50'
                )}
              >
                <span className="block font-medium">{mood.label}</span>
                <span className="text-xs text-gray-400">{mood.description}</span>
              </button>
            ))}
          </div>
        );

      case 'era':
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(Object.keys(ERA_PRESETS) as Array<keyof typeof ERA_PRESETS>).map((era) => (
              <button
                key={era}
                onClick={() => setSelectedEra(selectedEra === era ? null : era)}
                className={cn(
                  'p-4 rounded-xl border text-center capitalize transition-all',
                  selectedEra === era
                    ? 'bg-primary-600/20 border-primary-500 text-white'
                    : 'bg-dark-800 border-dark-600 text-gray-300 hover:border-primary-500/50'
                )}
              >
                {era === 'latest' ? '🆕 Latest' : era === 'classic' ? '🎬 Classic' : `📅 ${era}`}
              </button>
            ))}
          </div>
        );

      case 'language':
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {LANGUAGES.slice(0, 12).map((lang) => (
              <button
                key={lang.code}
                onClick={() => toggleLanguage(lang.code)}
                className={cn(
                  'p-4 rounded-xl border text-center transition-all',
                  selectedLanguages.includes(lang.code)
                    ? 'bg-primary-600/20 border-primary-500 text-white'
                    : 'bg-dark-800 border-dark-600 text-gray-300 hover:border-primary-500/50'
                )}
              >
                <span className="text-sm font-medium">{lang.name}</span>
              </button>
            ))}
          </div>
        );

      case 'rating':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { id: 'any', label: 'Any Rating', description: 'Show me everything', icon: '🎲' },
              { id: 'high', label: 'Good (6+)', description: 'Well-rated shows', icon: '⭐' },
              { id: 'top', label: 'Top Rated (8+)', description: 'Only the best', icon: '🏆' },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setRatingPreference(option.id as 'any' | 'high' | 'top')}
                className={cn(
                  'p-6 rounded-xl border text-center transition-all',
                  ratingPreference === option.id
                    ? 'bg-primary-600/20 border-primary-500 text-white'
                    : 'bg-dark-800 border-dark-600 text-gray-300 hover:border-primary-500/50'
                )}
              >
                <span className="text-3xl mb-2 block">{option.icon}</span>
                <span className="block font-medium">{option.label}</span>
                <span className="text-xs text-gray-400">{option.description}</span>
              </button>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                'flex-1 h-1 mx-1 rounded-full transition-colors',
                index <= currentStep ? 'bg-primary-500' : 'bg-dark-700'
              )}
            />
          ))}
        </div>
        <p className="text-sm text-gray-400 text-center">
          Step {currentStep + 1} of {steps.length}
        </p>
      </div>

      {/* Step Content */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold text-white mb-2 text-center">
          {steps[currentStep].title}
        </h2>
        <p className="text-gray-400 mb-6 text-center">
          {steps[currentStep].description}
        </p>
        {renderStepContent()}
      </motion.div>

      {/* Navigation */}
      <div className="flex justify-between gap-4">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentStep === 0}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
        <Button onClick={handleNext} className="gap-2">
          {currentStep === steps.length - 1 ? (
            <>
              <Sparkles className="w-4 h-4" />
              Get Recommendations
            </>
          ) : (
            <>
              Next
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
