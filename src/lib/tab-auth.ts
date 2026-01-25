import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key';

interface TabAuthUser {
  id: string;
  email: string | null;
  name: string | null;
}

/**
 * Extract user from tab-based authentication
 * Checks Authorization header for Bearer token
 */
export async function getTabAuthUser(request: NextRequest): Promise<TabAuthUser | null> {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true },
    });

    return user;
  } catch {
    return null;
  }
}
