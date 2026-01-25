import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTabAuthUser } from '@/lib/tab-auth';
import { prisma } from '@/lib/prisma';

// Helper to get user ID from either tab auth or session auth
async function getUserId(request: NextRequest): Promise<string | null> {
  // First, try tab-based auth (Authorization header)
  const tabUser = await getTabAuthUser(request);
  if (tabUser?.id) {
    return tabUser.id;
  }
  
  // Fall back to session-based auth (cookies)
  const session = await auth();
  return session?.user?.id || null;
}

// GET - Fetch user's watchlist
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const watchlist = await prisma.watchlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

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
    const userId = await getUserId(request);
    
    if (!userId) {
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

    // Check if already in watchlist
    const existing = await prisma.watchlistItem.findUnique({
      where: {
        userId_mediaId_mediaType: {
          userId,
          mediaId,
          mediaType,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Item already in watchlist' },
        { status: 409 }
      );
    }

    const item = await prisma.watchlistItem.create({
      data: {
        userId,
        mediaId,
        mediaType,
        title,
        posterPath,
        voteAverage,
        releaseDate,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
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
    const userId = await getUserId(request);
    
    if (!userId) {
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

    await prisma.watchlistItem.delete({
      where: {
        userId_mediaId_mediaType: {
          userId,
          mediaId: parseInt(mediaId),
          mediaType,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove from watchlist' },
      { status: 500 }
    );
  }
}
