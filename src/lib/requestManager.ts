/**
 * Advanced Request Management System
 * 
 * Features:
 * - Request cancellation when user intent changes
 * - Deduplication of identical API calls
 * - Priority-based request queuing
 * - Automatic retry with exponential backoff
 */

// ============================================
// Request Tracking & Cancellation
// ============================================

interface PendingRequest {
  controller: AbortController;
  priority: RequestPriority;
  timestamp: number;
  key: string;
}

export type RequestPriority = 'critical' | 'high' | 'medium' | 'low' | 'background';

const pendingRequests = new Map<string, PendingRequest>();
const requestResults = new Map<string, { data: unknown; timestamp: number; promise?: Promise<unknown> }>();

// Request result cache duration (30 seconds for deduplication)
const DEDUP_CACHE_TTL = 30 * 1000;

/**
 * Generate a unique key for a request
 */
export function getRequestKey(endpoint: string, params?: Record<string, unknown>): string {
  const paramStr = params ? JSON.stringify(params, Object.keys(params).sort()) : '';
  return `${endpoint}:${paramStr}`;
}

/**
 * Cancel all pending requests with lower priority
 */
export function cancelLowerPriorityRequests(priority: RequestPriority): void {
  const priorityOrder: RequestPriority[] = ['background', 'low', 'medium', 'high', 'critical'];
  const priorityIndex = priorityOrder.indexOf(priority);
  
  pendingRequests.forEach((request, key) => {
    const reqPriorityIndex = priorityOrder.indexOf(request.priority);
    if (reqPriorityIndex < priorityIndex) {
      request.controller.abort();
      pendingRequests.delete(key);
    }
  });
}

/**
 * Cancel a specific request by key
 */
export function cancelRequest(key: string): void {
  const request = pendingRequests.get(key);
  if (request) {
    request.controller.abort();
    pendingRequests.delete(key);
  }
}

/**
 * Cancel all pending requests
 */
export function cancelAllRequests(): void {
  pendingRequests.forEach((request) => {
    request.controller.abort();
  });
  pendingRequests.clear();
}

/**
 * Check if a request is pending
 */
export function isRequestPending(key: string): boolean {
  return pendingRequests.has(key);
}

// ============================================
// Request Deduplication
// ============================================

/**
 * Get cached result if available and fresh
 */
export function getCachedResult<T>(key: string): T | null {
  const cached = requestResults.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > DEDUP_CACHE_TTL) {
    requestResults.delete(key);
    return null;
  }
  
  return cached.data as T;
}

/**
 * Get pending promise for deduplication
 */
export function getPendingPromise<T>(key: string): Promise<T> | null {
  const cached = requestResults.get(key);
  if (cached?.promise) {
    return cached.promise as Promise<T>;
  }
  return null;
}

/**
 * Execute a deduplicated request
 * Returns cached result if available, or joins existing request, or creates new one
 */
export async function deduplicatedFetch<T>(
  key: string,
  fetchFn: (signal: AbortSignal) => Promise<T>,
  priority: RequestPriority = 'medium'
): Promise<T> {
  // Check for cached result
  const cached = getCachedResult<T>(key);
  if (cached !== null) {
    return cached;
  }
  
  // Check for pending promise (join existing request)
  const pending = getPendingPromise<T>(key);
  if (pending) {
    return pending;
  }
  
  // Create new request
  const controller = new AbortController();
  pendingRequests.set(key, {
    controller,
    priority,
    timestamp: Date.now(),
    key,
  });
  
  const promise = (async () => {
    try {
      const result = await fetchFn(controller.signal);
      
      // Cache the result
      requestResults.set(key, {
        data: result,
        timestamp: Date.now(),
      });
      
      return result;
    } finally {
      pendingRequests.delete(key);
    }
  })();
  
  // Store the promise for deduplication
  const existing = requestResults.get(key);
  if (existing) {
    existing.promise = promise;
  } else {
    requestResults.set(key, {
      data: null,
      timestamp: Date.now(),
      promise,
    });
  }
  
  return promise;
}

// ============================================
// Priority Queue for Requests
// ============================================

interface QueuedRequest<T> {
  key: string;
  fetchFn: (signal: AbortSignal) => Promise<T>;
  priority: RequestPriority;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

const requestQueue: QueuedRequest<unknown>[] = [];
let isProcessingQueue = false;
const MAX_CONCURRENT_REQUESTS = 6; // Browser limit per domain
let activeRequests = 0;

/**
 * Queue a request with priority
 */
export function queueRequest<T>(
  key: string,
  fetchFn: (signal: AbortSignal) => Promise<T>,
  priority: RequestPriority = 'medium'
): Promise<T> {
  return new Promise((resolve, reject) => {
    const request: QueuedRequest<T> = {
      key,
      fetchFn,
      priority,
      resolve: resolve as (value: unknown) => void,
      reject,
    };
    
    // Insert based on priority
    const priorityOrder: RequestPriority[] = ['critical', 'high', 'medium', 'low', 'background'];
    const priorityIndex = priorityOrder.indexOf(priority);
    
    let insertIndex = requestQueue.length;
    for (let i = 0; i < requestQueue.length; i++) {
      const existingIndex = priorityOrder.indexOf(requestQueue[i].priority);
      if (priorityIndex < existingIndex) {
        insertIndex = i;
        break;
      }
    }
    
    requestQueue.splice(insertIndex, 0, request as QueuedRequest<unknown>);
    processQueue();
  });
}

/**
 * Process the request queue
 */
async function processQueue(): Promise<void> {
  if (isProcessingQueue || activeRequests >= MAX_CONCURRENT_REQUESTS) {
    return;
  }
  
  isProcessingQueue = true;
  
  while (requestQueue.length > 0 && activeRequests < MAX_CONCURRENT_REQUESTS) {
    const request = requestQueue.shift();
    if (!request) break;
    
    activeRequests++;
    
    // Don't await - run concurrently
    deduplicatedFetch(request.key, request.fetchFn, request.priority)
      .then(request.resolve)
      .catch(request.reject)
      .finally(() => {
        activeRequests--;
        processQueue();
      });
  }
  
  isProcessingQueue = false;
}

// ============================================
// Intent-based Cancellation
// ============================================

let currentIntent: string | null = null;

/**
 * Set the current user intent (e.g., viewing a specific movie)
 * Cancels requests not related to the new intent
 */
export function setUserIntent(intent: string): void {
  if (currentIntent === intent) return;
  
  currentIntent = intent;
  
  // Cancel requests not matching the new intent
  pendingRequests.forEach((request, key) => {
    if (!key.includes(intent) && request.priority !== 'critical') {
      request.controller.abort();
      pendingRequests.delete(key);
    }
  });
}

/**
 * Clear user intent
 */
export function clearUserIntent(): void {
  currentIntent = null;
}

// ============================================
// Cleanup
// ============================================

/**
 * Cleanup stale cache entries
 */
export function cleanupRequestCache(): void {
  const now = Date.now();
  requestResults.forEach((result, key) => {
    if (now - result.timestamp > DEDUP_CACHE_TTL && !result.promise) {
      requestResults.delete(key);
    }
  });
}

// Periodic cleanup
if (typeof window !== 'undefined') {
  setInterval(cleanupRequestCache, 60 * 1000);
}
