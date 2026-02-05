/**
 * API Routes for User Learning State
 * 
 * Handles persistence of AI preference learning data via Firestore.
 * GET: Retrieve user's learning state
 * POST: Save/update user's learning state
 * DELETE: Reset user's learning state
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAuthUser } from '@/lib/firebase-auth-helper';
import { getAdminDb } from '@/lib/firebase/admin';

/**
 * GET /api/user/learning
 * Retrieve the authenticated user's learning state
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getFirebaseAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = getAdminDb();
    const docRef = db.collection('users').doc(user.id).collection('data').doc('learning');
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({
        learningData: null,
        totalLikes: 0,
        totalDislikes: 0
      });
    }

    const data = docSnap.data()!;
    return NextResponse.json({
      learningData: data.learningData || null,
      totalLikes: data.totalLikes || 0,
      totalDislikes: data.totalDislikes || 0,
      updatedAt: data.updatedAt || null
    });
  } catch (error) {
    console.error('[API] Error fetching learning state:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning state' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/learning
 * Save or update the authenticated user's learning state
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getFirebaseAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { learningData, totalLikes, totalDislikes } = body;

    if (!learningData) {
      return NextResponse.json(
        { error: 'Missing learning data' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const docRef = db.collection('users').doc(user.id).collection('data').doc('learning');
    const now = new Date().toISOString();

    await docRef.set({
      learningData,
      totalLikes: totalLikes ?? 0,
      totalDislikes: totalDislikes ?? 0,
      updatedAt: now,
    }, { merge: true });

    return NextResponse.json({
      success: true,
      updatedAt: now
    });
  } catch (error) {
    console.error('[API] Error saving learning state:', error);
    return NextResponse.json(
      { error: 'Failed to save learning state' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/learning
 * Reset the authenticated user's learning state
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getFirebaseAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = getAdminDb();
    await db.collection('users').doc(user.id).collection('data').doc('learning').delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error resetting learning state:', error);
    return NextResponse.json(
      { error: 'Failed to reset learning state' },
      { status: 500 }
    );
  }
}
