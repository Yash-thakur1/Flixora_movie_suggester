'use client';

import dynamic from 'next/dynamic';
import { ChatButton } from './ChatButton';

// Lazy load the heavy ChatWindow component - only loaded when user clicks the chat button
const ChatWindow = dynamic(() => import('./ChatWindow'), {
  ssr: false,
  loading: () => null,
});

/**
 * Lazy-wrapped chat components for the layout.
 * ChatButton is always rendered (lightweight).
 * ChatWindow is dynamically imported on first interaction.
 */
export function LazyChat() {
  return (
    <>
      <ChatButton />
      <ChatWindow />
    </>
  );
}
