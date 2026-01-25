'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Search, Bookmark, Sparkles, Home, Film } from 'lucide-react';
import { SearchBar, MobileSearchOverlay } from './SearchBar';
import { useUIStore, useWatchlistStore } from '@/store';
import { cn } from '@/lib/utils';

/**
 * Main Header Component
 * Sticky navigation with search and mobile menu
 */

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu, openSearch } = useUIStore();
  const watchlistCount = useWatchlistStore((state) => state.items.length);

  // Handle scroll for background blur
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/discover', label: 'Discover', icon: Film },
    { href: '/recommendations', label: 'For You', icon: Sparkles },
    { href: '/watchlist', label: 'Watchlist', icon: Bookmark, badge: watchlistCount },
  ];

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
          isScrolled
            ? 'bg-dark-950/90 backdrop-blur-md border-b border-dark-800'
            : 'bg-transparent'
        )}
      >
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 text-white font-display font-bold text-xl md:text-2xl"
            >
              <Image
                src="/images/Gemini_Generated_Image_b0be2yb0be2yb0be.png"
                alt="Flixora"
                width={40}
                height={40}
                className="w-8 h-8 md:w-10 md:h-10"
              />
              <span className="hidden sm:inline">Flixora</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative px-4 py-2 rounded-lg text-gray-300',
                    'hover:text-white hover:bg-dark-800 transition-colors',
                    'flex items-center gap-2'
                  )}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                  {link.badge !== undefined && link.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                      {link.badge > 9 ? '9+' : link.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>

            {/* Search (Desktop) */}
            <div className="hidden lg:block w-96">
              <SearchBar />
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              {/* Search button (Mobile/Tablet) */}
              <button
                onClick={openSearch}
                className="lg:hidden p-2 text-gray-300 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Watchlist (Mobile) */}
              <Link
                href="/watchlist"
                className="relative md:hidden p-2 text-gray-300 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
              >
                <Bookmark className="w-5 h-5" />
                {watchlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                    {watchlistCount > 9 ? '9+' : watchlistCount}
                  </span>
                )}
              </Link>

              {/* Mobile menu button */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 text-gray-300 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-0 right-0 z-30 md:hidden bg-dark-950 border-b border-dark-800"
          >
            <nav className="container mx-auto px-4 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300',
                    'hover:text-white hover:bg-dark-800 transition-colors'
                  )}
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                  {link.badge !== undefined && link.badge > 0 && (
                    <span className="ml-auto bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {link.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Search Overlay */}
      <MobileSearchOverlay />
    </>
  );
}
