'use client';

import { useEffect, ReactNode } from 'react';
import { trackWebVitals, performanceMonitor } from '@/lib/performance';
import { initNetworkMonitoring } from '@/lib/network';
import { initScrollTracking, configurePrefetch } from '@/lib/smartPrefetch';
import { initCache } from '@/lib/multiLayerCache';
import { initServiceWorker } from '@/lib/serviceWorker';

interface PerformanceProviderProps {
  children: ReactNode;
}

/**
 * Performance Provider
 * Initializes all performance optimization systems
 */
export function PerformanceProvider({ children }: PerformanceProviderProps) {
  useEffect(() => {
    // Initialize Web Vitals tracking
    trackWebVitals();
    
    // Initialize network monitoring
    const cleanupNetwork = initNetworkMonitoring();
    
    // Initialize scroll tracking for prefetching
    const cleanupScroll = initScrollTracking();
    
    // Configure prefetch based on device capabilities
    configurePrefetch({
      hoverDelay: 100,
      viewportMargin: '300px',
      maxConcurrent: navigator.hardwareConcurrency > 4 ? 4 : 2,
      maxQueueSize: 30,
    });
    
    // Initialize multi-layer cache
    initCache();
    
    // Initialize service worker (production only)
    initServiceWorker();

    // Track page navigation timing
    const handleRouteChange = () => {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navEntry) {
        performanceMonitor.addEntry({
          name: 'Route Change',
          type: 'navigation',
          startTime: navEntry.startTime,
          duration: navEntry.duration,
        });
      }
    };

    // Listen for popstate (browser back/forward)
    window.addEventListener('popstate', handleRouteChange);

    // Log initial page load summary
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        const summary = performanceMonitor.getSummary();
        if (summary.totalEntries > 0) {
          console.log(
            '%c📊 Performance Summary',
            'color: #3b82f6; font-weight: bold; font-size: 14px;'
          );
          console.log(`  Total entries: ${summary.totalEntries}`);
          console.log(`  Avg API time: ${summary.averageApiTime.toFixed(2)}ms`);
          if (summary.slowestApi) {
            console.log(`  Slowest API: ${summary.slowestApi.name} (${summary.slowestApi.duration.toFixed(2)}ms)`);
          }
        }
      }, 3000);
    }

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      cleanupNetwork();
      cleanupScroll();
    };
  }, []);

  return <>{children}</>;
}

export default PerformanceProvider;
