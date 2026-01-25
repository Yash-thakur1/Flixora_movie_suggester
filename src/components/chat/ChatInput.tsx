'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useChatStore } from '@/store';
import { QUICK_ACTIONS } from '@/lib/ai';
import { cn } from '@/lib/utils';

/**
 * Chat input component with auto-resize and suggestions
 */
export function ChatInput() {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, isLoading, suggestedFollowUps } = useChatStore();
  
  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [input]);
  
  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;
    
    const message = input.trim();
    setInput('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    await sendMessage(message);
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };
  
  return (
    <div className="border-t border-dark-700/50 p-4 space-y-3">
      {/* Suggested follow-ups */}
      {suggestedFollowUps.length > 0 && !isLoading && (
        <div className="flex flex-wrap gap-2">
          {suggestedFollowUps.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-3 py-1.5 text-sm bg-dark-800/80 hover:bg-dark-700 text-gray-300 
                       hover:text-white rounded-full transition-colors border border-dark-600/50
                       hover:border-primary-500/50"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
      
      {/* Input area */}
      <div className="flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about movies or shows..."
            disabled={isLoading}
            rows={1}
            className={cn(
              "w-full resize-none rounded-2xl bg-dark-800/80 border border-dark-600/50",
              "px-4 py-3 text-white placeholder-gray-500",
              "focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50",
              "transition-all duration-200",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          />
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading}
          className={cn(
            "p-3 rounded-full transition-all duration-200",
            input.trim() && !isLoading
              ? "bg-primary-600 hover:bg-primary-500 text-white shadow-lg hover:shadow-glow"
              : "bg-dark-700 text-gray-500 cursor-not-allowed"
          )}
        >
          {isLoading ? (
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
              />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * Quick action buttons for common requests
 */
export function QuickActions() {
  const { sendMessage, messages } = useChatStore();
  
  // Only show on welcome message (1 message in chat)
  if (messages.length > 1) return null;
  
  return (
    <div className="p-4 pt-0">
      <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Quick Actions</p>
      <div className="grid grid-cols-2 gap-2">
        {QUICK_ACTIONS.slice(0, 6).map((action) => (
          <button
            key={action.id}
            onClick={() => sendMessage(action.prompt)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-left
                     bg-dark-800/60 hover:bg-dark-700/80 rounded-xl
                     border border-dark-700/50 hover:border-primary-500/30
                     transition-all duration-200 group"
          >
            <span className="text-lg group-hover:scale-110 transition-transform">
              {action.icon}
            </span>
            <span className="text-gray-300 group-hover:text-white">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ChatInput;
