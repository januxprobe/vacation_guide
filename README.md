# Vacation Guide

A modern trip planning platform built with Next.js 16, featuring an AI-powered conversational trip builder and curated travel itineraries with interactive attraction browsing, media galleries, and bilingual support (Dutch/English).

Currently features a pre-configured **Andalusia 2026** trip covering Seville, Cordoba, and Granada with 25 attractions, a 7-day itinerary, 12 restaurant recommendations, an interactive budget calculator, an interactive map with photo markers, pedestrian walking routes, and meal stops, photos, videos, pricing info, and opening hours. Users can also create custom trips via the AI trip builder.

## Features

- **Trip Selector Homepage** - Browse existing trips, create new ones, delete user-created trips
- **AI Trip Builder** - Chat with Gemini AI to plan trips with real-time data from Google Search grounding
- **Multi-trip architecture** - Each trip has its own config, data, and URL namespace (`/nl/andalusia-2026/attractions`)
- **25+ attractions** with photos, YouTube videos, pricing, opening hours, and tips
- **7-day itinerary** - Expandable day cards with activity timeline, meals, transport indicators, and attraction links
- **12 restaurant recommendations** - Filterable by city and price range with cuisine tags and specialties
- **Budget calculator** - Interactive calculator with traveler count selectors, student discount toggle, category breakdown, and per-person totals
- **Interactive map** - Photo thumbnail markers with number badges, pedestrian walking routes via Valhalla (OpenStreetMap), permanent name labels, meal stop markers, CartoDB Positron tiles, city/day filters, restaurant toggle
- **City-based color coding** - Each city gets a unique color applied via inline styles
- **Filtering & sorting** - By city, category (monument, palace, church...), and priority (essential, recommended, optional)
- **Bilingual** - Dutch (NL) and English (EN) with full i18n support
- **Media galleries** - Fullscreen carousel with images and embedded YouTube videos
- **Responsive** - Works on desktop and mobile with collapsible navigation
- **Data validation** - Zod schemas validate all attraction, itinerary, and restaurant data
- **Trip management** - Create trips via AI chat, delete user-created trips with two-step confirmation

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 16 (App Router) | SSR/SSG framework |
| TypeScript | Type safety |
| Tailwind CSS v4 | Styling |
| shadcn/ui | UI component primitives |
| next-intl v4 | Internationalization |
| @google/genai | Gemini AI for conversational trip builder |
| React-Leaflet | Interactive maps |
| Valhalla (OSM) | Pedestrian walking routes (free public API) |
| react-leaflet-cluster | Marker clustering |
| Zod | Data validation |
| Playwright | E2E testing |
| Lucide React | Icons |

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY
# Get one at: https://aistudio.google.com/apikey

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the trip selector homepage.

## How It Works

### Trip Selector (`/{locale}`)
The homepage shows all available trips as cards. Pre-configured trips (like Andalusia 2026) are always present. User-created trips show a delete button with two-step confirmation.

### AI Trip Builder (`/{locale}/create-trip`)
1. Click "Create New Trip" on the homepage
2. Describe your trip idea in natural language (e.g., "5-day trip to Torremolinos with family")
3. Gemini AI asks clarifying questions and suggests attractions with real data (prices, GPS coordinates, descriptions) from Google Search
4. Accept or reject each suggestion via rich cards
5. Click "Create Trip" to save everything as JSON files on disk
6. Get redirected to your new trip

### Trip Pages (`/{locale}/{tripSlug}/...`)
Each trip has dedicated pages:
- **Attractions** - Filterable list + detail pages with photos, pricing, opening hours
- **Itinerary** - Expandable day cards with chronological timeline of activities, meals, and transport
- **Restaurants** - Filterable list by city and price range with cuisine tags and specialties
- **Budget** - Interactive calculator with configurable traveler counts and student discount toggle
- **Planner** - Split-view with interactive map (photo markers, walking routes, meal stops) and day-by-day itinerary panel

## Project Structure

```
src/
├── app/
│   ├── api/                       # REST API routes
│   │   ├── ai/chat/               # Streaming Gemini chat (SSE)
│   │   ├── ai/finalize-trip/      # Extract structured trip data from conversation
│   │   └── trips/                 # Trip CRUD + attraction management
│   └── [locale]/
│       ├── page.tsx               # Trip selector homepage
│       ├── create-trip/           # AI trip builder chat interface
│       └── [tripSlug]/            # Trip-scoped pages (attractions, map, etc.)
├── components/
│   ├── attractions/               # Attraction cards, filters, detail views, media
│   ├── itinerary/                 # Day cards, activity timeline, itinerary list
│   ├── restaurants/               # Restaurant cards, filters, restaurant list
│   ├── budget/                    # Budget calculator, traveler selector, category breakdown
│   ├── map/                       # Map utilities, photo/meal/restaurant markers, route, legend
│   ├── planner/                   # Split-view planner (map + itinerary panel + day tabs)
│   ├── trip-selector/             # Trip cards, grid, create card
│   ├── trip-creator/              # Chat UI, attraction suggestions, trip preview
│   └── layout/                    # Headers (trip-scoped + generic), language switcher
├── config/trips/                  # Trip configurations (static TS + dynamic JSON)
├── data/trips/                    # Trip data on disk (attraction JSON files)
├── hooks/                         # Custom hooks (walking route via Valhalla)
├── lib/                           # Data loaders, budget calculator, color utilities, Zod schemas
└── i18n/messages/                 # Translation files (nl.json, en.json)
```

## Adding a New Trip

### Option 1: AI Trip Builder (recommended)
1. Navigate to the homepage and click "Create New Trip"
2. Chat with the AI to describe your trip
3. Accept attraction suggestions
4. Click "Create Trip" - done!

### Option 2: Manual
1. Create a config file in `src/config/trips/my-trip.ts` implementing the `TripConfig` interface
2. Register it in `src/config/trips/index.ts`
3. Add attraction data in `src/data/trips/my-trip/attractions/{city}/*.json`
4. Add `itinerary.json` to `src/data/trips/my-trip/` (optional, enables itinerary + budget pages)
5. Add `restaurants.json` to `src/data/trips/my-trip/` (optional, enables restaurant page)
6. Add images to `public/images/attractions/`
7. Run `npm run build` to validate data and generate pages

See [RESOURCES.md](./RESOURCES.md) for detailed patterns on data sourcing, image acquisition, and trip creation.

## Testing

```bash
npx playwright test --headed     # Run all 23 tests with visible browser
npx playwright test --headed --grep "attractions"  # Run specific tests
```

**Test suite (23 tests):**
- 5 core tests: NL navigation, language switching, mobile, HTML structure, trip selector
- 4 attraction tests: list/filters, detail page, English mode, category filter
- 1 E2E test: AI trip creation + verification + deletion (uses live Gemini API)
- 3 planner tests: split-view load, day sync, mobile toggle
- 4 phase 3 tests: planner panel (NL + EN), restaurant filters, budget calculator
- 3 phase 4 tests: map markers + day switching, route polyline toggle, restaurant toggle
- 3 phase 5 tests: hero section with image, navigation/loading, 404 not-found page

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes (for AI builder) | Google Gemini API key ([get one here](https://aistudio.google.com/apikey)) |

## Scripts

```bash
npm run dev       # Development server (http://localhost:3000)
npm run build     # Production build
npm run lint      # ESLint
```

## License

Private project.
