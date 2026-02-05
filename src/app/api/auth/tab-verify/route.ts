/**
 * Tab Verify API Route
 * 
 * Verifies a Firebase ID token from Authorization header.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const adminAuth = getAdminAuth();

    // Verify the Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Get full user record
    const userRecord = await adminAuth.getUser(decodedToken.uid);

    return NextResponse.json({
      valid: true,
      user: {
        id: userRecord.uid,
        name: userRecord.displayName || null,
        email: userRecord.email || null,
        image: userRecord.photoURL || null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
}
