# 🎬 Movies Finder

A premium, modern movie discovery platform built with Next.js 14, featuring AI-powered recommendations, mood-based suggestions, and a Netflix-inspired dark theme.

![Movies Finder](https://via.placeholder.com/1200x630/0d0e10/ef5744?text=Movies+Finder)

## ✨ Features

- **🔥 Trending & Popular Movies** - Browse what's hot right now
- **🎯 Personalized Recommendations** - Get suggestions based on your preferences
- **😊 Mood-Based Suggestions** - One-click buttons like "I feel bored", "Surprise me"
- **🔍 Smart Search** - Live search with auto-suggestions
- **📚 Watchlist** - Save movies to watch later (persisted in localStorage)
- **🎬 Trailer Modal** - Watch trailers without leaving the page
- **📱 Fully Responsive** - Works on mobile, tablet, and desktop
- **⚡ Fast & Optimized** - Server-side rendering, image optimization, caching

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- TMDB API Key ([Get one free](https://www.themoviedb.org/settings/api))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/movies-finder.git
cd movies-finder
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.local.example .env.local
```

4. Add your TMDB API key to `.env.local`:
```env
NEXT_PUBLIC_TMDB_API_KEY=your_api_key_here
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── movie/[id]/        # Movie details page
│   ├── discover/          # Browse & filter movies
│   ├── recommendations/   # Personalized recommendations
│   ├── watchlist/         # User's saved movies
│   └── search/            # Search results
├── components/
│   ├── ui/                # Base UI components (Button, Input, Badge, Skeleton)
│   ├── movies/            # Movie-specific components (Card, Grid, Carousel)
│   ├── layout/            # Header, Footer, SearchBar
│   └── features/          # Feature components (Hero, QuickMoods, PreferenceWizard)
├── lib/
│   ├── tmdb/              # TMDB API client and configuration
│   └── utils.ts           # Utility functions
├── store/                 # Zustand state management
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript type definitions
```

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **State Management:** Zustand
- **Icons:** Lucide React
- **API:** TMDB (The Movie Database)

## 📝 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npm run format   # Format code with Prettier
```

## 🎨 Customization

### Theme Colors

Edit `tailwind.config.ts` to customize the color palette:

```typescript
colors: {
  primary: { /* your brand colors */ },
  dark: { /* background shades */ },
}
```

### Adding New Genres/Moods

Edit `src/lib/tmdb/config.ts` to add or modify genre mappings and mood presets.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- Movie data provided by [TMDB](https://www.themoviedb.org/)
- Design inspiration from Netflix, IMDb, and Letterboxd
