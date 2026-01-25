'use client';

import { cn } from '@/lib/utils';

/**
 * Badge component for genre tags and ratings
 */

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'genre' | 'rating' | 'outline';
  color?: string;
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  color,
  className,
}: BadgeProps) {
  const variants = {
    default: 'bg-dark-700 text-gray-300',
    genre: 'bg-dark-800/80 backdrop-blur-sm text-gray-200 border border-dark-600',
    rating: 'bg-gold-500/20 text-gold-400 border border-gold-500/50',
    outline: 'border border-dark-500 text-gray-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
      style={color ? { backgroundColor: `${color}20`, color } : undefined}
    >
      {children}
    </span>
  );
}

/**
 * Rating badge with star icon
 */
export function RatingBadge({
  rating,
  showIcon = true,
  size = 'md',
  className,
}: {
  rating: number;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const getRatingColor = (r: number) => {
    if (r >= 8) return 'bg-green-500/20 text-green-400 border-green-500/50';
    if (r >= 6) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    if (r >= 4) return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
    return 'bg-red-500/20 text-red-400 border-red-500/50';
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-lg font-semibold border',
        sizeClasses[size],
        getRatingColor(rating),
        className
      )}
    >
      {showIcon && (
        <svg
          className="w-3 h-3"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )}
      {rating.toFixed(1)}
    </span>
  );
}
