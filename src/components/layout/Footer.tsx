import Link from 'next/link';
import Image from 'next/image';
import { Github, Twitter } from 'lucide-react';

/**
 * Footer Component
 * Site footer with branding and credits
 */

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark-900 border-t border-dark-800">
      <div className="container mx-auto px-4 md:px-8 py-12">
        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-white font-display font-bold text-xl mb-4"
          >
            <Image
              src="/images/bingebuddy-logo.png"
              alt="BingeBuddy"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            BingeBuddy
          </Link>
          <p className="text-gray-400 text-sm max-w-md">
            Discover your next favorite movie with our AI-powered recommendations.
          </p>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-dark-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © {currentYear} BingeBuddy. This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
