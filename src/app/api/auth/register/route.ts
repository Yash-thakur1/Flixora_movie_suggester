import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const adminAuth = getAdminAuth();

    // Check if user already exists
    try {
      await adminAuth.getUserByEmail(email);
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    } catch {
      // User doesn't exist, proceed with creation
    }

    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name || email.split('@')[0],
    });

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: userRecord.uid,
          email: userRecord.email,
          name: userRecord.displayName,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);

    if (error?.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }
    if (error?.code === 'auth/weak-password') {
      return NextResponse.json(
        { error: 'Password is too weak. Must be at least 6 characters.' },
        { status: 400 }
      );
    }
    if (error?.code === 'auth/invalid-email') {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
