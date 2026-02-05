/**
 * Firestore Engagement – Real-time Client Service
 *
 * Provides live `onSnapshot` subscriptions so every connected client
 * receives instant counter updates when any user reacts.
 *
 * Collections (written by Admin SDK only):
 *   engagement/{mediaType}_{mediaId}                     – { likes, dislikes }
 *   engagement/{mediaType}_{mediaId}/reactions/{visitorId} – { reaction }
 */

import {
  doc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from './config';

// ============================================
// Types
// ============================================

export type ReactionType = 'like' | 'dislike';

export interface EngagementCounts {
  likes: number;
  dislikes: number;
}

// ============================================
// Helpers
// ============================================

function engagementDocId(mediaType: 'movie' | 'tv', mediaId: number): string {
  return `${mediaType}_${mediaId}`;
}

// ============================================
// Real-time Subscriptions
// ============================================

/**
 * Subscribe to live like/dislike counters for a media item.
 * The `onCounts` callback fires immediately with the current value
 * and again whenever any user's reaction changes the totals.
 *
 * @returns unsubscribe function
 */
export function subscribeToEngagement(
  mediaType: 'movie' | 'tv',
  mediaId: number,
  onCounts: (counts: EngagementCounts) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const db = getFirebaseDb();
  const ref = doc(db, 'engagement', engagementDocId(mediaType, mediaId));

  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        onCounts({ likes: d.likes ?? 0, dislikes: d.dislikes ?? 0 });
      } else {
        onCounts({ likes: 0, dislikes: 0 });
      }
    },
    (err) => {
      console.error('[Engagement] onSnapshot counters error:', err);
      onError?.(err as Error);
    },
  );
}

/**
 * Subscribe to a specific visitor's reaction for a media item.
 * Fires immediately with the current reaction (or null) and
 * again whenever the visitor toggles their reaction.
 *
 * @returns unsubscribe function
 */
export function subscribeToUserReaction(
  mediaType: 'movie' | 'tv',
  mediaId: number,
  visitorId: string,
  onReaction: (reaction: ReactionType | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const db = getFirebaseDb();
  const ref = doc(
    db,
    'engagement',
    engagementDocId(mediaType, mediaId),
    'reactions',
    visitorId,
  );

  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        onReaction((snap.data()?.reaction as ReactionType) ?? null);
      } else {
        onReaction(null);
      }
    },
    (err) => {
      console.error('[Engagement] onSnapshot reaction error:', err);
      onError?.(err as Error);
    },
  );
}
