import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAuthUser } from '@/lib/firebase-auth-helper';
import { getAdminDb } from '@/lib/firebase/admin';

// GET - Fetch user's preferences
export async function GET(request: NextRequest) {
  try {
    const user = await getFirebaseAuthUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getAdminDb();
    const docRef = db.collection('users').doc(user.id).collection('data').doc('preferences');
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      // Return default preferences
      return NextResponse.json({
        preferences: {
          favoriteGenres: [],
          preferredMood: null,
          preferredEra: null,
          preferredLanguages: [],
          ratingPreference: 'any',
        },
      });
    }

    const data = docSnap.data()!;
    return NextResponse.json({
      preferences: {
        favoriteGenres: data.favoriteGenres || [],
        preferredMood: data.preferredMood || null,
        preferredEra: data.preferredEra || null,
        preferredLanguages: data.preferredLanguages || [],
        ratingPreference: data.ratingPreference || 'any',
      },
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

// PUT - Update user's preferences
export async function PUT(request: NextRequest) {
  try {
    const user = await getFirebaseAuthUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      favoriteGenres,
      preferredMood,
      preferredEra,
      preferredLanguages,
      ratingPreference,
    } = body;

    const data: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (favoriteGenres !== undefined) data.favoriteGenres = favoriteGenres;
    if (preferredMood !== undefined) data.preferredMood = preferredMood;
    if (preferredEra !== undefined) data.preferredEra = preferredEra;
    if (preferredLanguages !== undefined) data.preferredLanguages = preferredLanguages;
    if (ratingPreference !== undefined) data.ratingPreference = ratingPreference;

    const db = getAdminDb();
    const docRef = db.collection('users').doc(user.id).collection('data').doc('preferences');
    await docRef.set(data, { merge: true });

    return NextResponse.json({ preferences: data });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
