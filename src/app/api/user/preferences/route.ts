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

// GET - Fetch user's preferences
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let preferences = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await prisma.userPreferences.create({
        data: { userId },
      });
    }

    // Parse comma-separated values into arrays
    const parsed = {
      favoriteGenres: preferences.favoriteGenres
        ? preferences.favoriteGenres.split(',').map(Number)
        : [],
      preferredMood: preferences.preferredMood,
      preferredEra: preferences.preferredEra,
      preferredLanguages: preferences.preferredLanguages
        ? preferences.preferredLanguages.split(',')
        : [],
      ratingPreference: preferences.ratingPreference || 'any',
    };

    return NextResponse.json({ preferences: parsed });
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
    const userId = await getUserId(request);
    
    if (!userId) {
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

    // Convert arrays to comma-separated strings
    const data: Record<string, string | null> = {};
    
    if (favoriteGenres !== undefined) {
      data.favoriteGenres = Array.isArray(favoriteGenres)
        ? favoriteGenres.join(',')
        : null;
    }
    
    if (preferredMood !== undefined) {
      data.preferredMood = preferredMood;
    }
    
    if (preferredEra !== undefined) {
      data.preferredEra = preferredEra;
    }
    
    if (preferredLanguages !== undefined) {
      data.preferredLanguages = Array.isArray(preferredLanguages)
        ? preferredLanguages.join(',')
        : null;
    }
    
    if (ratingPreference !== undefined) {
      data.ratingPreference = ratingPreference;
    }

    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    });

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
