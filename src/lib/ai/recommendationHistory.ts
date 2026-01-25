/**
 * Recommendation History Tracker
 * 
 * Tracks previously recommended content within a conversation to:
 * - Prevent repetitive recommendations
 * - Enforce diversity constraints
 * - Apply cooldown windows
 * - Calculate similarity penalties
 */

import { MediaItem } from './chatService';

// ============================================
// Types
// ============================================

export interface RecommendedItem {
  id: number;
  type: 'movie' | 'tv';
  title: string;
  genreIds: number[];
  releaseYear: number | null;
  voteAverage: number;
  timestamp: number;
  turnIndex: number; // Which conversation turn this was recommended in
}

export interface RecommendationContext {
  genres: number[];
  moods: string[];
  era: string | null;
  keywords: string[];
}

export interface DiversityMetrics {
  genreDistribution: Map<number, number>;
  eraDistribution: Map<string, number>;
  popularityBuckets: { high: number; medium: number; low: number };
  franchiseKeywords: Set<string>;
  recentActors: Set<string>;
}

export interface FilterRules {
  excludeIds: Set<string>; // "movie-123" or "tv-456" format
  excludeGenreCombos: number[][]; // Genre combinations to avoid
  excludeFranchises: string[];
  preferredPopularityRange: { min: number; max: number };
  preferredEras: string[];
  cooldownGenres: Map<number, number>; // Genre ID -> turns until available
}

// ============================================
// Constants
// ============================================

const COOLDOWN_TURNS = 3; // How many turns before a genre can be heavily featured again
const MAX_SAME_GENRE_CONSECUTIVE = 2; // Max items from same primary genre in one response
const SIMILARITY_THRESHOLD = 0.7; // Threshold for considering items too similar
const FRANCHISE_KEYWORDS = [
  'avengers', 'marvel', 'star wars', 'harry potter', 'lord of the rings',
  'fast furious', 'transformers', 'jurassic', 'mission impossible', 'james bond',
  'spider-man', 'batman', 'superman', 'x-men', 'pirates caribbean', 'toy story',
  'frozen', 'shrek', 'matrix', 'terminator', 'alien', 'predator', 'rocky',
  'john wick', 'indiana jones', 'back to future', 'godfather', 'bourne'
];

// ============================================
// Recommendation History Class
// ============================================

export class RecommendationHistory {
  private history: RecommendedItem[] = [];
  private contextHistory: RecommendationContext[] = [];
  private currentTurn: number = 0;
  private diversityMetrics: DiversityMetrics;
  
  constructor() {
    this.diversityMetrics = this.initDiversityMetrics();
  }
  
  private initDiversityMetrics(): DiversityMetrics {
    return {
      genreDistribution: new Map(),
      eraDistribution: new Map(),
      popularityBuckets: { high: 0, medium: 0, low: 0 },
      franchiseKeywords: new Set(),
      recentActors: new Set()
    };
  }
  
  /**
   * Start a new conversation turn
   */
  startNewTurn(): void {
    this.currentTurn++;
  }
  
  /**
   * Get current turn index
   */
  getCurrentTurn(): number {
    return this.currentTurn;
  }
  
  /**
   * Add items to recommendation history
   */
  addRecommendations(items: MediaItem[]): void {
    const timestamp = Date.now();
    
    for (const item of items) {
      const year = item.releaseDate ? new Date(item.releaseDate).getFullYear() : null;
      
      const recommended: RecommendedItem = {
        id: item.id,
        type: item.type,
        title: item.title,
        genreIds: item.genreIds,
        releaseYear: year,
        voteAverage: item.voteAverage,
        timestamp,
        turnIndex: this.currentTurn
      };
      
      this.history.push(recommended);
      this.updateDiversityMetrics(recommended);
    }
  }
  
  /**
   * Add context for this turn's query
   */
  addContext(context: RecommendationContext): void {
    this.contextHistory.push(context);
  }
  
  /**
   * Update diversity metrics with new recommendation
   */
  private updateDiversityMetrics(item: RecommendedItem): void {
    // Update genre distribution
    for (const genreId of item.genreIds) {
      const count = this.diversityMetrics.genreDistribution.get(genreId) || 0;
      this.diversityMetrics.genreDistribution.set(genreId, count + 1);
    }
    
    // Update era distribution
    if (item.releaseYear) {
      const era = this.getEraFromYear(item.releaseYear);
      const count = this.diversityMetrics.eraDistribution.get(era) || 0;
      this.diversityMetrics.eraDistribution.set(era, count + 1);
    }
    
    // Update popularity buckets
    if (item.voteAverage >= 7.5) {
      this.diversityMetrics.popularityBuckets.high++;
    } else if (item.voteAverage >= 6) {
      this.diversityMetrics.popularityBuckets.medium++;
    } else {
      this.diversityMetrics.popularityBuckets.low++;
    }
    
    // Track franchise keywords
    const lowerTitle = item.title.toLowerCase();
    for (const franchise of FRANCHISE_KEYWORDS) {
      if (lowerTitle.includes(franchise)) {
        this.diversityMetrics.franchiseKeywords.add(franchise);
      }
    }
  }
  
  /**
   * Get era string from year
   */
  private getEraFromYear(year: number): string {
    if (year >= 2020) return '2020s';
    if (year >= 2010) return '2010s';
    if (year >= 2000) return '2000s';
    if (year >= 1990) return '90s';
    if (year >= 1980) return '80s';
    return 'classic';
  }
  
  /**
   * Check if an item was already recommended
   */
  wasRecommended(id: number, type: 'movie' | 'tv'): boolean {
    return this.history.some(item => item.id === id && item.type === type);
  }
  
  /**
   * Get all previously recommended IDs as a Set
   */
  getRecommendedIds(): Set<string> {
    const ids = new Set<string>();
    for (const item of this.history) {
      ids.add(`${item.type}-${item.id}`);
    }
    return ids;
  }
  
  /**
   * Get recently recommended genres (within cooldown window)
   */
  getRecentGenres(): Map<number, number> {
    const genreCounts = new Map<number, number>();
    const cooldownStart = this.currentTurn - COOLDOWN_TURNS;
    
    for (const item of this.history) {
      if (item.turnIndex >= cooldownStart) {
        for (const genreId of item.genreIds) {
          const count = genreCounts.get(genreId) || 0;
          genreCounts.set(genreId, count + 1);
        }
      }
    }
    
    return genreCounts;
  }
  
  /**
   * Get franchises that were recently recommended
   */
  getRecentFranchises(): string[] {
    const franchises: string[] = [];
    const cooldownStart = this.currentTurn - COOLDOWN_TURNS;
    
    for (const item of this.history) {
      if (item.turnIndex >= cooldownStart) {
        const lowerTitle = item.title.toLowerCase();
        for (const franchise of FRANCHISE_KEYWORDS) {
          if (lowerTitle.includes(franchise) && !franchises.includes(franchise)) {
            franchises.push(franchise);
          }
        }
      }
    }
    
    return franchises;
  }
  
  /**
   * Calculate similarity score between two items (0-1)
   */
  calculateSimilarity(item1: RecommendedItem, item2: MediaItem): number {
    let score = 0;
    let factors = 0;
    
    // Same ID is 100% similar
    if (item1.id === item2.id && item1.type === item2.type) {
      return 1.0;
    }
    
    // Genre overlap (weighted heavily)
    const genreOverlap = item1.genreIds.filter(g => item2.genreIds.includes(g)).length;
    const totalGenres = new Set([...item1.genreIds, ...item2.genreIds]).size;
    if (totalGenres > 0) {
      score += (genreOverlap / totalGenres) * 0.4;
      factors += 0.4;
    }
    
    // Same era
    const year1 = item1.releaseYear;
    const year2 = item2.releaseDate ? new Date(item2.releaseDate).getFullYear() : null;
    if (year1 && year2) {
      const era1 = this.getEraFromYear(year1);
      const era2 = this.getEraFromYear(year2);
      if (era1 === era2) {
        score += 0.2;
      }
      factors += 0.2;
    }
    
    // Similar rating
    const ratingDiff = Math.abs(item1.voteAverage - item2.voteAverage);
    if (ratingDiff < 0.5) {
      score += 0.2;
    } else if (ratingDiff < 1) {
      score += 0.1;
    }
    factors += 0.2;
    
    // Same franchise
    const title1 = item1.title.toLowerCase();
    const title2 = item2.title.toLowerCase();
    for (const franchise of FRANCHISE_KEYWORDS) {
      if (title1.includes(franchise) && title2.includes(franchise)) {
        score += 0.2;
        break;
      }
    }
    factors += 0.2;
    
    return factors > 0 ? score / factors : 0;
  }
  
  /**
   * Calculate similarity penalty for a new item based on history
   */
  getSimilarityPenalty(item: MediaItem): number {
    let maxSimilarity = 0;
    const recentStart = this.currentTurn - 2; // Check last 2 turns
    
    for (const historyItem of this.history) {
      if (historyItem.turnIndex >= recentStart) {
        const similarity = this.calculateSimilarity(historyItem, item);
        maxSimilarity = Math.max(maxSimilarity, similarity);
      }
    }
    
    // Return penalty (0 = no penalty, 1 = full penalty)
    return maxSimilarity > SIMILARITY_THRESHOLD ? maxSimilarity : 0;
  }
  
  /**
   * Generate filter rules for the next recommendation
   */
  generateFilterRules(): FilterRules {
    const recentGenres = this.getRecentGenres();
    const cooldownGenres = new Map<number, number>();
    
    // Set cooldown for overused genres
    recentGenres.forEach((count, genreId) => {
      if (count >= MAX_SAME_GENRE_CONSECUTIVE) {
        cooldownGenres.set(genreId, COOLDOWN_TURNS - (this.currentTurn % COOLDOWN_TURNS));
      }
    });
    
    // Determine preferred popularity range based on history
    const { high, medium, low } = this.diversityMetrics.popularityBuckets;
    const total = high + medium + low;
    let preferredPopularityRange = { min: 0, max: 10 };
    
    if (total > 0) {
      // If we've recommended too many popular items, prefer hidden gems
      if (high / total > 0.7) {
        preferredPopularityRange = { min: 5.5, max: 7.5 };
      }
      // If too many low-rated, prefer higher rated
      else if (low / total > 0.5) {
        preferredPopularityRange = { min: 7, max: 10 };
      }
    }
    
    // Determine preferred eras based on what's underrepresented
    const allEras = ['2020s', '2010s', '2000s', '90s', '80s', 'classic'];
    const preferredEras: string[] = [];
    
    for (const era of allEras) {
      const count = this.diversityMetrics.eraDistribution.get(era) || 0;
      if (count < 2) {
        preferredEras.push(era);
      }
    }
    
    // Genre combinations to avoid (pairs that were used together recently)
    const excludeGenreCombos: number[][] = [];
    const recentItems = this.history.filter(i => i.turnIndex >= this.currentTurn - 1);
    for (const item of recentItems) {
      if (item.genreIds.length >= 2) {
        excludeGenreCombos.push(item.genreIds.slice(0, 2));
      }
    }
    
    return {
      excludeIds: this.getRecommendedIds(),
      excludeGenreCombos,
      excludeFranchises: this.getRecentFranchises(),
      preferredPopularityRange,
      preferredEras: preferredEras.length > 0 ? preferredEras : allEras,
      cooldownGenres
    };
  }
  
  /**
   * Get statistics about the conversation
   */
  getStats(): {
    totalRecommended: number;
    turnCount: number;
    topGenres: [number, number][];
    eraBreakdown: [string, number][];
  } {
    const genreArray: [number, number][] = [];
    this.diversityMetrics.genreDistribution.forEach((count, genre) => {
      genreArray.push([genre, count]);
    });
    genreArray.sort((a, b) => b[1] - a[1]);
    
    const eraArray: [string, number][] = [];
    this.diversityMetrics.eraDistribution.forEach((count, era) => {
      eraArray.push([era, count]);
    });
    eraArray.sort((a, b) => b[1] - a[1]);
    
    return {
      totalRecommended: this.history.length,
      turnCount: this.currentTurn,
      topGenres: genreArray.slice(0, 5),
      eraBreakdown: eraArray
    };
  }
  
  /**
   * Clear all history (for new conversation)
   */
  clear(): void {
    this.history = [];
    this.contextHistory = [];
    this.currentTurn = 0;
    this.diversityMetrics = this.initDiversityMetrics();
  }
  
  /**
   * Check if we should suggest something different
   */
  shouldSuggestVariety(): boolean {
    if (this.currentTurn < 3) return false;
    
    // Check if recent recommendations are too similar
    const recentItems = this.history.filter(i => i.turnIndex >= this.currentTurn - 2);
    if (recentItems.length < 4) return false;
    
    // Check genre concentration
    const genreCounts = new Map<number, number>();
    for (const item of recentItems) {
      for (const genreId of item.genreIds) {
        genreCounts.set(genreId, (genreCounts.get(genreId) || 0) + 1);
      }
    }
    
    // If any genre appears in more than 60% of recent items, suggest variety
    let shouldVary = false;
    genreCounts.forEach((count) => {
      if (count / recentItems.length > 0.6) {
        shouldVary = true;
      }
    });
    
    return shouldVary;
  }
}

// Singleton instance for the current session
let historyInstance: RecommendationHistory | null = null;

export function getRecommendationHistory(): RecommendationHistory {
  if (!historyInstance) {
    historyInstance = new RecommendationHistory();
  }
  return historyInstance;
}

export function resetRecommendationHistory(): void {
  if (historyInstance) {
    historyInstance.clear();
  }
  historyInstance = new RecommendationHistory();
}

export default RecommendationHistory;
