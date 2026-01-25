/**
 * Optimized Link Component
 * 
 * Features:
 * - Prefetch on hover/focus
 * - Optimistic navigation
 * - Progress indicator
 * - Network-aware prefetching
 */

'use client';

import { forwardRef, useCallback, useRef, memo, ReactNode, MouseEvent } from 'react';
import NextLink, { LinkProps as NextLinkProps } from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useNetworkStore } from '@/lib/network';
import { handleLinkHover, cancelLinkHover, prefetchRoute } from '@/lib/optimisticNavigation';
import { onHoverStart, onHoverEnd } from '@/lib/smartPrefetch';

// ============================================
// Types
// ============================================

export interface OptimizedLinkProps extends Omit<NextLinkProps, 'prefetch'> {
  children: ReactNode;
  className?: string;
  /** Prefetch behavior */
  prefetch?: 'hover' | 'viewport' | 'none' | boolean;
  /** Movie/TV ID for smart prefetching */
  movieId?: number;
  tvId?: number;
  /** Custom hover delay in ms */
  hoverDelay?: number;
  /** Disable link */
  disabled?: boolean;
  /** Open in new tab */
  external?: boolean;
  /** Additional click handler */
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}

// ============================================
// Component
// ============================================

export const OptimizedLink = memo(forwardRef<HTMLAnchorElement, OptimizedLinkProps>(
  function OptimizedLink(
    {
      children,
      className,
      prefetch = 'hover',
      movieId,
      tvId,
      hoverDelay = 100,
      disabled = false,
      external = false,
      onClick,
      href,
      ...props
    },
    ref
  ) {
    const router = useRouter();
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { isOffline, isSlowConnection } = useNetworkStore();
    
    // Determine if we should prefetch
    const shouldPrefetch = prefetch !== 'none' && prefetch !== false && !isOffline;
    const isPrefetchOnHover = prefetch === 'hover' || prefetch === true;
    
    // Handle hover start
    const handleMouseEnter = useCallback(() => {
      if (!shouldPrefetch || !isPrefetchOnHover) return;
      
      // Clear any existing timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      
      hoverTimeoutRef.current = setTimeout(() => {
        // Prefetch the route
        const hrefStr = typeof href === 'string' ? href : href.pathname || '';
        handleLinkHover(hrefStr);
        prefetchRoute(hrefStr);
        
        // Smart prefetch movie/TV data
        if (movieId) {
          onHoverStart(movieId, 'movie');
        } else if (tvId) {
          onHoverStart(tvId, 'tvshow');
        }
      }, isSlowConnection ? hoverDelay * 2 : hoverDelay);
    }, [shouldPrefetch, isPrefetchOnHover, href, movieId, tvId, hoverDelay, isSlowConnection]);
    
    // Handle hover end
    const handleMouseLeave = useCallback(() => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      
      cancelLinkHover();
      
      if (movieId) {
        onHoverEnd(movieId, 'movie');
      } else if (tvId) {
        onHoverEnd(tvId, 'tvshow');
      }
    }, [movieId, tvId]);
    
    // Handle click
    const handleClick = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
      if (disabled) {
        e.preventDefault();
        return;
      }
      
      onClick?.(e);
    }, [disabled, onClick]);
    
    // External links
    if (external) {
      const hrefStr = typeof href === 'string' ? href : href.toString();
      return (
        <a
          ref={ref}
          href={hrefStr}
          className={cn(disabled && 'pointer-events-none opacity-50', className)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {children}
        </a>
      );
    }
    
    return (
      <NextLink
        ref={ref}
        href={href}
        className={cn(disabled && 'pointer-events-none opacity-50', className)}
        prefetch={prefetch === 'viewport'}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        onClick={handleClick}
        {...props}
      >
        {children}
      </NextLink>
    );
  }
));

// ============================================
// Movie Link (specialized for movie cards)
// ============================================

interface MovieLinkProps {
  movieId: number;
  children: ReactNode;
  className?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}

export const MovieLink = memo(function MovieLink({
  movieId,
  children,
  className,
  onClick,
}: MovieLinkProps) {
  return (
    <OptimizedLink
      href={`/movie/${movieId}`}
      movieId={movieId}
      className={className}
      onClick={onClick}
    >
      {children}
    </OptimizedLink>
  );
});

// ============================================
// TV Show Link
// ============================================

interface TVShowLinkProps {
  tvId: number;
  children: ReactNode;
  className?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}

export const TVShowLink = memo(function TVShowLink({
  tvId,
  children,
  className,
  onClick,
}: TVShowLinkProps) {
  return (
    <OptimizedLink
      href={`/tv/${tvId}`}
      tvId={tvId}
      className={className}
      onClick={onClick}
    >
      {children}
    </OptimizedLink>
  );
});

// ============================================
// Prefetch on Viewport (for grids/carousels)
// ============================================

interface ViewportPrefetchLinkProps extends OptimizedLinkProps {
  /** Root margin for intersection observer */
  rootMargin?: string;
}

export const ViewportPrefetchLink = memo(function ViewportPrefetchLink({
  children,
  rootMargin = '200px',
  ...props
}: ViewportPrefetchLinkProps) {
  return (
    <OptimizedLink
      prefetch="viewport"
      {...props}
    >
      {children}
    </OptimizedLink>
  );
});

export default OptimizedLink;
