/**
 * Service Worker Registration & Management
 * 
 * Features:
 * - Registers service worker for offline support
 * - Caches static assets and API responses
 * - Provides offline fallback
 * - Background sync for watchlist
 */

// ============================================
// Service Worker Registration
// ============================================

const SW_PATH = '/sw.js';
const SW_SCOPE = '/';

interface SWRegistrationResult {
  success: boolean;
  registration?: ServiceWorkerRegistration;
  error?: Error;
}

/**
 * Register the service worker
 */
export async function registerServiceWorker(): Promise<SWRegistrationResult> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return { success: false, error: new Error('Service Worker not supported') };
  }
  
  try {
    const registration = await navigator.serviceWorker.register(SW_PATH, {
      scope: SW_SCOPE,
    });
    
    console.log('[SW] Service Worker registered:', registration.scope);
    
    // Check for updates periodically
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000); // Every hour
    
    return { success: true, registration };
  } catch (error) {
    console.error('[SW] Registration failed:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Unregister all service workers
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }
  
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((r) => r.unregister()));
    console.log('[SW] All service workers unregistered');
    return true;
  } catch (error) {
    console.error('[SW] Unregistration failed:', error);
    return false;
  }
}

/**
 * Check if service worker is active
 */
export function isServiceWorkerActive(): boolean {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }
  
  return !!navigator.serviceWorker.controller;
}

// ============================================
// Cache Management
// ============================================

/**
 * Send message to service worker
 */
export async function sendToServiceWorker<T>(
  message: Record<string, unknown>
): Promise<T | null> {
  if (!isServiceWorkerActive()) return null;
  
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    
    channel.port1.onmessage = (event) => {
      resolve(event.data as T);
    };
    
    navigator.serviceWorker.controller!.postMessage(message, [channel.port2]);
    
    // Timeout after 5 seconds
    setTimeout(() => resolve(null), 5000);
  });
}

/**
 * Pre-cache specific URLs
 */
export async function precacheUrls(urls: string[]): Promise<void> {
  await sendToServiceWorker({
    type: 'PRECACHE',
    urls,
  });
}

/**
 * Clear all caches
 */
export async function clearServiceWorkerCaches(): Promise<void> {
  await sendToServiceWorker({
    type: 'CLEAR_CACHES',
  });
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  cacheNames: string[];
  totalSize: number;
} | null> {
  return sendToServiceWorker({
    type: 'GET_STATS',
  });
}

// ============================================
// Offline Detection
// ============================================

type OfflineCallback = (isOffline: boolean) => void;
const offlineCallbacks: OfflineCallback[] = [];

/**
 * Subscribe to offline status changes
 */
export function onOfflineChange(callback: OfflineCallback): () => void {
  offlineCallbacks.push(callback);
  
  return () => {
    const index = offlineCallbacks.indexOf(callback);
    if (index !== -1) {
      offlineCallbacks.splice(index, 1);
    }
  };
}

/**
 * Initialize offline detection
 */
export function initOfflineDetection(): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const handleOnline = () => {
    offlineCallbacks.forEach((cb) => cb(false));
  };
  
  const handleOffline = () => {
    offlineCallbacks.forEach((cb) => cb(true));
  };
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// ============================================
// Background Sync
// ============================================

/**
 * Register a background sync task
 */
export async function registerBackgroundSync(tag: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    
    if ('sync' in registration) {
      await (registration as any).sync.register(tag);
      console.log(`[SW] Background sync registered: ${tag}`);
      return true;
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
  
  return false;
}

// ============================================
// Initialization
// ============================================

let initialized = false;

/**
 * Initialize service worker system
 */
export async function initServiceWorker(): Promise<void> {
  if (initialized) return;
  initialized = true;
  
  // Only register in production
  if (process.env.NODE_ENV === 'production') {
    await registerServiceWorker();
  }
  
  // Initialize offline detection
  initOfflineDetection();
}

// Auto-initialize
if (typeof window !== 'undefined') {
  // Delay initialization to not block main thread
  setTimeout(initServiceWorker, 2000);
}
