# Vacation Guide - Trip Planning Platform

## Important Reminders

- **Documentation files live at the project root:** `README.md`, `CLAUDE.md`, `RESOURCES.md`, `.env.example`. Always check the root directory directly when looking for docs - do NOT use broad glob patterns that match `node_modules/`.
- **Never commit or push without manual testing.** After implementing changes, always let the user manually test first. Do not create commits or push to remote unless the user explicitly asks after they have verified the changes.
- **Always update documentation before committing.** Before creating a commit, ensure `CLAUDE.md`, `README.md`, and `RESOURCES.md` are up to date with any changes made (new files, updated structure, new features, test counts, etc.).

## Project Overview

A reusable Next.js web application for planning multi-city trips. Users can browse pre-configured trips or create new ones via an AI-powered conversational trip builder (Gemini with Google Search grounding). The platform supports multiple trips via URL routing (`/[locale]/[tripSlug]/...`).

### Pre-configured Trips
- **Andalusia 2026** - Seville, Cordoba, Granada (September 2026, 5 travelers)

### Key Features
- **Trip Selector Homepage** - Browse existing trips, create new ones, delete user-created trips
- **AI Trip Builder** - Conversational chat with Gemini AI to plan trips, suggest attractions with real data from Google Search
- Attraction details with photos, prices, opening hours
- Budget calculator with configurable student discounts and day-by-day breakdown
- Bilingual: Dutch (NL) and English (EN)
- Unified planner with split-view map + itinerary panel
- Interactive map with photo markers, walking routes, and meal stops (Leaflet + Valhalla)
- Restaurant tips by neighborhood
- Hero imagery with gradient overlay per trip
- Loading skeletons, error boundaries, custom 404 page
- Accessibility: skip-to-content, focus-visible, reduced-motion
- Deployable to Google Cloud Run

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 16 (App Router) | Core framework with SSR/SSG |
| TypeScript | Type safety |
| Tailwind CSS v4 | Styling |
| shadcn/ui | UI component primitives |
| next-intl v4 | Internationalization (NL/EN) |
| @google/genai | Gemini AI for trip builder |
| React-Leaflet | Interactive maps |
| Valhalla (OSM) | Pedestrian walking routes (free public API) |
| react-leaflet-cluster | Marker clustering |
| Zod | Runtime validation |
| Lucide React | Icons |
| Playwright | Visual/E2E testing |

## Project Structure

```
vacation_guide/
├── src/
│   ├── app/
│   │   ├── layout.tsx                   # Root layout (passthrough)
│   │   ├── globals.css                  # Global styles + Tailwind
│   │   ├── api/
│   │   │   ├── trips/
│   │   │   │   ├── route.ts            # GET/POST - List/create trips
│   │   │   │   └── [slug]/
│   │   │   │       ├── route.ts        # GET/DELETE - Get/delete trip
│   │   │   │       └── attractions/
│   │   │   │           └── route.ts    # POST - Add attraction to trip
│   │   │   └── ai/
│   │   │       ├── chat/route.ts       # POST - Streaming Gemini chat (SSE)
│   │   │       └── finalize-trip/route.ts # POST - Extract structured trip data
│   │   └── [locale]/                    # i18n routing (nl/en)
│   │       ├── layout.tsx               # Locale layout (NextIntlClientProvider + skip link)
│   │       ├── loading.tsx              # Skeleton loader for locale pages
│   │       ├── error.tsx                # Error boundary for locale pages
│   │       ├── not-found.tsx            # Custom 404 page
│   │       ├── page.tsx                 # Trip selector homepage
│   │       ├── create-trip/page.tsx     # AI-powered trip builder
│   │       ├── [tripSlug]/              # Trip-scoped routes
│   │       │   ├── layout.tsx           # Trip layout (TripConfigProvider + Header)
│   │       │   ├── loading.tsx          # Skeleton loader for trip pages
│   │       │   ├── error.tsx            # Error boundary for trip pages
│   │       │   ├── page.tsx             # Trip homepage (hero image, stats, quick links)
│   │       │   ├── attractions/
│   │       │   │   ├── page.tsx         # Attractions list with filters
│   │       │   │   └── [id]/page.tsx    # Attraction detail (static gen)
│   │       │   ├── planner/page.tsx     # Unified planner (map + itinerary split view)
│   │       │   ├── restaurants/page.tsx # Filterable restaurant list (city + price)
│   │       │   └── budget/page.tsx      # Interactive budget calculator
│   │       ├── attractions/page.tsx     # Backward-compat redirect
│   │       ├── itinerary/page.tsx       # Backward-compat redirect → planner
│   │       ├── map/page.tsx             # Backward-compat redirect → planner
│   │       ├── restaurants/page.tsx     # Backward-compat redirect
│   │       └── budget/page.tsx          # Backward-compat redirect
│   ├── config/
│   │   ├── trip-config.ts               # TripConfig, CityConfig, TravelerGroup interfaces
│   │   ├── trip-context.tsx             # React context + useTripConfig() + useOptionalTripConfig()
│   │   └── trips/
│   │       ├── index.ts                 # Hybrid trip registry (static TS + JSON from disk)
│   │       └── andalusia-2026.ts        # Andalusia trip config instance
│   ├── components/
│   │   ├── layout/
│   │   │   ├── GlobalBar.tsx            # Row 1: logo + language switcher (always visible)
│   │   │   ├── TripContextBar.tsx       # Row 2: back link + trip name + nav tabs (trip pages only)
│   │   │   ├── Header.tsx               # Composes GlobalBar + TripContextBar (trip pages)
│   │   │   ├── GenericHeader.tsx         # GlobalBar only (non-trip pages)
│   │   │   └── LanguageSwitcher.tsx      # NL/EN toggle
│   │   ├── ui/                          # shadcn/ui components
│   │   ├── attractions/
│   │   │   ├── AttractionCard.tsx       # Card with config-driven color bar, badges, pricing
│   │   │   ├── AttractionDetail.tsx     # Full detail view (config-driven colors)
│   │   │   ├── AttractionFilter.tsx     # City/category/priority filters (cities from config)
│   │   │   ├── AttractionsList.tsx      # List with filtering and sorting
│   │   │   ├── MediaGallery.tsx         # Image/video gallery with carousel
│   │   │   ├── FullscreenCarousel.tsx   # Fullscreen image viewer
│   │   │   ├── VideoEmbed.tsx           # YouTube embed component
│   │   │   └── PriceInfo.tsx            # Price breakdown display
│   │   ├── trip-selector/
│   │   │   ├── TripCard.tsx             # Trip card with optional delete (two-step confirm)
│   │   │   ├── CreateTripCard.tsx       # Dashed-border "+" card to create trip
│   │   │   └── TripGrid.tsx            # Client wrapper managing trip list + deletion
│   │   ├── planner/
│   │   │   ├── PlannerView.tsx          # Main split-view container (map + panel + day tabs)
│   │   │   ├── PlannerWrapper.tsx       # Client wrapper for dynamic import (ssr: false)
│   │   │   ├── PlannerMap.tsx           # Map with photo markers, walking routes, meal stops
│   │   │   ├── PlannerPanel.tsx         # Day header + scrollable timeline
│   │   │   ├── PlannerTimeline.tsx      # Activity cards + meals in time order
│   │   │   ├── PlannerActivityCard.tsx  # Activity card with time, duration, booking tip
│   │   │   └── DayTabBar.tsx            # Horizontal day tabs with city colors
│   │   ├── restaurants/
│   │   │   ├── RestaurantCard.tsx       # Card with city color bar, price badge, cuisine tags
│   │   │   ├── RestaurantFilter.tsx     # City + price range filter buttons
│   │   │   └── RestaurantsList.tsx      # Filter state management + grid of cards
│   │   ├── budget/
│   │   │   ├── BudgetCalculator.tsx     # Main wrapper managing state + calculation
│   │   │   ├── BudgetSummaryCard.tsx    # Highlighted total + per-person display
│   │   │   ├── CategoryBreakdown.tsx    # Category bars with amounts + percentages
│   │   │   ├── DayBreakdown.tsx         # Collapsible per-day cost cards with line items
│   │   │   └── TravelerCountSelector.tsx # +/- steppers for each traveler group
│   │   ├── map/                          # Shared map utilities (used by planner)
│   │   │   ├── MapLegend.tsx            # Overlay legend with city colors + meal/route icons
│   │   │   ├── MapPopup.tsx             # HTML popup content for markers
│   │   │   ├── MapRoute.tsx             # Walking route polyline (OSRM geometry or straight-line fallback)
│   │   │   └── map-utils.ts            # Photo/meal/restaurant marker icons + bounds calculation
│   │   └── trip-creator/
│   │       ├── TripChat.tsx             # Main chat container + state management
│   │       ├── ChatMessage.tsx          # Message bubble with structured data parsing
│   │       ├── ChatInput.tsx            # Auto-resizing textarea + send button
│   │       ├── AttractionSuggestion.tsx # Rich attraction card with accept button
│   │       ├── TripPreview.tsx          # Side panel showing trip being built
│   │       └── CreateTripButton.tsx     # "Create Trip" button with loading state
│   ├── hooks/
│   │   └── useOsrmRoute.ts             # Valhalla pedestrian walking route hook with cache
│   ├── lib/
│   │   ├── utils.ts                     # cn() helper from shadcn
│   │   ├── data-loaders.ts             # Config-driven fs.readFileSync + Zod validation + cache
│   │   ├── schemas.ts                   # Zod schemas (attraction, tripConfig, itinerary, restaurant)
│   │   ├── budget-calculator.ts        # Pure utility: calculateBudget() from itinerary + attractions
│   │   └── city-colors.ts              # Color utilities (hex->rgba, badge/gradient styles)
│   ├── types/
│   │   └── index.ts                     # All TypeScript interfaces (City = string)
│   ├── data/
│   │   └── trips/
│   │       └── andalusia-2026/          # Static trip (25 attractions)
│   │           ├── itinerary.json       # 7-day itinerary (activities, meals, transport)
│   │           ├── restaurants.json     # 12 restaurants (4 per city)
│   │           └── attractions/
│   │               ├── seville/         # 10 JSON files
│   │               ├── cordoba/         # 7 JSON files
│   │               └── granada/         # 8 JSON files
│   └── i18n/
│       ├── routing.ts                   # Locale config + navigation wrappers
│       ├── request.ts                   # Server-side locale resolution
│       └── messages/
│           ├── nl.json                  # Dutch translations
│           └── en.json                  # English translations
├── public/
│   ├── images/{cities,attractions}/     # Static images
│   └── icons/markers/                   # Custom map markers
├── tests/
│   ├── visual-test.spec.ts             # Core visual tests (navigation, i18n, mobile, trip selector)
│   ├── attractions-test.spec.ts        # Attractions feature tests (list, detail, filters)
│   ├── create-trip-test.spec.ts        # AI trip builder E2E test (create + delete)
│   ├── planner-test.spec.ts           # Planner split-view tests (load, day sync, mobile toggle)
│   ├── phase3-test.spec.ts            # Planner panel + restaurants + budget tests
│   ├── phase4-test.spec.ts            # Planner map tests (markers, route, restaurants)
│   └── phase5-test.spec.ts            # Phase 5 tests (hero section, navigation, 404 page)
├── .env.example                         # Environment variable template
├── middleware.ts                        # next-intl locale detection
├── next.config.ts                       # Next.js config (standalone + i18n)
├── playwright.config.ts                 # Playwright config (headed mode)
├── RESOURCES.md                         # Reusable patterns for trip creation
└── package.json
```

## Important Patterns & Conventions

### i18n (Internationalization)

**Critical:** next-intl v4 requires explicit locale passing in this project:

```typescript
// Server components MUST pass locale explicitly:
export default async function SomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });  // <-- explicit { locale }
}

// Layout MUST pass locale to getMessages AND NextIntlClientProvider:
const messages = await getMessages({ locale });  // <-- explicit { locale }
<NextIntlClientProvider messages={messages} locale={locale} key={locale}>

// Client components use useTranslations() (gets locale from provider):
const t = useTranslations();
```

**Language switcher** uses `window.location.href` for full page reload (required for server component re-rendering).

### Server vs Client Components

- **Pages** (`page.tsx`) are server components - use `getTranslations` from `next-intl/server`
- **Interactive components** (Header, LanguageSwitcher) use `'use client'` directive - use `useTranslations` from `next-intl`
- **Map/Planner components** must use `'use client'` and dynamic import with `ssr: false` via a client wrapper (Next.js 16 disallows `ssr: false` in server components)

### Header Architecture

Two-row header split into composable components:

**Row 1 - `GlobalBar.tsx`** (48px, always visible): Logo link to trip selector + `LanguageSwitcher`. No trip context dependency.

**Row 2 - `TripContextBar.tsx`** (44px, trip pages only): Back arrow (`← Reizen/Trips`), trip name in primary color, desktop nav tabs, mobile hamburger. Uses `useTripConfig()`.

Composed into two header variants:
- **`Header.tsx`** - `<GlobalBar />` + `<TripContextBar />` inside sticky `<header>` (92px total). Rendered inside `[tripSlug]/layout.tsx`.
- **`GenericHeader.tsx`** - `<GlobalBar />` only inside sticky `<header>` (48px). For non-trip pages (trip selector, create-trip).

### City Color Scheme
City colors are defined in trip config (`src/config/trips/andalusia-2026.ts`), not hardcoded:
- Seville: Orange (`#f97316`)
- Cordoba: Red (`#dc2626`)
- Granada: Green (`#16a34a`)

Colors are applied via inline styles using `src/lib/city-colors.ts` utilities (not Tailwind classes, because Tailwind v4 JIT can't handle runtime-interpolated classes).

### Multi-Trip Architecture
- **Static trips:** TypeScript configs in `src/config/trips/*.ts`, registered in `index.ts`
- **Dynamic trips:** JSON configs in `src/data/trips/*/trip-config.json`, auto-discovered at runtime
- **Hybrid registry:** `src/config/trips/index.ts` merges both sources via `getAllTrips()`
- **Cache management:** `clearTripCache()` must be called before `getAllTrips()` in server components to ensure fresh data
- **Trip context:** `useTripConfig()` for trip-scoped components, `useOptionalTripConfig()` for optional
- **URL structure:** `/{locale}/{tripSlug}/attractions/...`
- **Trip deletion:** Only dynamic (JSON-based) trips can be deleted; static trips are protected

### AI Trip Builder Architecture
- **Chat API** (`/api/ai/chat`): Streaming SSE with Gemini + Google Search grounding
- **Finalize API** (`/api/ai/finalize-trip`): Non-streaming JSON extraction from conversation
- **Trip CRUD** (`/api/trips`): Creates trip directory + `trip-config.json`, manages attractions
- **Flow:** Chat → Accept suggestions → Click "Create Trip" → Finalize → Save → Redirect
- **Gemini model:** `gemini-2.5-flash` with `tools: [{ googleSearch: {} }]` for grounding

### Planner Map Architecture
- **Photo markers:** `createPhotoMarkerIcon()` in `map-utils.ts` renders attraction thumbnails as 44px square markers with city-colored borders and number badges. Highlighted markers scale to 56px.
- **Walking routes:** `useWalkingRoute()` hook in `src/hooks/useOsrmRoute.ts` fetches pedestrian routes from **Valhalla** (`valhalla1.openstreetmap.de/route`), a free public OpenStreetMap routing service. No API key needed. Responses use encoded polyline (precision 6). Results are cached in a `useRef<Map>` keyed by coordinate hash. Falls back to straight-line dashed polyline on error.
- **Permanent labels:** Each attraction marker has a `<Tooltip permanent>` showing its name. Styled via `.photo-marker-tooltip` in `globals.css`.
- **Meal markers:** Meals in `itinerary.json` can have optional `coordinates` and `restaurantName` fields. When present, a small circle marker with a warm-yellow tooltip label appears on the map. Styled via `.meal-marker-tooltip`.
- **Base tiles:** CartoDB Positron (`basemaps.cartocdn.com/light_all`) for a clean, uncluttered background.
- **Important:** The OSRM demo server (`router.project-osrm.org`) only has **car** routing data — do NOT use it for walking routes. Always use Valhalla for pedestrian routing.

## Development

### Prerequisites
- Node.js 18+
- Gemini API key (for trip builder): get one at https://aistudio.google.com/apikey

### Setup
```bash
npm install
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY
```

### Commands
```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint

# Testing
npx playwright test --headed              # Run all tests (visible browser)
npx playwright test --headed --grep "X"   # Run specific test
```

### Testing Strategy
- Playwright tests in headed mode (visible Chrome browser)
- After any changes, run `npx playwright test --headed` to verify
- **23 tests total:**
  - 5 core: NL navigation, language switching, mobile, HTML structure, trip selector
  - 4 attractions: list/filters, detail page, English mode, category filter
  - 1 E2E: AI trip creation + verification + deletion (uses live Gemini API)
  - 3 planner: split-view load, day sync, mobile toggle
  - 4 phase 3: planner panel (NL + EN), restaurant filters, budget calculator
  - 3 phase 4: planner map markers + day switching, route polyline toggle, restaurant toggle
  - 3 phase 5: hero section with image, navigation/loading, 404 not-found page

### Adding shadcn/ui Components
```bash
npx shadcn@latest add button    # Example: add button component
npx shadcn@latest add card      # Example: add card component
```

## Implementation Plan

### Phase 1: Foundation Setup [COMPLETED]
- [x] Next.js 16 + TypeScript + Tailwind CSS initialized
- [x] next-intl v4 configured for NL/EN with URL routing
- [x] Middleware for locale detection
- [x] TypeScript type definitions for all data structures
- [x] Header with responsive navigation and language switcher
- [x] All route pages created with translations
- [x] Playwright visual testing setup (4 tests passing)

### Phase 2: Data Entry & Attractions [COMPLETED]
- [x] Extract all attraction data into JSON files (25 attractions)
- [x] **Seville** (10 attractions): Real Alcazar, Cathedral/Giralda, Barrio Santa Cruz, Setas de Sevilla, Plaza de Espana, Parque Maria Luisa, Torre del Oro, Triana, Italica, Jerez
- [x] **Cordoba** (7 attractions): Mezquita, Alcazar de los Reyes Cristianos, Roman Bridge, La Juderia, Palacio de Viana, Templo Romano, Plaza de la Corredera
- [x] **Granada** (8 attractions): Alhambra, Carrera del Darro, Albaicin, Capilla Real, Cathedral, Sacromonte, Las Alpujarras, Costa Tropical
- [x] GPS coordinates for each attraction
- [x] AttractionCard, AttractionDetail, PriceInfo components
- [x] AttractionFilter with city/category/priority filter buttons
- [x] AttractionsList with sorting (essential first)
- [x] Attractions list page with filters (`/attractions`)
- [x] Attraction detail page (`/attractions/[id]`) with static generation
- [x] Data loader (`src/lib/data-loaders.ts`) with query functions
- [x] Playwright tests for attractions (4 tests passing)

### Phase 2.5: Platform Generalization [COMPLETED]
- [x] TripConfig interface + andalusia-2026 config instance
- [x] React context (TripConfigProvider + useTripConfig hook)
- [x] Dynamic data loading (fs.readFileSync + directory scanning)
- [x] Zod validation schemas for attraction data
- [x] City color utilities (inline styles replacing hardcoded Tailwind classes)
- [x] All components use config context
- [x] Multi-trip URL routing: /[locale]/[tripSlug]/...
- [x] Trip registry with getTripBySlug/getAllTrips
- [x] Backward-compatible redirects (old URLs -> default trip)
- [x] RESOURCES.md documentation for future trip creation

### Phase 2.7: Trip Selector + AI Trip Builder [COMPLETED]
- [x] Trip selector homepage at `/{locale}` with trip cards + "Create New Trip"
- [x] AI-powered conversational trip builder at `/{locale}/create-trip`
- [x] Gemini integration with Google Search grounding for real attraction data
- [x] Streaming SSE chat responses
- [x] Structured JSON output parsing (attraction suggestions, trip configs)
- [x] Accept/reject attraction suggestions with rich cards
- [x] Trip finalization: extract structured data from conversation
- [x] Trip CRUD API: create trip + attractions as JSON files on disk
- [x] Trip deletion with two-step confirmation (user-created trips only)
- [x] Hybrid trip registry: static TS configs + dynamic JSON configs
- [x] GenericHeader for non-trip pages
- [x] Cache invalidation for fresh trip data
- [x] E2E Playwright test: full create -> verify -> delete flow
- [x] All 10 Playwright tests passing

### Phase 3: Itinerary, Restaurants & Budget [COMPLETED]
- [x] Zod schemas for itinerary + restaurant data (schemas.ts)
- [x] Complete itinerary.json with 7 days (activities, meals, transport)
- [x] Restaurant data: 12 verified restaurants (4 per city) in restaurants.json
- [x] Data loaders: getItineraryForTrip + getRestaurantsForTrip
- [x] Translations extended for itinerary, restaurants, budget
- [x] Restaurant components: RestaurantCard, RestaurantFilter, RestaurantsList
- [x] Itinerary components: DayCard, ActivityTimeline, ItineraryList
- [x] Budget calculator utility (budget-calculator.ts)
- [x] Budget components: TravelerCountSelector, CategoryBreakdown, BudgetSummaryCard, DayBreakdown, BudgetCalculator
- [x] All 3 page stubs replaced with full implementations
- [x] 4 Playwright tests (14 total, all passing)

### Phase 4: Interactive Map [COMPLETED]
- [x] React-Leaflet setup with client-side MapWrapper + dynamic import (ssr: false)
- [x] Photo thumbnail markers with city-colored borders and number badges
- [x] Pedestrian walking routes via Valhalla (OpenStreetMap) with cache and fallback
- [x] Permanent name labels beneath attraction markers
- [x] Meal location markers with restaurant names (warm-yellow tooltips)
- [x] CartoDB Positron base tiles for clean map background
- [x] Marker clustering via react-leaflet-cluster
- [x] Map filters: by city (colored pills), by day (auto-selects city)
- [x] Restaurant marker toggle (separate unclustered layer, circle icons)
- [x] Map legend overlay with photo marker style, meals, restaurants, walking route
- [x] Popups with attraction/restaurant info + "View details" links
- [x] Responsive map height (500px → 600px → 70vh)
- [x] 3 Playwright tests (17 total, all passing)

### Phase 5: Homepage & Polish [COMPLETED]
- [x] Hero section with full-width background image + gradient overlay (heroImage in TripConfig)
- [x] Loading skeletons (loading.tsx at locale + trip level, automatic Suspense)
- [x] Error boundaries (error.tsx at locale + trip level with "Try again" button)
- [x] Custom 404 not-found page at locale level
- [x] Accessibility: focus-visible outlines, skip-to-content link, reduced-motion media query
- [x] Accessibility: aria-labels on nav elements, aria-expanded on mobile menu
- [x] Mobile polish: 44px min touch targets, animated menu open/close, responsive hero/stats
- [x] Translation keys for error + notFound messages (NL + EN)
- [x] 3 Playwright tests (20 total, all passing)

### Phase 6: Deployment to GCP [PENDING]
- [ ] Multi-stage Dockerfile
- [ ] GCP Project setup (Cloud Run, Artifact Registry)
- [ ] GitHub Actions CI/CD
- [ ] Billing alerts (target: <15 EUR/month)

## Trip Data Summary (from vakantie 2026.docx)

### Seville (Days 1-3)
| Attraction | Price | Duration | Priority |
|---|---|---|---|
| Real Alcazar | EUR 21 / EUR 13.50 student | 2-3h | Essential |
| Cathedral & Giralda | EUR 18 / EUR 12 student | 1.5h | Essential |
| Barrio Santa Cruz | Free | 1h | Recommended |
| Setas de Sevilla | ~EUR 5 | 45min | Recommended |
| Plaza de Espana | Free | 1h | Essential |
| Parque Maria Luisa | Free | 1h | Recommended |
| Torre del Oro | ~EUR 3 | 30min | Optional |
| Triana | Free | 2h | Recommended |
| Italica (day trip) | ~EUR 3 | 2-3h | Recommended |
| Jerez (day trip) | ~EUR 15 train | Half day | Optional |

### Cordoba (Day 4)
| Attraction | Price | Duration | Priority |
|---|---|---|---|
| Mezquita | EUR 15 | 2h | Essential |
| Alcazar de los Reyes | EUR 5 | 1.5h | Essential |
| Roman Bridge & Calahorra | EUR 4.50 | 45min | Recommended |
| La Juderia | Free | 1h | Recommended |
| Palacio de Viana | EUR 12 | 1.5h | Optional |
| Templo Romano | Free | 30min | Optional |
| Plaza de la Corredera | Free | 30min | Recommended |

### Granada (Days 5-7)
| Attraction | Price | Duration | Priority |
|---|---|---|---|
| Alhambra & Generalife | EUR 22-49 | 3-4h | Essential |
| Carrera del Darro | Free | 1h | Recommended |
| Albaicin | Free / EUR 25 tour | 1.5h | Essential |
| Capilla Real | EUR 7-36 | 1h | Recommended |
| Sacromonte | ~EUR 5 | 1.5h | Recommended |
| Las Alpujarras | Free (transport) | Half day | Optional |
| Costa Tropical | Free (transport) | Half day | Optional |

### Transport
- Cordoba to Seville by train: EUR 15, ~1 hour
- Hop on Hop off bus Seville: EUR 28/day
- Granada City Mini-train: EUR 9.60/day
