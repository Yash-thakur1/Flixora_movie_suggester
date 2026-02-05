/**
 * Tab Login API Route
 * 
 * Verifies a Firebase ID token and returns user info.
 * The client-side Firebase SDK handles the actual email/password authentication.
 * This endpoint just verifies the resulting token server-side.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'Firebase ID token is required' },
        { status: 400 }
      );
    }

    const adminAuth = getAdminAuth();

    // Verify the Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // Get full user record
    const userRecord = await adminAuth.getUser(decodedToken.uid);

    return NextResponse.json({
      user: {
        id: userRecord.uid,
        name: userRecord.displayName || null,
        email: userRecord.email || null,
        image: userRecord.photoURL || null,
      },
      token: idToken,
    });
  } catch (error) {
    console.error('Tab login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
