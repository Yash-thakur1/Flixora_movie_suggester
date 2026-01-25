'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useUIStore } from '@/store';
import { cn } from '@/lib/utils';

/**
 * Trailer Modal Component
 * Full-screen modal with YouTube embed
 */

export function TrailerModal() {
  const { isTrailerModalOpen, currentTrailerKey, currentTrailerTitle, closeTrailerModal } =
    useUIStore();

  // Close on escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeTrailerModal();
      }
    },
    [closeTrailerModal]
  );

  useEffect(() => {
    if (isTrailerModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isTrailerModalOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isTrailerModalOpen && currentTrailerKey && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            onClick={closeTrailerModal}
          />

          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25 }}
            className="relative w-full max-w-5xl z-10"
          >
            {/* Close button */}
            <button
              onClick={closeTrailerModal}
              className={cn(
                'absolute -top-12 right-0 p-2 rounded-full',
                'bg-dark-800/80 text-white hover:bg-dark-700',
                'transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500'
              )}
              aria-label="Close trailer"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Title */}
            {currentTrailerTitle && (
              <h3 className="text-white font-semibold text-lg mb-4 truncate">
                {currentTrailerTitle}
              </h3>
            )}

            {/* Video container */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-dark-900 shadow-2xl">
              <iframe
                src={`https://www.youtube.com/embed/${currentTrailerKey}?autoplay=1&rel=0&modestbranding=1`}
                title={currentTrailerTitle || 'Movie Trailer'}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Inline trailer player for movie details page
 */
interface TrailerPlayerProps {
  videoKey: string;
  title?: string;
  className?: string;
}

export function TrailerPlayer({ videoKey, title, className }: TrailerPlayerProps) {
  return (
    <div className={cn('relative aspect-video rounded-xl overflow-hidden bg-dark-900', className)}>
      <iframe
        src={`https://www.youtube.com/embed/${videoKey}?rel=0&modestbranding=1`}
        title={title || 'Movie Trailer'}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
