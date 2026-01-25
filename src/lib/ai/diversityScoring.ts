/**
 * Diversity Scoring System
 * 
 * Scores and ranks recommendations based on diversity criteria:
 * - Genre variety
 * - Era distribution
 * - Popularity spread
 * - Franchise avoidance
 * - Similarity penalties
 */

import { MediaItem } from './chatService';
import { RecommendationHistory, FilterRules } from './recommendationHistory';
import { GENRES, TV_GENRES } from '@/lib/tmdb/config';

// ============================================
// Types
// ============================================

export interface ScoredItem extends MediaItem {
  diversityScore: number;
  penalties: {
    repetition: number;
    genreSaturation: number;
    eraSaturation: number;
    franchise: number;
    similarity: number;
  };
  boosts: {
    genreFreshness: number;
    eraFreshness: number;
    hiddenGem: number;
  };
}

export interface DiversityConfig {
  maxSameGenre: number;
  maxSameEra: number;
  maxSameFranchise: number;
  preferHiddenGems: boolean;
  targetPopularityMix: { high: number; medium: number; low: number };
}

// ============================================
// Default Configuration
// ============================================

const DEFAULT_CONFIG: DiversityConfig = {
  maxSameGenre: 3,
  maxSameEra: 4,
  maxSameFranchise: 1,
  preferHiddenGems: false,
  targetPopularityMix: { high: 0.4, medium: 0.4, low: 0.2 }
};

// Franchise detection keywords
const FRANCHISE_PATTERNS: { name: string; patterns: string[] }[] = [
  { name: 'marvel', patterns: ['avengers', 'iron man', 'captain america', 'thor', 'spider-man', 'black panther', 'guardians', 'ant-man', 'doctor strange'] },
  { name: 'dc', patterns: ['batman', 'superman', 'wonder woman', 'aquaman', 'justice league', 'joker'] },
  { name: 'star-wars', patterns: ['star wars', 'mandalorian', 'boba fett', 'obi-wan', 'andor'] },
  { name: 'harry-potter', patterns: ['harry potter', 'fantastic beasts', 'hogwarts'] },
  { name: 'lotr', patterns: ['lord of the rings', 'hobbit', 'rings of power'] },
  { name: 'fast-furious', patterns: ['fast', 'furious', 'f9', 'f8'] },
  { name: 'mission-impossible', patterns: ['mission impossible', 'mission: impossible'] },
  { name: 'james-bond', patterns: ['bond', '007', 'skyfall', 'spectre', 'casino royale'] },
  { name: 'jurassic', patterns: ['jurassic', 'dinosaur'] },
  { name: 'transformers', patterns: ['transformers', 'bumblebee'] },
  { name: 'pixar', patterns: ['toy story', 'finding nemo', 'finding dory', 'incredibles', 'inside out', 'coco', 'up', 'wall-e'] },
  { name: 'disney-animated', patterns: ['frozen', 'moana', 'tangled', 'encanto', 'zootopia'] },
  { name: 'john-wick', patterns: ['john wick', 'continental'] },
  { name: 'matrix', patterns: ['matrix'] },
  { name: 'alien', patterns: ['alien', 'prometheus', 'aliens'] },
  { name: 'terminator', patterns: ['terminator'] },
  { name: 'bourne', patterns: ['bourne'] },
  { name: 'rocky', patterns: ['rocky', 'creed'] },
  { name: 'conjuring', patterns: ['conjuring', 'annabelle', 'nun'] },
  { name: 'purge', patterns: ['purge'] }
];

// ============================================
// Helper Functions
// ============================================

/**
 * Detect franchise from title
 */
function detectFranchise(title: string): string | null {
  const lowerTitle = title.toLowerCase();
  
  for (const franchise of FRANCHISE_PATTERNS) {
    for (const pattern of franchise.patterns) {
      if (lowerTitle.includes(pattern)) {
        return franchise.name;
      }
    }
  }
  
  return null;
}

/**
 * Get era from release date
 */
function getEra(releaseDate: string | null): string {
  if (!releaseDate) return 'unknown';
  const year = new Date(releaseDate).getFullYear();
  
  if (year >= 2020) return '2020s';
  if (year >= 2010) return '2010s';
  if (year >= 2000) return '2000s';
  if (year >= 1990) return '90s';
  if (year >= 1980) return '80s';
  return 'classic';
}

/**
 * Get popularity bucket from rating
 */
function getPopularityBucket(rating: number): 'high' | 'medium' | 'low' {
  if (rating >= 7.5) return 'high';
  if (rating >= 6) return 'medium';
  return 'low';
}

/**
 * Calculate genre overlap percentage
 */
function genreOverlap(genres1: number[], genres2: number[]): number {
  if (genres1.length === 0 || genres2.length === 0) return 0;
  
  const overlap = genres1.filter(g => genres2.includes(g)).length;
  const total = new Set([...genres1, ...genres2]).size;
  
  return overlap / total;
}

// ============================================
// Diversity Scoring
// ============================================

/**
 * Score a single item based on diversity criteria
 */
export function scoreItem(
  item: MediaItem,
  history: RecommendationHistory,
  filterRules: FilterRules,
  currentBatch: MediaItem[] = [],
  config: DiversityConfig = DEFAULT_CONFIG
): ScoredItem {
  let diversityScore = 1.0; // Start with perfect score
  
  const penalties = {
    repetition: 0,
    genreSaturation: 0,
    eraSaturation: 0,
    franchise: 0,
    similarity: 0
  };
  
  const boosts = {
    genreFreshness: 0,
    eraFreshness: 0,
    hiddenGem: 0
  };
  
  const itemKey = `${item.type}-${item.id}`;
  const itemEra = getEra(item.releaseDate);
  const itemFranchise = detectFranchise(item.title);
  const popularityBucket = getPopularityBucket(item.voteAverage);
  
  // 1. Repetition penalty (already recommended)
  if (filterRules.excludeIds.has(itemKey)) {
    penalties.repetition = 1.0;
    diversityScore -= 1.0; // Complete exclusion
    return { ...item, diversityScore, penalties, boosts };
  }
  
  // 2. Genre saturation penalty
  const genreCounts = history.getRecentGenres();
  let genrePenalty = 0;
  for (const genreId of item.genreIds) {
    const count = genreCounts.get(genreId) || 0;
    if (count >= config.maxSameGenre) {
      genrePenalty += 0.15;
    } else if (count >= 2) {
      genrePenalty += 0.05;
    }
    
    // Cooldown penalty
    const cooldown = filterRules.cooldownGenres.get(genreId);
    if (cooldown && cooldown > 0) {
      genrePenalty += 0.1 * cooldown;
    }
  }
  penalties.genreSaturation = Math.min(genrePenalty, 0.5);
  diversityScore -= penalties.genreSaturation;
  
  // 3. Era saturation penalty
  const stats = history.getStats();
  const eraCount = stats.eraBreakdown.find(([era]) => era === itemEra)?.[1] || 0;
  if (eraCount >= config.maxSameEra) {
    penalties.eraSaturation = 0.2;
    diversityScore -= 0.2;
  }
  
  // 4. Franchise penalty
  if (itemFranchise && filterRules.excludeFranchises.includes(itemFranchise)) {
    penalties.franchise = 0.4;
    diversityScore -= 0.4;
  }
  
  // 5. Similarity penalty (compared to recent recommendations)
  penalties.similarity = history.getSimilarityPenalty(item);
  diversityScore -= penalties.similarity * 0.5;
  
  // 6. Same-batch diversity (items in current response)
  for (const batchItem of currentBatch) {
    // Same franchise in batch
    const batchFranchise = detectFranchise(batchItem.title);
    if (itemFranchise && batchFranchise === itemFranchise) {
      diversityScore -= 0.3;
    }
    
    // High genre overlap in batch
    const overlap = genreOverlap(item.genreIds, batchItem.genreIds);
    if (overlap > 0.7) {
      diversityScore -= 0.2;
    }
  }
  
  // === BOOSTS ===
  
  // 7. Genre freshness boost (underrepresented genres)
  const underrepresentedGenres = item.genreIds.filter(g => {
    const count = genreCounts.get(g) || 0;
    return count === 0;
  });
  if (underrepresentedGenres.length > 0) {
    boosts.genreFreshness = 0.1 * underrepresentedGenres.length;
    diversityScore += boosts.genreFreshness;
  }
  
  // 8. Era freshness boost
  if (filterRules.preferredEras.includes(itemEra) && eraCount < 2) {
    boosts.eraFreshness = 0.1;
    diversityScore += 0.1;
  }
  
  // 9. Hidden gem boost (good rating but less mainstream)
  if (config.preferHiddenGems && item.voteAverage >= 7 && item.voteAverage < 8) {
    boosts.hiddenGem = 0.1;
    diversityScore += 0.1;
  }
  
  // Clamp score between 0 and 1
  diversityScore = Math.max(0, Math.min(1, diversityScore));
  
  return { ...item, diversityScore, penalties, boosts };
}

/**
 * Score and rank a batch of items
 */
export function scoreAndRankItems(
  items: MediaItem[],
  history: RecommendationHistory,
  filterRules: FilterRules,
  maxResults: number = 6,
  config: DiversityConfig = DEFAULT_CONFIG
): MediaItem[] {
  if (items.length === 0) return [];
  
  const selectedItems: MediaItem[] = [];
  const remainingItems = [...items];
  
  // Greedy selection: pick best item, then recalculate scores
  while (selectedItems.length < maxResults && remainingItems.length > 0) {
    // Score all remaining items considering already selected
    const scoredItems = remainingItems.map(item => 
      scoreItem(item, history, filterRules, selectedItems, config)
    );
    
    // Sort by diversity score (descending)
    scoredItems.sort((a, b) => b.diversityScore - a.diversityScore);
    
    // Take the best item
    const bestItem = scoredItems[0];
    
    // Only include if score is above threshold
    if (bestItem.diversityScore > 0.2) {
      selectedItems.push(bestItem);
    }
    
    // Remove from remaining
    const idx = remainingItems.findIndex(i => i.id === bestItem.id && i.type === bestItem.type);
    if (idx !== -1) {
      remainingItems.splice(idx, 1);
    } else {
      break; // Safety: avoid infinite loop
    }
  }
  
  return selectedItems;
}

/**
 * Ensure diversity in a batch by swapping similar items
 */
export function ensureBatchDiversity(
  items: MediaItem[],
  alternates: MediaItem[],
  history: RecommendationHistory,
  filterRules: FilterRules
): MediaItem[] {
  const result = [...items];
  
  // Check for franchise duplicates
  const franchises = new Map<string, number[]>();
  for (let i = 0; i < result.length; i++) {
    const franchise = detectFranchise(result[i].title);
    if (franchise) {
      const indices = franchises.get(franchise) || [];
      indices.push(i);
      franchises.set(franchise, indices);
    }
  }
  
  // Replace duplicates with alternates
  franchises.forEach((indices) => {
    if (indices.length > 1) {
      // Keep first, replace others
      for (let i = 1; i < indices.length; i++) {
        const indexToReplace = indices[i];
        
        // Find a suitable alternate
        const alternate = alternates.find(alt => {
          const altFranchise = detectFranchise(alt.title);
          return !altFranchise && !result.some(r => r.id === alt.id && r.type === alt.type);
        });
        
        if (alternate) {
          result[indexToReplace] = alternate;
        }
      }
    }
  });
  
  // Check for genre concentration
  const genreCounts = new Map<number, number>();
  for (const item of result) {
    for (const genreId of item.genreIds.slice(0, 2)) {
      genreCounts.set(genreId, (genreCounts.get(genreId) || 0) + 1);
    }
  }
  
  // If any genre is > 50% of results, try to swap
  genreCounts.forEach((count, genreId) => {
    if (count > result.length / 2) {
      // Find an item with this genre to replace
      for (let i = result.length - 1; i >= 0; i--) {
        if (result[i].genreIds.includes(genreId)) {
          const alternate = alternates.find(alt => 
            !alt.genreIds.includes(genreId) && 
            !result.some(r => r.id === alt.id && r.type === alt.type)
          );
          
          if (alternate) {
            result[i] = alternate;
            return; // break from forEach iteration
          }
        }
      }
    }
  });
  
  return result;
}

/**
 * Get diversity summary for debugging/logging
 */
export function getDiversitySummary(items: ScoredItem[]): {
  avgScore: number;
  genreSpread: number;
  eraSpread: number;
  hasFranchiseDuplicates: boolean;
} {
  if (items.length === 0) {
    return { avgScore: 0, genreSpread: 0, eraSpread: 0, hasFranchiseDuplicates: false };
  }
  
  const avgScore = items.reduce((sum, i) => sum + i.diversityScore, 0) / items.length;
  
  // Calculate genre spread
  const allGenres = new Set<number>();
  for (const item of items) {
    for (const g of item.genreIds) {
      allGenres.add(g);
    }
  }
  const genreSpread = allGenres.size / items.length;
  
  // Calculate era spread
  const eras = new Set<string>();
  for (const item of items) {
    eras.add(getEra(item.releaseDate));
  }
  const eraSpread = eras.size / items.length;
  
  // Check franchise duplicates
  const franchises = new Set<string>();
  let hasDuplicates = false;
  for (const item of items) {
    const franchise = detectFranchise(item.title);
    if (franchise) {
      if (franchises.has(franchise)) {
        hasDuplicates = true;
        break;
      }
      franchises.add(franchise);
    }
  }
  
  return {
    avgScore,
    genreSpread,
    eraSpread,
    hasFranchiseDuplicates: hasDuplicates
  };
}

export default {
  scoreItem,
  scoreAndRankItems,
  ensureBatchDiversity,
  getDiversitySummary
};
