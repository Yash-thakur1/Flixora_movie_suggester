import type { Metadata } from 'next';
import { PreferenceWizard } from '@/components/features';

export const metadata: Metadata = {
  title: 'Get Recommendations',
  description: 'Get personalized movie recommendations based on your preferences.',
};

export default function RecommendationsPage() {
  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">
          ✨ Personalized Recommendations
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          Tell us what you like and we&apos;ll find the perfect movies for you
        </p>
      </div>

      <PreferenceWizard />
    </div>
  );
}
