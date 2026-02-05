import { NextRequest } from 'next/server';
import { getFirebaseAuthUser } from '@/lib/firebase-auth-helper';

interface TabAuthUser {
  id: string;
  email: string | null;
  name: string | null;
}

/**
 * Extract user from Firebase ID token in Authorization header.
 * Backward-compatible wrapper around getFirebaseAuthUser.
 */
export async function getTabAuthUser(request: NextRequest): Promise<TabAuthUser | null> {
  return getFirebaseAuthUser(request);
}
