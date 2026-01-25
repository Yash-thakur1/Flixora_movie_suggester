// ============================================
// TMDB API Response Types
// ============================================

export interface Movie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  video: boolean;
}

// ============================================
// TV Series Types
// ============================================

export interface TVShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  origin_country: string[];
  original_language: string;
}

export interface TVShowDetails extends Omit<TVShow, 'genre_ids'> {
  genres: Genre[];
  episode_run_time: number[];
  status: string;
  tagline: string;
  homepage: string;
  number_of_episodes: number;
  number_of_seasons: number;
  seasons: Season[];
  networks: Network[];
  created_by: Creator[];
  last_air_date: string;
  in_production: boolean;
  type: string;
}

export interface Season {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  episode_count: number;
  air_date: string;
}

export interface Network {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface Creator {
  id: number;
  name: string;
  profile_path: string | null;
}

// Union type for media items
export type MediaItem = Movie | TVShow;
export type MediaType = 'movie' | 'tv';

// Helper to check media type
export function isMovie(item: MediaItem): item is Movie {
  return 'title' in item;
}

export function isTVShow(item: MediaItem): item is TVShow {
  return 'name' in item && !('title' in item);
}

// Get title for any media type
export function getMediaTitle(item: MediaItem): string {
  return isMovie(item) ? item.title : item.name;
}

// Get release date for any media type
export function getMediaDate(item: MediaItem): string {
  return isMovie(item) ? item.release_date : item.first_air_date;
}

export interface MovieDetails extends Omit<Movie, 'genre_ids'> {
  genres: Genre[];
  runtime: number;
  status: string;
  tagline: string;
  budget: number;
  revenue: number;
  homepage: string;
  imdb_id: string;
  production_companies: ProductionCompany[];
  production_countries: ProductionCountry[];
  spoken_languages: SpokenLanguage[];
  belongs_to_collection: Collection | null;
}

export interface Genre {
  id: number;
  name: string;
}

export interface ProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface ProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface SpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

export interface Collection {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
}

// ============================================
// Cast & Crew Types
// ============================================

export interface Cast {
  id: number;
  name: string;
  original_name: string;
  character: string;
  profile_path: string | null;
  order: number;
  known_for_department: string;
  gender: number;
}

export interface Crew {
  id: number;
  name: string;
  original_name: string;
  job: string;
  department: string;
  profile_path: string | null;
  gender: number;
}

export interface Credits {
  id: number;
  cast: Cast[];
  crew: Crew[];
}

// ============================================
// Video Types
// ============================================

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: 'Trailer' | 'Teaser' | 'Clip' | 'Featurette' | 'Behind the Scenes';
  official: boolean;
  published_at: string;
}

export interface VideosResponse {
  id: number;
  results: Video[];
}

// ============================================
// Watch Provider Types
// ============================================

export interface WatchProvider {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
}

export interface WatchProviderCountry {
  link: string;
  flatrate?: WatchProvider[];  // Subscription-based (Netflix, Prime, etc.)
  rent?: WatchProvider[];      // Rent options
  buy?: WatchProvider[];       // Buy/Purchase options
  free?: WatchProvider[];      // Free with ads
  ads?: WatchProvider[];       // Free with ads (alternative)
}

export interface WatchProvidersResponse {
  id: number;
  results: {
    [countryCode: string]: WatchProviderCountry;
  };
}

// ============================================
// API Response Types
// ============================================

export interface PaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface GenresResponse {
  genres: Genre[];
}

// ============================================
// User Preference Types
// ============================================

export type Mood = 'happy' | 'dark' | 'emotional' | 'exciting' | 'relaxing' | 'thrilling';
export type Era = 'all' | 'latest' | '2020s' | '2010s' | '2000s' | '90s' | 'classic';
export type RatingPreference = 'any' | 'high' | 'top';
export type DurationPreference = 'short' | 'medium' | 'long' | 'any';

export interface UserPreferences {
  genres: number[];
  mood: Mood | null;
  languages: string[];
  era: Era | null;
  ratingPreference: RatingPreference;
  durationPreference: DurationPreference;
}

// ============================================
// Watchlist Types
// ============================================

export interface WatchlistItem {
  movieId: number;
  addedAt: string;
  movie: Movie;
}

// ============================================
// Search Types
// ============================================

export interface SearchResult {
  movies: Movie[];
  totalResults: number;
  totalPages: number;
  page: number;
}

// ============================================
// Quick Mood Types
// ============================================

export interface QuickMood {
  id: string;
  label: string;
  icon: string;
  genres: number[];
  keywords?: string[];
}

// ============================================
// Filter Types
// ============================================

export interface MovieFilters {
  genres: number[];
  year?: number;
  yearRange?: { from: number; to: number };
  minRating?: number;
  sortBy: SortOption;
  language?: string;
}

export type SortOption =
  | 'popularity.desc'
  | 'popularity.asc'
  | 'vote_average.desc'
  | 'vote_average.asc'
  | 'release_date.desc'
  | 'release_date.asc'
  | 'revenue.desc';

// ============================================
// Component Props Types
// ============================================

export interface MovieCardProps {
  movie: Movie;
  priority?: boolean;
  showRating?: boolean;
}

export interface MovieGridProps {
  movies: Movie[];
  loading?: boolean;
  emptyMessage?: string;
}

export interface TrailerModalProps {
  videoKey: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}
