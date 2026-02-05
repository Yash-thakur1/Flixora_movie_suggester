/**
 * Firebase Auth Helper for API Routes
 * 
 * Replaces Prisma-based auth with Firebase Admin SDK.
 * Verifies Firebase ID tokens from Authorization headers.
 */

import { NextRequest } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';

interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
}

/**
 * Extract and verify user from Firebase ID token in Authorization header.
 * Expects: Authorization: Bearer <firebase-id-token>
 */
export async function getFirebaseAuthUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const adminAuth = getAdminAuth();
    
    // Verify the Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    return {
      id: decodedToken.uid,
      email: decodedToken.email || null,
      name: decodedToken.name || null,
    };
  } catch (error) {
    console.error('[Firebase Auth Helper] Token verification failed:', error);
    return null;
  }
}
