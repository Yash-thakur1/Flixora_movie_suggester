'use client';

import { useChatStore } from '@/store';
import { cn } from '@/lib/utils';

/**
 * Floating chat button to open the assistant
 */
export function ChatButton() {
  const { isOpen, toggleChat, messages } = useChatStore();
  
  // Don't show button when chat is open on mobile
  if (isOpen) return null;
  
  // Check if there are unread messages (more than welcome message)
  const hasUnread = messages.length > 1;
  
  return (
    <button
      onClick={toggleChat}
      className={cn(
        "fixed z-40 right-6 bottom-6",
        "w-14 h-14 rounded-full",
        "bg-gradient-to-br from-primary-500 to-primary-700",
        "shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/40",
        "flex items-center justify-center",
        "transition-all duration-300",
        "hover:scale-110 active:scale-95",
        "group"
      )}
      aria-label="Open chat assistant"
    >
      {/* Chat icon */}
      <svg 
        className="w-6 h-6 text-white transition-transform duration-300 group-hover:scale-110" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
        />
      </svg>
      
      {/* Notification dot */}
      {hasUnread && (
        <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full 
                       flex items-center justify-center text-[10px] text-white font-bold
                       animate-pulse">
          {Math.min(messages.length - 1, 9)}
        </span>
      )}
      
      {/* Ripple effect */}
      <span className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-0 
                      group-hover:opacity-100" />
    </button>
  );
}

/**
 * Alternative minimized chat button with label
 */
export function ChatButtonWithLabel() {
  const { isOpen, toggleChat } = useChatStore();
  
  if (isOpen) return null;
  
  return (
    <button
      onClick={toggleChat}
      className={cn(
        "fixed z-40 right-6 bottom-6",
        "px-5 py-3 rounded-full",
        "bg-gradient-to-r from-primary-600 to-primary-500",
        "shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/40",
        "flex items-center gap-2",
        "transition-all duration-300",
        "hover:scale-105 active:scale-95",
        "group"
      )}
      aria-label="Open chat assistant"
    >
      <svg 
        className="w-5 h-5 text-white" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
        />
      </svg>
      <span className="text-white font-medium">Ask AI</span>
    </button>
  );
}

export default ChatButton;
