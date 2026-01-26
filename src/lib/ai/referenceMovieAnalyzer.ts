/**
 * Reference Movie Analyzer - Enhanced Cultural Context Engine
 * 
 * When a user requests "movies like X", this module:
 * 1. Treats the reference movie as a STRICT TEMPLATE (not loose inspiration)
 * 2. Extracts a detailed CINEMATIC PROFILE including:
 *    - Language preference & industry context
 *    - Audience type & cultural expectations
 *    - Narrative scale & storytelling style
 *    - Thematic elements (hero-centric, power fantasy, mass appeal)
 * 3. Applies HARD FILTERING rules to exclude mismatched content
 * 4. Prioritizes "mass-audience DNA" matching over simple genre/popularity
 * 5. Generates justifications for why each recommendation matches
 */

import { searchMovies, searchTVShows, getMovieDetails, getTVShowDetails } from '@/lib/tmdb/api';
import { Movie, TVShow, MovieDetails, TVShowDetails } from '@/types/movie';

// ============================================
// Enhanced Types
// ============================================

/**
 * Detailed cinematic profile for strict matching
 */
export interface CinematicProfile {
  // Narrative characteristics
  narrativeScale: 'epic' | 'large' | 'medium' | 'intimate' | 'unknown';
  storytellingStyle: 'commercial-masala' | 'action-spectacle' | 'emotional-drama' | 'thriller-suspense' | 'comedy-entertainment' | 'art-house' | 'mixed';
  pacing: 'fast' | 'moderate' | 'slow' | 'unknown';
  
  // Audience targeting
  audienceType: 'mass' | 'family' | 'youth' | 'mature' | 'niche' | 'universal';
  massAppealScore: number; // 0-100, how much mass-audience DNA
  
  // Thematic elements
  themes: ThematicElement[];
  hasHeroCentricElevation: boolean;
  hasPowerFantasy: boolean;
  hasEmotionalDrama: boolean;
  hasPatrioticElements: boolean;
  hasRomanticSubplot: boolean;
  hasFamilyDrama: boolean;
  hasRevengeNarrative: boolean;
  
  // Production characteristics
  productionScale: 'mega-budget' | 'big-budget' | 'mid-budget' | 'low-budget' | 'unknown';
  visualStyle: 'grand-spectacle' | 'stylized-action' | 'realistic' | 'artistic' | 'standard';
  
  // Star power (Indian cinema specific)
  hasSuperstarLead: boolean;
  starPowerTier: 'pan-india-star' | 'regional-superstar' | 'popular-actor' | 'unknown';
}

export type ThematicElement = 
  | 'heroism' | 'sacrifice' | 'revenge' | 'love' | 'family' | 'friendship'
  | 'patriotism' | 'rebellion' | 'power' | 'justice' | 'survival'
  | 'mythology' | 'history' | 'crime' | 'politics' | 'sports'
  | 'coming-of-age' | 'redemption' | 'betrayal' | 'ambition'
  | 'violence' | 'loyalty' | 'action' | 'drama' | 'romance'
  | 'reincarnation' | 'supernatural' | 'fantasy';

export interface ReferenceMovieInfo {
  id: number;
  title: string;
  type: 'movie' | 'tv';
  originalLanguage: string;
  originalTitle: string;
  productionCountries: string[];
  spokenLanguages: string[];
  genres: number[];
  releaseYear: number | null;
  voteAverage: number;
  voteCount: number;
  popularity: number;
  overview: string;
  
  // Derived cultural context
  industry: CinemaIndustry;
  industryDescription: string;
  preferredLanguages: string[];
  isIndianCinema: boolean;
  isBollywood: boolean;
  isHollywood: boolean;
  isKorean: boolean;
  isJapanese: boolean;
  isChinese: boolean;
  isEuropean: boolean;
  
  // Enhanced cinematic profile
  cinematicProfile: CinematicProfile;
  
  // Legacy thematic fields (for backward compatibility)
  isEpic: boolean;
  isMassHero: boolean;
  isActionHeavy: boolean;
  budget: 'blockbuster' | 'mid-budget' | 'indie' | 'unknown';
}

export type CinemaIndustry = 
  | 'bollywood'      // Hindi cinema
  | 'tollywood'      // Telugu cinema
  | 'kollywood'      // Tamil cinema
  | 'mollywood'      // Malayalam cinema
  | 'sandalwood'     // Kannada cinema
  | 'indian-other'   // Other Indian regional cinema
  | 'hollywood'      // US/English mainstream
  | 'korean'         // Korean cinema
  | 'japanese'       // Japanese cinema
  | 'chinese'        // Chinese/Hong Kong cinema
  | 'european'       // European cinema
  | 'other';         // Other international

/**
 * Enhanced cultural filter rules with STRICT matching
 */
export interface CulturalFilterRules {
  // Language filtering (HARD rules)
  preferredLanguages: string[];       // ISO 639-1 codes - MUST match one
  excludeLanguages: string[];         // Languages to NEVER include
  strictLanguageMatch: boolean;       // If true, ONLY show preferred languages
  
  // Country/Region filtering
  preferredCountries: string[];       // ISO 3166-1 codes
  excludeCountries: string[];         // Countries to exclude
  
  // Industry context
  industry: CinemaIndustry;
  industryDescription: string;
  
  // TMDB query parameters
  withOriginalLanguage?: string;
  withoutOriginalLanguage?: string;
  region?: string;
  
  // Cinematic profile matching (STRICT)
  requiredNarrativeScale: CinematicProfile['narrativeScale'][];
  requiredStorytellingStyles: CinematicProfile['storytellingStyle'][];
  requiredAudienceTypes: CinematicProfile['audienceType'][];
  minimumMassAppealScore: number;     // Minimum score to match (0-100)
  
  // Thematic requirements
  requiredThemes: ThematicElement[];  // At least one must match
  preferredThemes: ThematicElement[]; // Boost score if matches
  
  // Production scale matching
  minimumProductionScale: CinematicProfile['productionScale'];
  
  // Hard exclusion rules
  excludeArtHouse: boolean;
  excludeWesternRemakes: boolean;
  excludeLowBudget: boolean;
  
  // Reference context
  referenceTitle: string;
  referenceId: number;
  referenceProfile: CinematicProfile;
  
  // Justification template
  matchJustificationTemplate: string;
}

// ============================================
// Enhanced Constants
// ============================================

// Indian cinema language codes
const INDIAN_LANGUAGES = ['hi', 'te', 'ta', 'ml', 'kn', 'bn', 'mr', 'pa', 'gu'];
const HINDI_ACCESSIBLE = ['hi', 'te', 'ta', 'ml', 'kn']; // Commonly dubbed to Hindi

// Industry detection by language
const LANGUAGE_TO_INDUSTRY: Record<string, CinemaIndustry> = {
  'hi': 'bollywood',
  'te': 'tollywood',
  'ta': 'kollywood',
  'ml': 'mollywood',
  'kn': 'sandalwood',
  'bn': 'indian-other',
  'mr': 'indian-other',
  'pa': 'indian-other',
  'gu': 'indian-other',
  'en': 'hollywood',
  'ko': 'korean',
  'ja': 'japanese',
  'zh': 'chinese',
  'cn': 'chinese',
  'yue': 'chinese', // Cantonese
  'de': 'european',
  'fr': 'european',
  'es': 'european',
  'it': 'european',
};

// Country to industry mapping
const COUNTRY_TO_INDUSTRY: Record<string, CinemaIndustry> = {
  'IN': 'indian-other', // Will be refined by language
  'US': 'hollywood',
  'GB': 'hollywood',
  'KR': 'korean',
  'JP': 'japanese',
  'CN': 'chinese',
  'HK': 'chinese',
  'TW': 'chinese',
  'DE': 'european',
  'FR': 'european',
  'ES': 'european',
  'IT': 'european',
};

// ============================================
// Enhanced Film Database for Strict Matching
// ============================================

/**
 * Known pan-India mass commercial blockbusters with detailed profiles
 * These are used for strict template matching
 */
const KNOWN_MASS_BLOCKBUSTERS: Record<string, Partial<CinematicProfile>> = {
  // Telugu Mega-Blockbusters
  'baahubali': {
    narrativeScale: 'epic',
    storytellingStyle: 'action-spectacle',
    audienceType: 'mass',
    massAppealScore: 100,
    hasHeroCentricElevation: true,
    hasPowerFantasy: true,
    themes: ['heroism', 'power', 'revenge', 'love', 'family', 'betrayal'],
    productionScale: 'mega-budget',
    visualStyle: 'grand-spectacle',
    hasSuperstarLead: true,
    starPowerTier: 'pan-india-star'
  },
  'bahubali': { /* alias */ },
  'rrr': {
    narrativeScale: 'epic',
    storytellingStyle: 'action-spectacle',
    audienceType: 'mass',
    massAppealScore: 100,
    hasHeroCentricElevation: true,
    hasPowerFantasy: true,
    hasPatrioticElements: true,
    themes: ['heroism', 'friendship', 'patriotism', 'sacrifice', 'rebellion'],
    productionScale: 'mega-budget',
    visualStyle: 'grand-spectacle',
    hasSuperstarLead: true,
    starPowerTier: 'pan-india-star'
  },
  'pushpa': {
    narrativeScale: 'large',
    storytellingStyle: 'commercial-masala',
    audienceType: 'mass',
    massAppealScore: 95,
    hasHeroCentricElevation: true,
    hasPowerFantasy: true,
    themes: ['power', 'ambition', 'rebellion', 'love', 'crime'],
    productionScale: 'big-budget',
    visualStyle: 'stylized-action',
    hasSuperstarLead: true,
    starPowerTier: 'pan-india-star'
  },
  'kgf': {
    narrativeScale: 'epic',
    storytellingStyle: 'action-spectacle',
    audienceType: 'mass',
    massAppealScore: 98,
    hasHeroCentricElevation: true,
    hasPowerFantasy: true,
    themes: ['power', 'revenge', 'ambition', 'sacrifice', 'love'],
    productionScale: 'big-budget',
    visualStyle: 'stylized-action',
    hasSuperstarLead: true,
    starPowerTier: 'pan-india-star'
  },
  'salaar': {
    narrativeScale: 'epic',
    storytellingStyle: 'action-spectacle',
    audienceType: 'mass',
    massAppealScore: 92,
    hasHeroCentricElevation: true,
    hasPowerFantasy: true,
    themes: ['friendship', 'power', 'violence', 'loyalty'],
    productionScale: 'mega-budget',
    visualStyle: 'stylized-action',
    hasSuperstarLead: true,
    starPowerTier: 'pan-india-star'
  },
  'kalki': {
    narrativeScale: 'epic',
    storytellingStyle: 'action-spectacle',
    audienceType: 'mass',
    massAppealScore: 95,
    hasHeroCentricElevation: true,
    hasPowerFantasy: true,
    themes: ['mythology', 'heroism', 'survival', 'sacrifice'],
    productionScale: 'mega-budget',
    visualStyle: 'grand-spectacle',
    hasSuperstarLead: true,
    starPowerTier: 'pan-india-star'
  },
  'devara': {
    narrativeScale: 'large',
    storytellingStyle: 'action-spectacle',
    audienceType: 'mass',
    massAppealScore: 90,
    hasHeroCentricElevation: true,
    hasPowerFantasy: true,
    themes: ['power', 'family', 'crime', 'revenge'],
    productionScale: 'mega-budget',
    visualStyle: 'stylized-action',
    hasSuperstarLead: true,
    starPowerTier: 'pan-india-star'
  },
  'magadheera': {
    narrativeScale: 'epic',
    storytellingStyle: 'commercial-masala',
    audienceType: 'mass',
    massAppealScore: 92,
    hasHeroCentricElevation: true,
    hasPowerFantasy: true,
    hasRomanticSubplot: true,
    themes: ['love', 'heroism', 'history', 'reincarnation'],
    productionScale: 'big-budget',
    visualStyle: 'grand-spectacle',
    hasSuperstarLead: true,
    starPowerTier: 'regional-superstar'
  },
  'saaho': {
    narrativeScale: 'large',
    storytellingStyle: 'action-spectacle',
    audienceType: 'mass',
    massAppealScore: 80,
    hasHeroCentricElevation: true,
    themes: ['crime', 'revenge', 'love'],
    productionScale: 'mega-budget',
    visualStyle: 'stylized-action',
    hasSuperstarLead: true,
    starPowerTier: 'pan-india-star'
  },
  // Hindi Blockbusters
  'animal': {
    narrativeScale: 'large',
    storytellingStyle: 'emotional-drama',
    audienceType: 'mass',
    massAppealScore: 88,
    hasHeroCentricElevation: true,
    hasPowerFantasy: true,
    hasFamilyDrama: true,
    themes: ['family', 'power', 'love', 'violence', 'revenge'],
    productionScale: 'big-budget',
    visualStyle: 'stylized-action',
    hasSuperstarLead: true,
    starPowerTier: 'pan-india-star'
  },
  'pathaan': {
    narrativeScale: 'large',
    storytellingStyle: 'action-spectacle',
    audienceType: 'mass',
    massAppealScore: 90,
    hasHeroCentricElevation: true,
    hasPatrioticElements: true,
    themes: ['patriotism', 'heroism', 'love', 'sacrifice'],
    productionScale: 'mega-budget',
    visualStyle: 'stylized-action',
    hasSuperstarLead: true,
    starPowerTier: 'pan-india-star'
  },
  'jawan': {
    narrativeScale: 'large',
    storytellingStyle: 'commercial-masala',
    audienceType: 'mass',
    massAppealScore: 92,
    hasHeroCentricElevation: true,
    hasPatrioticElements: true,
    themes: ['justice', 'revenge', 'family', 'politics'],
    productionScale: 'mega-budget',
    visualStyle: 'stylized-action',
    hasSuperstarLead: true,
    starPowerTier: 'pan-india-star'
  },
  'tiger': {
    narrativeScale: 'large',
    storytellingStyle: 'action-spectacle',
    audienceType: 'mass',
    massAppealScore: 85,
    hasHeroCentricElevation: true,
    hasPatrioticElements: true,
    hasRomanticSubplot: true,
    themes: ['patriotism', 'love', 'heroism', 'sacrifice'],
    productionScale: 'big-budget',
    visualStyle: 'stylized-action',
    hasSuperstarLead: true,
    starPowerTier: 'pan-india-star'
  },
  'gadar': {
    narrativeScale: 'epic',
    storytellingStyle: 'emotional-drama',
    audienceType: 'mass',
    massAppealScore: 95,
    hasHeroCentricElevation: true,
    hasPatrioticElements: true,
    hasRomanticSubplot: true,
    themes: ['patriotism', 'love', 'family', 'sacrifice'],
    productionScale: 'big-budget',
    visualStyle: 'grand-spectacle',
    hasSuperstarLead: true,
    starPowerTier: 'pan-india-star'
  },
  'dangal': {
    narrativeScale: 'medium',
    storytellingStyle: 'emotional-drama',
    audienceType: 'family',
    massAppealScore: 90,
    hasHeroCentricElevation: true,
    hasFamilyDrama: true,
    themes: ['sports', 'family', 'ambition', 'patriotism'],
    productionScale: 'big-budget',
    visualStyle: 'realistic',
    hasSuperstarLead: true,
    starPowerTier: 'pan-india-star'
  },
  'bajrangi bhaijaan': {
    narrativeScale: 'medium',
    storytellingStyle: 'emotional-drama',
    audienceType: 'family',
    massAppealScore: 92,
    hasHeroCentricElevation: true,
    hasEmotionalDrama: true,
    themes: ['love', 'family', 'friendship', 'patriotism'],
    productionScale: 'big-budget',
    visualStyle: 'realistic',
    hasSuperstarLead: true,
    starPowerTier: 'pan-india-star'
  },
  'padmaavat': {
    narrativeScale: 'epic',
    storytellingStyle: 'action-spectacle',
    audienceType: 'mass',
    massAppealScore: 85,
    hasHeroCentricElevation: true,
    themes: ['history', 'sacrifice', 'love', 'power'],
    productionScale: 'mega-budget',
    visualStyle: 'grand-spectacle',
    hasSuperstarLead: true,
    starPowerTier: 'pan-india-star'
  },
  'tanhaji': {
    narrativeScale: 'epic',
    storytellingStyle: 'action-spectacle',
    audienceType: 'mass',
    massAppealScore: 88,
    hasHeroCentricElevation: true,
    hasPatrioticElements: true,
    themes: ['patriotism', 'heroism', 'history', 'sacrifice'],
    productionScale: 'big-budget',
    visualStyle: 'grand-spectacle',
    hasSuperstarLead: true,
    starPowerTier: 'pan-india-star'
  },
  // Tamil Blockbusters
  'vikram': {
    narrativeScale: 'large',
    storytellingStyle: 'action-spectacle',
    audienceType: 'mass',
    massAppealScore: 90,
    hasHeroCentricElevation: true,
    themes: ['crime', 'revenge', 'power', 'family'],
    productionScale: 'big-budget',
    visualStyle: 'stylized-action',
    hasSuperstarLead: true,
    starPowerTier: 'regional-superstar'
  },
  'leo': {
    narrativeScale: 'large',
    storytellingStyle: 'action-spectacle',
    audienceType: 'mass',
    massAppealScore: 88,
    hasHeroCentricElevation: true,
    hasPowerFantasy: true,
    themes: ['crime', 'family', 'violence', 'redemption'],
    productionScale: 'big-budget',
    visualStyle: 'stylized-action',
    hasSuperstarLead: true,
    starPowerTier: 'pan-india-star'
  },
  'jailer': {
    narrativeScale: 'large',
    storytellingStyle: 'commercial-masala',
    audienceType: 'mass',
    massAppealScore: 92,
    hasHeroCentricElevation: true,
    hasPowerFantasy: true,
    hasFamilyDrama: true,
    themes: ['justice', 'family', 'revenge', 'power'],
    productionScale: 'big-budget',
    visualStyle: 'stylized-action',
    hasSuperstarLead: true,
    starPowerTier: 'regional-superstar'
  },
  'master': {
    narrativeScale: 'medium',
    storytellingStyle: 'commercial-masala',
    audienceType: 'mass',
    massAppealScore: 85,
    hasHeroCentricElevation: true,
    themes: ['justice', 'heroism', 'crime'],
    productionScale: 'big-budget',
    visualStyle: 'stylized-action',
    hasSuperstarLead: true,
    starPowerTier: 'pan-india-star'
  },
  'robot': {
    narrativeScale: 'epic',
    storytellingStyle: 'action-spectacle',
    audienceType: 'mass',
    massAppealScore: 88,
    hasHeroCentricElevation: true,
    hasPowerFantasy: true,
    themes: ['love', 'power', 'heroism', 'sacrifice'],
    productionScale: 'mega-budget',
    visualStyle: 'grand-spectacle',
    hasSuperstarLead: true,
    starPowerTier: 'regional-superstar'
  },
  'enthiran': { /* alias for robot */ },
  '2.0': {
    narrativeScale: 'epic',
    storytellingStyle: 'action-spectacle',
    audienceType: 'mass',
    massAppealScore: 85,
    hasHeroCentricElevation: true,
    hasPowerFantasy: true,
    themes: ['heroism', 'justice', 'power'],
    productionScale: 'mega-budget',
    visualStyle: 'grand-spectacle',
    hasSuperstarLead: true,
    starPowerTier: 'regional-superstar'
  },
};

// Keywords for detecting narrative styles
const EPIC_KEYWORDS = [
  'kingdom', 'empire', 'king', 'queen', 'warrior', 'battle', 'war', 'legend',
  'dynasty', 'throne', 'prince', 'princess', 'saga', 'epic', 'hero',
  'rajah', 'raja', 'rani', 'yoddha', 'sainik', 'yuddh', 'veera', 'veer'
];

const MASS_HERO_KEYWORDS = [
  'mass', 'hero', 'star', 'blockbuster', 'action', 'power', 'rise',
  'king', 'don', 'boss', 'tiger', 'lion', 'storm', 'fire', 'blood'
];

const PATRIOTIC_KEYWORDS = [
  'india', 'desh', 'nation', 'army', 'soldier', 'war', 'freedom',
  'independence', 'patriot', 'border', 'uri', 'surgical'
];

const REVENGE_KEYWORDS = [
  'revenge', 'vengeance', 'badla', 'justice', 'kill', 'blood', 'enemy'
];

// All known Indian commercial blockbusters (for detection)
const KNOWN_INDIAN_EPICS = Object.keys(KNOWN_MASS_BLOCKBUSTERS).concat([
  'eega', 'makkhi', 'chatrapathi', 'vikramarkudu', 'simhadri', 'pokiri', 
  'gabbar singh', 'temper', 'ala vaikunthapurramuloo', 'bheemla nayak',
  'sye raa', 'krish', 'akhanda', 'waltair veerayya', 'veera simha reddy',
  'dhruva', 'arjun reddy', 'kabir singh', 'jersey', 'dear comrade',
  'mahanati', 'rangasthalam', 'bharat ane nenu', 'maharshi', 'vakeel saab',
  'the goat', 'goat', 'thunivu', 'varisu', 'ponniyin selvan', 'ps1', 'ps2',
  'beast', 'bigil', 'sarkar', 'mersal', 'theri', 'kaththi',
  'mankatha', 'vedalam', 'yennai arindhaal', 'arrambam',
  // More recent additions
  'oppenheimer', 'avatar', 'avengers', 'transformers' // NOT Indian - for exclusion
]);

// ============================================
// Reference Movie Extraction
// ============================================

/**
 * Extract movie title from a "movies like X" query
 */
export function extractReferenceTitle(message: string): string | null {
  const patterns = [
    /movies?\s+like\s+['"]?([^'"]+?)['"]?\s*$/i,
    /similar\s+to\s+['"]?([^'"]+?)['"]?\s*$/i,
    /like\s+['"]?([^'"]+?)['"]?\s*$/i,
    /films?\s+like\s+['"]?([^'"]+?)['"]?\s*$/i,
    /shows?\s+like\s+['"]?([^'"]+?)['"]?\s*$/i,
    /more\s+like\s+['"]?([^'"]+?)['"]?\s*$/i,
    /recommend.*like\s+['"]?([^'"]+?)['"]?\s*$/i,
    /something\s+like\s+['"]?([^'"]+?)['"]?\s*$/i,
    /if\s+i\s+liked?\s+['"]?([^'"]+?)['"]?/i,
    /fans?\s+of\s+['"]?([^'"]+?)['"]?/i,
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      // Clean up the extracted title
      let title = match[1].trim();
      // Remove trailing punctuation
      title = title.replace(/[,.!?]+$/, '').trim();
      // Remove common words that might be captured
      title = title.replace(/\s+(movie|film|show|series)s?$/i, '').trim();
      
      if (title.length >= 2) {
        return title;
      }
    }
  }
  
  return null;
}

/**
 * Search for the reference movie in TMDB
 */
export async function findReferenceMovie(
  title: string,
  preferMovies: boolean = true
): Promise<{ movie: Movie | TVShow | null; type: 'movie' | 'tv' }> {
  try {
    // Try movie search first if preferring movies
    if (preferMovies) {
      const movieResults = await searchMovies(title, 1);
      if (movieResults.results.length > 0) {
        // Find best match (exact or close title match)
        const bestMatch = findBestTitleMatch(movieResults.results, title);
        if (bestMatch) {
          return { movie: bestMatch, type: 'movie' };
        }
      }
    }
    
    // Try TV search
    const tvResults = await searchTVShows(title, 1);
    if (tvResults.results.length > 0) {
      const bestMatch = findBestTitleMatch(tvResults.results, title);
      if (bestMatch) {
        return { movie: bestMatch, type: 'tv' };
      }
    }
    
    // If preferring movies failed, try the top movie result
    if (preferMovies) {
      const movieResults = await searchMovies(title, 1);
      if (movieResults.results.length > 0) {
        return { movie: movieResults.results[0], type: 'movie' };
      }
    }
    
    return { movie: null, type: 'movie' };
  } catch (error) {
    console.error('Error finding reference movie:', error);
    return { movie: null, type: 'movie' };
  }
}

/**
 * Find best matching title from search results
 */
function findBestTitleMatch<T extends Movie | TVShow>(
  results: T[],
  searchTitle: string
): T | null {
  const normalizedSearch = searchTitle.toLowerCase().trim();
  
  // First try exact match
  for (const result of results) {
    const title = 'title' in result ? result.title : result.name;
    if (title.toLowerCase() === normalizedSearch) {
      return result;
    }
  }
  
  // Then try starts-with match
  for (const result of results) {
    const title = 'title' in result ? result.title : result.name;
    if (title.toLowerCase().startsWith(normalizedSearch)) {
      return result;
    }
  }
  
  // Then try contains match
  for (const result of results) {
    const title = 'title' in result ? result.title : result.name;
    if (title.toLowerCase().includes(normalizedSearch)) {
      return result;
    }
  }
  
  // Return first result as fallback
  return results[0] || null;
}

// ============================================
// Movie Analysis
// ============================================

/**
 * Analyze a reference movie and extract detailed cinematic profile
 * This creates a STRICT TEMPLATE for matching similar movies
 */
export async function analyzeReferenceMovie(
  movieOrShow: Movie | TVShow,
  type: 'movie' | 'tv'
): Promise<ReferenceMovieInfo> {
  // Get detailed information
  let details: MovieDetails | TVShowDetails | null = null;
  let overview = movieOrShow.overview || '';
  
  try {
    if (type === 'movie') {
      details = await getMovieDetails(movieOrShow.id);
    } else {
      details = await getTVShowDetails(movieOrShow.id);
    }
    if (details && 'overview' in details) {
      overview = details.overview || overview;
    }
  } catch (error) {
    console.error('Error fetching details:', error);
  }
  
  const title = 'title' in movieOrShow ? movieOrShow.title : movieOrShow.name;
  const originalTitle = 'original_title' in movieOrShow 
    ? (movieOrShow.original_title || title) 
    : ('original_name' in movieOrShow ? (movieOrShow.original_name || title) : title);
  const releaseDate = 'release_date' in movieOrShow 
    ? movieOrShow.release_date 
    : movieOrShow.first_air_date;
  const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : null;
  
  // Get production countries and languages from details
  const productionCountries: string[] = [];
  const spokenLanguages: string[] = [];
  
  if (details) {
    if ('production_countries' in details && details.production_countries) {
      for (const country of details.production_countries) {
        productionCountries.push(country.iso_3166_1);
      }
    }
    if ('spoken_languages' in details && details.spoken_languages) {
      for (const lang of details.spoken_languages) {
        spokenLanguages.push(lang.iso_639_1);
      }
    }
  }
  
  const originalLanguage = movieOrShow.original_language;
  const voteCount = movieOrShow.vote_count || 0;
  const popularity = movieOrShow.popularity || 0;
  
  // Determine industry
  const industry = determineIndustry(originalLanguage, productionCountries, title);
  
  // Determine preferred languages based on industry
  const preferredLanguages = getPreferredLanguages(industry, originalLanguage);
  
  // Check cultural flags
  const isIndianCinema = INDIAN_LANGUAGES.includes(originalLanguage) || 
    productionCountries.includes('IN');
  const isBollywood = industry === 'bollywood';
  const isHollywood = industry === 'hollywood';
  const isKorean = industry === 'korean';
  const isJapanese = industry === 'japanese';
  const isChinese = industry === 'chinese';
  const isEuropean = industry === 'european';
  
  // Build the enhanced cinematic profile
  const cinematicProfile = buildCinematicProfile(
    title, 
    overview, 
    movieOrShow.genre_ids, 
    voteCount, 
    popularity,
    isIndianCinema,
    originalLanguage
  );
  
  // Legacy fields (derived from cinematic profile)
  const isEpic = cinematicProfile.narrativeScale === 'epic' || cinematicProfile.narrativeScale === 'large';
  const isMassHero = cinematicProfile.hasHeroCentricElevation && cinematicProfile.massAppealScore > 70;
  const actionGenres = [28, 12, 53];
  const isActionHeavy = movieOrShow.genre_ids.some(g => actionGenres.includes(g));
  
  // Budget from profile
  let budget: 'blockbuster' | 'mid-budget' | 'indie' | 'unknown' = 'unknown';
  if (cinematicProfile.productionScale === 'mega-budget' || cinematicProfile.productionScale === 'big-budget') {
    budget = 'blockbuster';
  } else if (cinematicProfile.productionScale === 'mid-budget') {
    budget = 'mid-budget';
  } else if (cinematicProfile.productionScale === 'low-budget') {
    budget = 'indie';
  }
  
  return {
    id: movieOrShow.id,
    title,
    type,
    originalLanguage,
    originalTitle,
    productionCountries,
    spokenLanguages,
    genres: movieOrShow.genre_ids,
    releaseYear,
    voteAverage: movieOrShow.vote_average,
    voteCount,
    popularity,
    overview,
    industry,
    industryDescription: getIndustryDescription(industry),
    preferredLanguages,
    isIndianCinema,
    isBollywood,
    isHollywood,
    isKorean,
    isJapanese,
    isChinese,
    isEuropean,
    cinematicProfile,
    isEpic,
    isMassHero,
    isActionHeavy,
    budget
  };
}

/**
 * Build a detailed cinematic profile from movie data
 */
function buildCinematicProfile(
  title: string,
  overview: string,
  genreIds: number[],
  voteCount: number,
  popularity: number,
  isIndianCinema: boolean,
  originalLanguage: string
): CinematicProfile {
  const titleLower = title.toLowerCase();
  const overviewLower = overview.toLowerCase();
  const combinedText = `${titleLower} ${overviewLower}`;
  
  // Check if this is a known blockbuster with pre-defined profile
  const knownProfile = findKnownProfile(titleLower);
  if (knownProfile) {
    return fillProfileDefaults(knownProfile);
  }
  
  // Analyze narrative scale
  const narrativeScale = analyzeNarrativeScale(combinedText, genreIds, voteCount, popularity);
  
  // Analyze storytelling style
  const storytellingStyle = analyzeStorytellingStyle(combinedText, genreIds, isIndianCinema);
  
  // Analyze audience type
  const audienceType = analyzeAudienceType(genreIds, combinedText, isIndianCinema);
  
  // Calculate mass appeal score
  const massAppealScore = calculateMassAppealScore(
    narrativeScale, storytellingStyle, audienceType, voteCount, popularity, isIndianCinema
  );
  
  // Detect themes
  const themes = detectThemes(combinedText, genreIds);
  
  // Thematic flags
  const hasHeroCentricElevation = detectHeroCentricNarrative(combinedText, isIndianCinema);
  const hasPowerFantasy = themes.includes('power') || themes.includes('revenge') || 
    MASS_HERO_KEYWORDS.some(kw => combinedText.includes(kw));
  const hasEmotionalDrama = themes.includes('family') || themes.includes('love') || 
    genreIds.includes(18); // Drama genre
  const hasPatrioticElements = PATRIOTIC_KEYWORDS.some(kw => combinedText.includes(kw)) ||
    themes.includes('patriotism');
  const hasRomanticSubplot = themes.includes('love') || genreIds.includes(10749); // Romance genre
  const hasFamilyDrama = themes.includes('family') || combinedText.includes('father') || 
    combinedText.includes('mother') || combinedText.includes('son') || combinedText.includes('daughter');
  const hasRevengeNarrative = REVENGE_KEYWORDS.some(kw => combinedText.includes(kw));
  
  // Production scale estimation
  const productionScale = estimateProductionScale(voteCount, popularity, narrativeScale, isIndianCinema);
  
  // Visual style
  const visualStyle = estimateVisualStyle(narrativeScale, storytellingStyle, productionScale);
  
  // Star power (for Indian cinema)
  const hasSuperstarLead = isIndianCinema && (voteCount > 10000 || popularity > 50);
  const starPowerTier = estimateStarPowerTier(voteCount, popularity, isIndianCinema);
  
  return {
    narrativeScale,
    storytellingStyle,
    pacing: narrativeScale === 'epic' ? 'fast' : 'moderate',
    audienceType,
    massAppealScore,
    themes,
    hasHeroCentricElevation,
    hasPowerFantasy,
    hasEmotionalDrama,
    hasPatrioticElements,
    hasRomanticSubplot,
    hasFamilyDrama,
    hasRevengeNarrative,
    productionScale,
    visualStyle,
    hasSuperstarLead,
    starPowerTier
  };
}

/**
 * Find a known profile for a blockbuster movie
 */
function findKnownProfile(titleLower: string): Partial<CinematicProfile> | null {
  for (const [key, profile] of Object.entries(KNOWN_MASS_BLOCKBUSTERS)) {
    if (titleLower.includes(key) && profile.narrativeScale) { // Skip empty aliases
      return profile;
    }
  }
  return null;
}

/**
 * Fill in default values for a partial profile
 */
function fillProfileDefaults(partial: Partial<CinematicProfile>): CinematicProfile {
  return {
    narrativeScale: partial.narrativeScale || 'large',
    storytellingStyle: partial.storytellingStyle || 'commercial-masala',
    pacing: partial.pacing || 'fast',
    audienceType: partial.audienceType || 'mass',
    massAppealScore: partial.massAppealScore || 80,
    themes: partial.themes || ['heroism', 'power'],
    hasHeroCentricElevation: partial.hasHeroCentricElevation ?? true,
    hasPowerFantasy: partial.hasPowerFantasy ?? false,
    hasEmotionalDrama: partial.hasEmotionalDrama ?? false,
    hasPatrioticElements: partial.hasPatrioticElements ?? false,
    hasRomanticSubplot: partial.hasRomanticSubplot ?? false,
    hasFamilyDrama: partial.hasFamilyDrama ?? false,
    hasRevengeNarrative: partial.hasRevengeNarrative ?? false,
    productionScale: partial.productionScale || 'big-budget',
    visualStyle: partial.visualStyle || 'stylized-action',
    hasSuperstarLead: partial.hasSuperstarLead ?? true,
    starPowerTier: partial.starPowerTier || 'regional-superstar'
  };
}

/**
 * Analyze narrative scale from content
 */
function analyzeNarrativeScale(
  text: string, 
  genreIds: number[], 
  voteCount: number, 
  popularity: number
): CinematicProfile['narrativeScale'] {
  // Epic indicators
  if (EPIC_KEYWORDS.some(kw => text.includes(kw))) {
    return 'epic';
  }
  
  // High production = likely large scale
  if (voteCount > 10000 && popularity > 100) {
    return 'large';
  }
  
  // Action/Adventure genres with high popularity
  if ((genreIds.includes(28) || genreIds.includes(12)) && voteCount > 5000) {
    return 'large';
  }
  
  // Drama-focused = more intimate
  if (genreIds.includes(18) && !genreIds.includes(28)) {
    return 'medium';
  }
  
  // Romance/Comedy = intimate
  if (genreIds.includes(10749) || genreIds.includes(35)) {
    return 'medium';
  }
  
  return 'unknown';
}

/**
 * Analyze storytelling style
 */
function analyzeStorytellingStyle(
  text: string, 
  genreIds: number[], 
  isIndianCinema: boolean
): CinematicProfile['storytellingStyle'] {
  // Indian commercial cinema detection
  if (isIndianCinema) {
    if (genreIds.includes(28) && (genreIds.includes(10749) || genreIds.includes(35))) {
      return 'commercial-masala'; // Action + Romance/Comedy = Masala
    }
    if (genreIds.includes(28) && !genreIds.includes(18)) {
      return 'action-spectacle';
    }
    if (genreIds.includes(18) && !genreIds.includes(28)) {
      return 'emotional-drama';
    }
  }
  
  // Genre-based detection
  if (genreIds.includes(53) || genreIds.includes(9648)) { // Thriller, Mystery
    return 'thriller-suspense';
  }
  if (genreIds.includes(35) && !genreIds.includes(28)) { // Comedy only
    return 'comedy-entertainment';
  }
  if (genreIds.includes(28) || genreIds.includes(12)) { // Action, Adventure
    return 'action-spectacle';
  }
  if (genreIds.includes(18)) { // Drama
    return 'emotional-drama';
  }
  
  return 'mixed';
}

/**
 * Analyze target audience type
 */
function analyzeAudienceType(
  genreIds: number[], 
  text: string, 
  isIndianCinema: boolean
): CinematicProfile['audienceType'] {
  // Family-friendly indicators
  if (genreIds.includes(10751) || genreIds.includes(16)) { // Family, Animation
    return 'family';
  }
  
  // Youth-oriented
  if (text.includes('college') || text.includes('youth') || text.includes('young')) {
    return 'youth';
  }
  
  // Indian mass commercial cinema
  if (isIndianCinema && genreIds.includes(28)) {
    return 'mass';
  }
  
  // Art house / niche
  if (genreIds.includes(99) || genreIds.includes(36)) { // Documentary, History
    return 'niche';
  }
  
  // Default based on popularity
  return 'universal';
}

/**
 * Calculate mass appeal score (0-100)
 */
function calculateMassAppealScore(
  narrativeScale: CinematicProfile['narrativeScale'],
  storytellingStyle: CinematicProfile['storytellingStyle'],
  audienceType: CinematicProfile['audienceType'],
  voteCount: number,
  popularity: number,
  isIndianCinema: boolean
): number {
  let score = 50; // Base score
  
  // Narrative scale bonus
  if (narrativeScale === 'epic') score += 25;
  else if (narrativeScale === 'large') score += 15;
  else if (narrativeScale === 'medium') score += 5;
  
  // Storytelling style bonus
  if (storytellingStyle === 'commercial-masala') score += 20;
  else if (storytellingStyle === 'action-spectacle') score += 15;
  else if (storytellingStyle === 'emotional-drama') score += 10;
  
  // Audience type bonus
  if (audienceType === 'mass') score += 15;
  else if (audienceType === 'family') score += 10;
  else if (audienceType === 'universal') score += 5;
  
  // Popularity metrics
  if (voteCount > 20000) score += 10;
  else if (voteCount > 10000) score += 7;
  else if (voteCount > 5000) score += 5;
  
  if (popularity > 100) score += 5;
  
  // Indian cinema bonus (for matching Indian blockbusters)
  if (isIndianCinema) score += 5;
  
  return Math.min(100, Math.max(0, score));
}

/**
 * Detect thematic elements
 */
function detectThemes(text: string, genreIds: number[]): ThematicElement[] {
  const themes: ThematicElement[] = [];
  
  // Keyword-based detection
  if (text.includes('hero') || text.includes('save') || text.includes('protect')) themes.push('heroism');
  if (text.includes('sacrifice') || text.includes('give up') || text.includes('die for')) themes.push('sacrifice');
  if (REVENGE_KEYWORDS.some(kw => text.includes(kw))) themes.push('revenge');
  if (text.includes('love') || text.includes('romance') || text.includes('heart')) themes.push('love');
  if (text.includes('family') || text.includes('father') || text.includes('mother')) themes.push('family');
  if (text.includes('friend') || text.includes('brotherhood') || text.includes('bond')) themes.push('friendship');
  if (PATRIOTIC_KEYWORDS.some(kw => text.includes(kw))) themes.push('patriotism');
  if (text.includes('rebel') || text.includes('fight against') || text.includes('uprising')) themes.push('rebellion');
  if (text.includes('power') || text.includes('rule') || text.includes('control')) themes.push('power');
  if (text.includes('justice') || text.includes('right') || text.includes('wrong')) themes.push('justice');
  if (text.includes('survive') || text.includes('survival') || text.includes('escape')) themes.push('survival');
  if (text.includes('myth') || text.includes('god') || text.includes('divine')) themes.push('mythology');
  if (text.includes('history') || text.includes('ancient') || text.includes('century')) themes.push('history');
  if (text.includes('crime') || text.includes('criminal') || text.includes('mafia')) themes.push('crime');
  if (text.includes('politic') || text.includes('government') || text.includes('minister')) themes.push('politics');
  if (text.includes('sport') || text.includes('game') || text.includes('championship')) themes.push('sports');
  
  // Genre-based themes
  if (genreIds.includes(10752)) themes.push('patriotism'); // War
  if (genreIds.includes(36)) themes.push('history'); // History
  if (genreIds.includes(80)) themes.push('crime'); // Crime
  if (genreIds.includes(10749) && !themes.includes('love')) themes.push('love'); // Romance
  
  // Remove duplicates using filter
  return themes.filter((theme, index) => themes.indexOf(theme) === index);
}

/**
 * Detect hero-centric elevation narrative
 */
function detectHeroCentricNarrative(text: string, isIndianCinema: boolean): boolean {
  const heroIndicators = [
    'hero', 'legendary', 'unbeatable', 'invincible', 'powerful',
    'mass', 'superstar', 'king', 'emperor', 'warrior', 'champion',
    'rise', 'becomes', 'transforms', 'chosen one'
  ];
  
  const hasHeroKeywords = heroIndicators.some(kw => text.includes(kw));
  
  // Indian commercial cinema often has hero-centric narratives
  if (isIndianCinema && hasHeroKeywords) {
    return true;
  }
  
  return hasHeroKeywords;
}

/**
 * Estimate production scale
 */
function estimateProductionScale(
  voteCount: number, 
  popularity: number, 
  narrativeScale: CinematicProfile['narrativeScale'],
  isIndianCinema: boolean
): CinematicProfile['productionScale'] {
  // Epic narratives are usually high budget
  if (narrativeScale === 'epic' && voteCount > 5000) {
    return 'mega-budget';
  }
  
  // High popularity and votes
  if (voteCount > 20000 && popularity > 100) {
    return 'mega-budget';
  }
  if (voteCount > 10000 || popularity > 80) {
    return 'big-budget';
  }
  if (voteCount > 2000) {
    return 'mid-budget';
  }
  
  return 'unknown';
}

/**
 * Estimate visual style
 */
function estimateVisualStyle(
  narrativeScale: CinematicProfile['narrativeScale'],
  storytellingStyle: CinematicProfile['storytellingStyle'],
  productionScale: CinematicProfile['productionScale']
): CinematicProfile['visualStyle'] {
  if (narrativeScale === 'epic' && productionScale === 'mega-budget') {
    return 'grand-spectacle';
  }
  if (storytellingStyle === 'action-spectacle') {
    return 'stylized-action';
  }
  if (storytellingStyle === 'emotional-drama') {
    return 'realistic';
  }
  if (storytellingStyle === 'art-house') {
    return 'artistic';
  }
  return 'standard';
}

/**
 * Estimate star power tier
 */
function estimateStarPowerTier(
  voteCount: number, 
  popularity: number, 
  isIndianCinema: boolean
): CinematicProfile['starPowerTier'] {
  if (!isIndianCinema) {
    return 'unknown';
  }
  
  if (voteCount > 20000 || popularity > 150) {
    return 'pan-india-star';
  }
  if (voteCount > 10000 || popularity > 80) {
    return 'regional-superstar';
  }
  if (voteCount > 5000) {
    return 'popular-actor';
  }
  
  return 'unknown';
}

/**
 * Determine the cinema industry based on language and country
 */
function determineIndustry(
  originalLanguage: string,
  productionCountries: string[],
  title: string
): CinemaIndustry {
  // Check language first
  if (LANGUAGE_TO_INDUSTRY[originalLanguage]) {
    const industry = LANGUAGE_TO_INDUSTRY[originalLanguage];
    
    // For Indian languages, be more specific
    if (originalLanguage === 'hi') return 'bollywood';
    if (originalLanguage === 'te') return 'tollywood';
    if (originalLanguage === 'ta') return 'kollywood';
    if (originalLanguage === 'ml') return 'mollywood';
    if (originalLanguage === 'kn') return 'sandalwood';
    
    return industry;
  }
  
  // Check production countries
  for (const country of productionCountries) {
    if (COUNTRY_TO_INDUSTRY[country]) {
      return COUNTRY_TO_INDUSTRY[country];
    }
  }
  
  // Check for known Indian film patterns in title
  const titleLower = title.toLowerCase();
  if (KNOWN_INDIAN_EPICS.some(epic => titleLower.includes(epic))) {
    return 'tollywood'; // Most known epics are Telugu
  }
  
  return 'other';
}

/**
 * Get preferred languages for recommendations based on industry
 */
function getPreferredLanguages(industry: CinemaIndustry, originalLanguage: string): string[] {
  switch (industry) {
    case 'bollywood':
      return ['hi', 'te', 'ta']; // Hindi and commonly dubbed languages
    case 'tollywood':
      return ['te', 'hi', 'ta', 'kn']; // Telugu, Hindi (dubbed), Tamil, Kannada
    case 'kollywood':
      return ['ta', 'hi', 'te', 'ml']; // Tamil, Hindi (dubbed), Telugu, Malayalam
    case 'mollywood':
      return ['ml', 'hi', 'ta']; // Malayalam, Hindi (dubbed), Tamil
    case 'sandalwood':
      return ['kn', 'hi', 'te', 'ta']; // Kannada, Hindi (dubbed), Telugu, Tamil
    case 'indian-other':
      return ['hi', ...INDIAN_LANGUAGES]; // Hindi first, then other Indian languages
    case 'korean':
      return ['ko']; // Korean only
    case 'japanese':
      return ['ja']; // Japanese only
    case 'chinese':
      return ['zh', 'cn', 'yue']; // Chinese languages
    case 'european':
      return [originalLanguage, 'en']; // Original + English
    case 'hollywood':
      return ['en']; // English
    default:
      return [originalLanguage];
  }
}

// ============================================
// Filter Generation
// ============================================

/**
 * Generate STRICT cultural filter rules based on reference movie analysis
 * These rules treat the reference as a strict template, not loose inspiration
 */
export function generateCulturalFilters(info: ReferenceMovieInfo): CulturalFilterRules {
  const profile = info.cinematicProfile;
  
  // Build strict filter rules
  const rules: CulturalFilterRules = {
    // Language filtering (STRICT)
    preferredLanguages: info.preferredLanguages,
    excludeLanguages: [],
    strictLanguageMatch: info.isIndianCinema, // Strict for Indian cinema
    
    // Country/Region filtering
    preferredCountries: [],
    excludeCountries: [],
    
    // Industry context
    industry: info.industry,
    industryDescription: getIndustryDescription(info.industry),
    
    // Cinematic profile matching (STRICT)
    requiredNarrativeScale: getRequiredNarrativeScales(profile.narrativeScale),
    requiredStorytellingStyles: getRequiredStorytellingStyles(profile.storytellingStyle),
    requiredAudienceTypes: getRequiredAudienceTypes(profile.audienceType),
    minimumMassAppealScore: calculateMinimumMassAppeal(profile.massAppealScore),
    
    // Thematic requirements
    requiredThemes: profile.themes.slice(0, 3), // Top 3 themes must match at least one
    preferredThemes: profile.themes,
    
    // Production scale matching
    minimumProductionScale: getMinimumProductionScale(profile.productionScale),
    
    // Hard exclusion rules
    excludeArtHouse: profile.storytellingStyle !== 'art-house' && profile.massAppealScore > 60,
    excludeWesternRemakes: info.isIndianCinema,
    excludeLowBudget: profile.productionScale === 'mega-budget' || profile.productionScale === 'big-budget',
    
    // Reference context
    referenceTitle: info.title,
    referenceId: info.id,
    referenceProfile: profile,
    
    // Justification template
    matchJustificationTemplate: buildJustificationTemplate(info, profile)
  };
  
  // Apply HARD language filtering based on cinema industry
  if (info.isIndianCinema) {
    // For Indian cinema: STRICT language matching
    rules.preferredCountries = ['IN'];
    rules.excludeLanguages = ['en']; // HARD EXCLUDE English
    rules.excludeCountries = ['US', 'GB']; // Exclude Hollywood productions
    rules.strictLanguageMatch = true;
    
    // Use original language as primary filter
    rules.withOriginalLanguage = info.originalLanguage;
    
    // For pan-India blockbusters, allow related Indian languages
    if (profile.massAppealScore >= 85) {
      // Don't filter by single language, but exclude English
      rules.withOriginalLanguage = undefined; // Allow any Indian language
      rules.withoutOriginalLanguage = 'en'; // But exclude English
    }
  } else if (info.isKorean) {
    rules.preferredCountries = ['KR'];
    rules.excludeCountries = ['US', 'GB', 'IN'];
    rules.withOriginalLanguage = 'ko';
    rules.strictLanguageMatch = true;
  } else if (info.isJapanese) {
    rules.preferredCountries = ['JP'];
    rules.excludeCountries = ['US', 'GB'];
    rules.withOriginalLanguage = 'ja';
    rules.strictLanguageMatch = true;
  } else if (info.isChinese) {
    rules.preferredCountries = ['CN', 'HK', 'TW'];
    rules.withOriginalLanguage = 'zh';
    rules.strictLanguageMatch = true;
  } else if (info.isHollywood) {
    rules.withOriginalLanguage = 'en';
    rules.strictLanguageMatch = false; // Hollywood is more flexible
  }
  
  return rules;
}

/**
 * Get required narrative scales for strict matching
 */
function getRequiredNarrativeScales(scale: CinematicProfile['narrativeScale']): CinematicProfile['narrativeScale'][] {
  switch (scale) {
    case 'epic':
      return ['epic', 'large']; // Only epic or large
    case 'large':
      return ['epic', 'large']; // Allow epic upgrades
    case 'medium':
      return ['medium', 'large']; // Allow some flexibility
    case 'intimate':
      return ['intimate', 'medium']; // Similar intimacy
    default:
      return ['epic', 'large', 'medium']; // Flexible for unknown
  }
}

/**
 * Get required storytelling styles for strict matching
 */
function getRequiredStorytellingStyles(style: CinematicProfile['storytellingStyle']): CinematicProfile['storytellingStyle'][] {
  switch (style) {
    case 'commercial-masala':
      return ['commercial-masala', 'action-spectacle']; // Indian commercial cinema
    case 'action-spectacle':
      return ['action-spectacle', 'commercial-masala']; // High-octane action
    case 'emotional-drama':
      return ['emotional-drama', 'commercial-masala']; // Drama-focused
    case 'thriller-suspense':
      return ['thriller-suspense']; // Strict for thrillers
    case 'comedy-entertainment':
      return ['comedy-entertainment', 'commercial-masala']; // Light entertainment
    case 'art-house':
      return ['art-house']; // Very strict for art films
    default:
      return ['commercial-masala', 'action-spectacle', 'emotional-drama'];
  }
}

/**
 * Get required audience types for strict matching
 */
function getRequiredAudienceTypes(audience: CinematicProfile['audienceType']): CinematicProfile['audienceType'][] {
  switch (audience) {
    case 'mass':
      return ['mass', 'universal']; // Mass-audience DNA
    case 'family':
      return ['family', 'universal']; // Family-friendly
    case 'youth':
      return ['youth', 'mass']; // Young audience
    case 'mature':
      return ['mature']; // Strict for mature content
    case 'niche':
      return ['niche']; // Strict for niche films
    default:
      return ['mass', 'family', 'universal'];
  }
}

/**
 * Calculate minimum mass appeal score for matching
 */
function calculateMinimumMassAppeal(score: number): number {
  // For high mass appeal movies, require similar mass appeal
  if (score >= 90) return 75; // Very popular - need similar appeal
  if (score >= 80) return 65; // Popular - moderate flexibility
  if (score >= 70) return 55; // Average - more flexibility
  return 40; // Low appeal - flexible
}

/**
 * Get minimum production scale for matching
 */
function getMinimumProductionScale(scale: CinematicProfile['productionScale']): CinematicProfile['productionScale'] {
  switch (scale) {
    case 'mega-budget':
      return 'big-budget'; // At least big-budget
    case 'big-budget':
      return 'mid-budget'; // At least mid-budget
    default:
      return 'unknown'; // Flexible
  }
}

/**
 * Build justification template for explaining matches
 */
function buildJustificationTemplate(info: ReferenceMovieInfo, profile: CinematicProfile): string {
  const parts: string[] = [];
  
  // Industry match
  parts.push(`Same ${info.industryDescription}`);
  
  // Scale match
  if (profile.narrativeScale === 'epic') {
    parts.push('epic storytelling scale');
  } else if (profile.narrativeScale === 'large') {
    parts.push('large-scale production');
  }
  
  // Thematic match
  if (profile.hasHeroCentricElevation) {
    parts.push('hero-centric elevation');
  }
  if (profile.hasPowerFantasy) {
    parts.push('power fantasy narrative');
  }
  if (profile.hasPatrioticElements) {
    parts.push('patriotic elements');
  }
  
  // Style match
  if (profile.storytellingStyle === 'commercial-masala') {
    parts.push('commercial masala entertainment');
  } else if (profile.storytellingStyle === 'action-spectacle') {
    parts.push('action spectacle');
  }
  
  return parts.join(' • ');
}

/**
 * Get human-readable industry description
 */
function getIndustryDescription(industry: CinemaIndustry): string {
  const descriptions: Record<CinemaIndustry, string> = {
    'bollywood': 'Hindi cinema (Bollywood)',
    'tollywood': 'Telugu cinema (Tollywood)',
    'kollywood': 'Tamil cinema (Kollywood)',
    'mollywood': 'Malayalam cinema (Mollywood)',
    'sandalwood': 'Kannada cinema (Sandalwood)',
    'indian-other': 'Indian regional cinema',
    'hollywood': 'English/Hollywood cinema',
    'korean': 'Korean cinema (K-movies)',
    'japanese': 'Japanese cinema',
    'chinese': 'Chinese cinema',
    'european': 'European cinema',
    'other': 'International cinema'
  };
  
  return descriptions[industry];
}

// ============================================
// Main Analysis Function
// ============================================

/**
 * Complete reference movie analysis pipeline
 */
export async function analyzeReferenceFromQuery(
  message: string
): Promise<{ info: ReferenceMovieInfo; filters: CulturalFilterRules } | null> {
  // Extract title from query
  const title = extractReferenceTitle(message);
  if (!title) {
    return null;
  }
  
  // Find the movie in TMDB
  const { movie, type } = await findReferenceMovie(title);
  if (!movie) {
    return null;
  }
  
  // Analyze the movie
  const info = await analyzeReferenceMovie(movie, type);
  
  // Generate cultural filters
  const filters = generateCulturalFilters(info);
  
  return { info, filters };
}

/**
 * Generate response intro based on reference movie with detailed explanation
 */
export function generateSimilarMovieIntro(info: ReferenceMovieInfo): string {
  const profile = info.cinematicProfile;
  const parts: string[] = [];
  
  parts.push(`Since you loved **${info.title}**`);
  
  // Add specific context based on the movie's profile
  if (info.isIndianCinema) {
    if (profile.narrativeScale === 'epic' && profile.massAppealScore >= 90) {
      parts.push(`I'm looking for ${info.industryDescription} blockbusters with the same epic scale, mass-hero appeal, and grand storytelling`);
    } else if (profile.hasHeroCentricElevation && profile.hasPowerFantasy) {
      parts.push(`here are similar ${info.industryDescription} films with powerful hero-centric narratives and mass appeal`);
    } else if (profile.storytellingStyle === 'emotional-drama') {
      parts.push(`these ${info.industryDescription} films share similar emotional depth and storytelling`);
    } else {
      parts.push(`check out these ${info.industryDescription} films with a similar vibe`);
    }
  } else if (info.isKorean) {
    parts.push('here are Korean films with similar intensity and storytelling');
  } else if (info.isJapanese) {
    parts.push('here are Japanese films with a similar aesthetic and narrative');
  } else {
    parts.push('here are films that match its style and appeal');
  }
  
  return parts.join(', ') + ':';
}

/**
 * Generate justification for why a movie matches the reference
 */
export function generateMatchJustification(
  referenceInfo: ReferenceMovieInfo,
  matchTitle: string,
  matchLanguage: string,
  matchGenres: number[]
): string {
  const profile = referenceInfo.cinematicProfile;
  const justifications: string[] = [];
  
  // Language/Industry match
  if (matchLanguage === referenceInfo.originalLanguage) {
    justifications.push(`Same ${referenceInfo.industryDescription}`);
  } else if (INDIAN_LANGUAGES.includes(matchLanguage) && referenceInfo.isIndianCinema) {
    justifications.push('Indian cinema');
  }
  
  // Genre overlap
  const actionGenres = [28, 12, 53];
  const dramaGenres = [18, 10749];
  const hasActionOverlap = matchGenres.some(g => actionGenres.includes(g)) && 
    referenceInfo.genres.some(g => actionGenres.includes(g));
  const hasDramaOverlap = matchGenres.some(g => dramaGenres.includes(g)) && 
    referenceInfo.genres.some(g => dramaGenres.includes(g));
  
  if (hasActionOverlap && profile.storytellingStyle === 'action-spectacle') {
    justifications.push('action spectacle');
  }
  if (hasDramaOverlap) {
    justifications.push('emotional drama');
  }
  
  // Thematic similarity
  if (profile.hasHeroCentricElevation) {
    justifications.push('hero-centric narrative');
  }
  if (profile.hasPowerFantasy) {
    justifications.push('power fantasy');
  }
  if (profile.narrativeScale === 'epic') {
    justifications.push('epic scale');
  }
  
  if (justifications.length === 0) {
    justifications.push('similar appeal');
  }
  
  return justifications.slice(0, 3).join(' • ');
}

/**
 * Generate detailed explanation of why recommendations match
 */
export function generateMatchExplanation(info: ReferenceMovieInfo): string {
  const profile = info.cinematicProfile;
  const points: string[] = [];
  
  // Explain the matching criteria
  if (info.isIndianCinema) {
    points.push(`These are ${info.industryDescription} films`);
    
    if (profile.massAppealScore >= 85) {
      points.push('with strong mass appeal');
    }
    if (profile.narrativeScale === 'epic' || profile.narrativeScale === 'large') {
      points.push('featuring large-scale storytelling');
    }
    if (profile.hasHeroCentricElevation) {
      points.push('and hero-centric elevation');
    }
    if (profile.hasPowerFantasy) {
      points.push('with power fantasy elements');
    }
  } else {
    points.push(`Films from the same ${info.industryDescription} with similar themes`);
  }
  
  // Add note about exclusions
  if (info.isIndianCinema) {
    points.push('(I\'ve excluded English/Hollywood films to match your cultural preference)');
  }
  
  return points.join(' ');
}

export default {
  extractReferenceTitle,
  findReferenceMovie,
  analyzeReferenceMovie,
  generateCulturalFilters,
  analyzeReferenceFromQuery,
  generateSimilarMovieIntro,
  generateMatchJustification,
  generateMatchExplanation
};
