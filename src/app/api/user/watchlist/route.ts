import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAuthUser } from '@/lib/firebase-auth-helper';
import { getAdminDb } from '@/lib/firebase/admin';

// GET - Fetch user's watchlist
export async function GET(request: NextRequest) {
  try {
    const user = await getFirebaseAuthUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getAdminDb();
    const snapshot = await db
      .collection('users')
      .doc(user.id)
      .collection('watchlist')
      .orderBy('addedAt', 'desc')
      .get();

    const watchlist = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ watchlist });
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watchlist' },
      { status: 500 }
    );
  }
}

// POST - Add item to watchlist
export async function POST(request: NextRequest) {
  try {
    const user = await getFirebaseAuthUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { mediaId, mediaType, title, posterPath, voteAverage, releaseDate } = body;

    if (!mediaId || !mediaType || !title) {
      return NextResponse.json(
        { error: 'mediaId, mediaType, and title are required' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const docId = `${mediaType}_${mediaId}`;
    const docRef = db.collection('users').doc(user.id).collection('watchlist').doc(docId);

    // Check if already in watchlist
    const existing = await docRef.get();
    if (existing.exists) {
      return NextResponse.json(
        { error: 'Item already in watchlist' },
        { status: 409 }
      );
    }

    const item = {
      mediaId,
      mediaType,
      title,
      posterPath: posterPath || null,
      voteAverage: voteAverage || null,
      releaseDate: releaseDate || null,
      addedAt: new Date().toISOString(),
    };

    await docRef.set(item);

    return NextResponse.json({ item: { id: docId, ...item } }, { status: 201 });
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to add to watchlist' },
      { status: 500 }
    );
  }
}

// DELETE - Remove item from watchlist
export async function DELETE(request: NextRequest) {
  try {
    const user = await getFirebaseAuthUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get('mediaId');
    const mediaType = searchParams.get('mediaType');

    if (!mediaId || !mediaType) {
      return NextResponse.json(
        { error: 'mediaId and mediaType are required' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const docId = `${mediaType}_${mediaId}`;
    await db.collection('users').doc(user.id).collection('watchlist').doc(docId).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove from watchlist' },
      { status: 500 }
    );
  }
}
