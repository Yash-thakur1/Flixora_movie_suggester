'use client';

import { useRef, useState, useEffect, memo } from 'react';
import { Heart, ThumbsDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEngagement, type ReactionType } from '@/hooks/useEngagement';
import { useAuth } from '@/components/providers/AuthProvider';
import { cn } from '@/lib/utils';

// ============================================
// Helpers
// ============================================

/** Compact number: 1200 → "1.2K" */
function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ============================================
// IntersectionObserver hook – subscribe only when visible
// ============================================

function useIsVisible(ref: React.RefObject<HTMLElement | null>): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: '200px' }, // pre-subscribe slightly before scrolling into view
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return visible;
}

// ============================================
// Reaction Button
// ============================================

interface ReactionButtonProps {
  type: ReactionType;
  count: number;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}

const ReactionButton = memo(function ReactionButton({
  type,
  count,
  active,
  disabled,
  onClick,
}: ReactionButtonProps) {
  const isLike = type === 'like';

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      aria-label={
        isLike
          ? active ? 'Remove like' : 'Like'
          : active ? 'Remove dislike' : 'Dislike'
      }
      aria-pressed={active}
      className={cn(
        // Base
        'group relative inline-flex items-center justify-center gap-2',
        'rounded-full px-5 py-2.5 text-sm font-medium',
        // Fixed sizing: 44px min touch target, stable width to prevent layout shift
        'min-h-[44px] min-w-[84px]',
        // Transitions
        'transition-all duration-200 ease-out select-none',
        // Focus ring
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-dark-950',
        // Idle state
        !active && 'bg-dark-800/60 text-gray-400 hover:bg-dark-700 hover:text-white active:bg-dark-600',
        // Active like
        active && isLike && 'bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/40 hover:bg-rose-500/30',
        // Active dislike
        active && !isLike && 'bg-sky-500/20 text-sky-400 ring-1 ring-sky-500/40 hover:bg-sky-500/30',
        // Disabled
        disabled && 'pointer-events-none opacity-60',
      )}
    >
      {/* Icon with spring pop */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={`${type}-${active}`}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          className="flex items-center"
        >
          {isLike ? (
            <Heart
              className={cn(
                'h-5 w-5 transition-colors',
                active
                  ? 'fill-rose-400 text-rose-400'
                  : 'text-current group-hover:text-rose-400',
              )}
            />
          ) : (
            <ThumbsDown
              className={cn(
                'h-5 w-5 transition-colors',
                active
                  ? 'fill-sky-400 text-sky-400'
                  : 'text-current group-hover:text-sky-400',
              )}
            />
          )}
        </motion.span>
      </AnimatePresence>

      {/* Counter with slide animation */}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={count}
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -8, opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="min-w-[1.5rem] tabular-nums text-center"
        >
          {formatCount(count)}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
});

// ============================================
// Main Component
// ============================================

interface EngagementButtonsProps {
  mediaType: 'movie' | 'tv';
  mediaId: number;
  className?: string;
}

export function EngagementButtons({ mediaType, mediaId, className }: EngagementButtonsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useIsVisible(containerRef);
  const { user } = useAuth();

  const { counts, userReaction, isLoading, isToggling, toggle } = useEngagement({
    mediaType,
    mediaId,
    userId: user?.id ?? null,
    isVisible,
  });

  return (
    <div
      ref={containerRef}
      className={cn('flex items-center gap-3', className)}
      role="group"
      aria-label="Engagement reactions"
    >
      {isLoading ? (
        <>
          <div className="h-[44px] w-[84px] animate-pulse rounded-full bg-dark-800/60" />
          <div className="h-[44px] w-[84px] animate-pulse rounded-full bg-dark-800/60" />
        </>
      ) : (
        <>
          <ReactionButton
            type="like"
            count={counts.likes}
            active={userReaction === 'like'}
            disabled={isToggling}
            onClick={() => toggle('like')}
          />
          <ReactionButton
            type="dislike"
            count={counts.dislikes}
            active={userReaction === 'dislike'}
            disabled={isToggling}
            onClick={() => toggle('dislike')}
          />
        </>
      )}
    </div>
  );
}
