'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, Settings, Bookmark, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function UserMenu() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="w-8 h-8 rounded-full bg-dark-700 animate-pulse" />
    );
  }

  // Not logged in
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/auth/login"
          className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
        >
          Sign in
        </Link>
        <Link
          href="/auth/signup"
          className="px-4 py-2 text-sm font-medium bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
        >
          Sign up
        </Link>
      </div>
    );
  }

  // Logged in - show user menu
  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 p-1 pr-3 rounded-full transition-colors',
          'hover:bg-dark-800',
          isOpen && 'bg-dark-800'
        )}
      >
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name || 'User'}
            width={32}
            height={32}
            className="rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <span className="text-sm font-medium text-white hidden sm:block max-w-[100px] truncate">
          {user.name || user.email?.split('@')[0]}
        </span>
        <ChevronDown className={cn(
          'w-4 h-4 text-gray-400 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 rounded-xl bg-dark-800 border border-dark-700 shadow-xl overflow-hidden z-50"
          >
            {/* User Info */}
            <div className="px-4 py-3 border-b border-dark-700">
              <p className="text-sm font-medium text-white truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user.email}
              </p>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <Link
                href="/watchlist"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-dark-700 transition-colors"
              >
                <Bookmark className="w-4 h-4" />
                My Watchlist
              </Link>
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-dark-700 transition-colors"
              >
                <User className="w-4 h-4" />
                Profile
              </Link>
              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-dark-700 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
            </div>

            {/* Sign Out */}
            <div className="border-t border-dark-700 py-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-dark-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
