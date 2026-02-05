/**
 * Auth configuration - Firebase based
 * 
 * NextAuth is no longer used. Auth is handled via Firebase Auth + Admin SDK.
 * This file exports placeholder functions for backward compatibility.
 */

/**
 * Placeholder auth function for backward compatibility.
 * Returns null session - all auth now goes through Firebase.
 */
export async function auth() {
  return null;
}

/**
 * Placeholder handlers for the NextAuth route.
 */
export const handlers = {
  GET: async () => new Response('Auth is handled by Firebase', { status: 200 }),
  POST: async () => new Response('Auth is handled by Firebase', { status: 200 }),
};
