# Movies Finder - Copilot Instructions

## Project Overview

Movies Finder is a Next.js 14 movie discovery platform using the App Router, TypeScript, Tailwind CSS, and TMDB API. The app features a Netflix-inspired dark theme with mood-based recommendations and watchlist functionality.

## Architecture

### Directory Structure
- `src/app/` - Next.js App Router pages (server components by default)
- `src/components/ui/` - Reusable UI primitives (Button, Input, Badge, Skeleton)
- `src/components/movies/` - Movie-specific components (MovieCard, MovieGrid, MovieCarousel, TrailerModal)
- `src/components/layout/` - Layout components (Header, Footer, SearchBar)
- `src/components/features/` - Feature components (HeroSection, QuickMoods, GenreSelector, PreferenceWizard)
- `src/lib/tmdb/` - TMDB API client (`api.ts`) and configuration (`config.ts`)
- `src/store/` - Zustand stores for watchlist, preferences, UI state
- `src/hooks/` - Custom hooks (useDebounce, useMovieSearch, useInfiniteScroll)
- `src/types/` - TypeScript type definitions for Movie, Cast, Crew, etc.

### Key Patterns

**Server vs Client Components:**
- Pages are server components by default for data fetching
- Interactive components use `'use client'` directive
- Data fetching happens in server components, passed to client components as props

**State Management:**
- `useWatchlistStore` - Persisted watchlist (localStorage)
- `usePreferencesStore` - User preferences (genres, mood, era)
- `useUIStore` - UI state (search open, trailer modal)
- `useSearchHistoryStore` - Recent searches

**TMDB API:**
- All API calls go through `src/lib/tmdb/api.ts`
- Use `getImageUrl()` from config to build image URLs
- Genres, languages, moods defined in `src/lib/tmdb/config.ts`

## Coding Conventions

### Component Structure
```tsx
'use client'; // Only if needed

import { /* deps */ } from '...';
import { cn } from '@/lib/utils';

interface ComponentProps {
  // Props interface
}

export function Component({ prop }: ComponentProps) {
  // Implementation
}
```

### Styling
- Use Tailwind CSS classes exclusively
- Use `cn()` utility for conditional classes
- Dark theme colors: `dark-950` (bg), `dark-800` (cards), `primary-600` (accent)
- Always include hover/focus states for interactive elements

### API Data Fetching
```tsx
// Server component pattern
async function MovieContent({ id }: { id: number }) {
  const data = await getMovieDetails(id);
  return <ClientComponent data={data} />;
}
```

### Store Usage
```tsx
// In client components
const { items, addToWatchlist } = useWatchlistStore();
```

## Common Tasks

### Adding a New Page
1. Create folder in `src/app/[route-name]/`
2. Add `page.tsx` (server component for data fetching)
3. Add `loading.tsx` with skeleton
4. Use existing components from `@/components/*`

### Adding a New Movie Component
1. Create in `src/components/movies/`
2. Import types from `@/types/movie`
3. Use `getImageUrl()` for poster/backdrop URLs
4. Export from `src/components/movies/index.ts`

### Modifying TMDB Integration
- API endpoints: `src/lib/tmdb/api.ts`
- Image sizes, genres, moods: `src/lib/tmdb/config.ts`
- Types: `src/types/movie.ts`

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_TMDB_API_KEY=your_key
```

## Commands

```bash
npm run dev      # Development server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint check
```

## Important Files

- [tailwind.config.ts](tailwind.config.ts) - Theme colors, animations
- [src/lib/tmdb/config.ts](src/lib/tmdb/config.ts) - GENRES, QUICK_MOODS, helper functions
- [src/store/index.ts](src/store/index.ts) - All Zustand stores
- [src/app/layout.tsx](src/app/layout.tsx) - Root layout with Header, Footer, TrailerModal
