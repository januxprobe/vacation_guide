# Vacation Guide - Trip Planning Platform

## Important Reminders

- **Documentation files live at the project root:** `README.md`, `CLAUDE.md`, `RESOURCES.md`, `.env.example`. Always check the root directory directly when looking for docs - do NOT use broad glob patterns that match `node_modules/`.
- **Never commit or push without manual testing.** After implementing changes, always let the user manually test first. Do not create commits or push to remote unless the user explicitly asks after they have verified the changes.
- **Do NOT run tests unless explicitly asked.** Never run `npx playwright test` or `npm run build` on your own. The user will tell you when to test.
- **Always update documentation before committing.** Before creating a commit, ensure `CLAUDE.md`, `README.md`, and `RESOURCES.md` are up to date with any changes made (new files, updated structure, new features, test counts, etc.).
- **Record agreed plans immediately.** When the user agrees to a proposed plan (feature list, UX improvements, refactoring steps, etc.), write it as a checklist in the `## Agreed Plans` section at the bottom of this file BEFORE starting implementation. Each item should have a `[ ]` checkbox. Check items off (`[x]`) as they are implemented and committed. This ensures nothing gets lost between sessions.
- **Test-Driven Development (TDD).** Always write tests FIRST, then implement the feature/fix to make the tests pass. The workflow is: (1) write a failing test that describes the expected behavior, (2) implement the minimum code to make the test pass, (3) refactor if needed. This applies to both Vitest unit/API tests and Playwright integration tests.

## Project Overview

A reusable Next.js web application for planning multi-city trips. Users can browse pre-configured trips or create new ones via an AI-powered conversational trip builder (Gemini with Google Search grounding). The platform supports multiple trips via URL routing (`/[locale]/[tripSlug]/...`).

### Pre-configured Trips
- **Andalusia 2026** - Seville, Cordoba, Granada (September 2026, 5 travelers)

### Key Features
- **Trip Selector Homepage** - Browse existing trips, create new ones, delete user-created trips
- **AI Trip Builder** - Conversational chat with Gemini AI to plan trips, suggest attractions with real data from Google Search
- **Auto-generated restaurants & itinerary** - Trip creation automatically generates restaurant recommendations and day-by-day itineraries via Gemini
- **AI Travel Story** - Generate a narrative travel story from trip data (4 styles: adventure/cultural/romantic/family), saved and cached, with embedded attraction photos and restaurant highlights
- **Restaurant search & CRUD** - Search for restaurants via AI on dynamic trips, add/remove with two-step confirmation
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
| react-markdown | Markdown rendering in chat bubbles |
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
│   │   │   │       ├── attractions/
│   │   │   │       │   └── route.ts    # POST - Add attraction to trip
│   │   │   │       ├── restaurants/
│   │   │   │       │   └── route.ts    # POST/PUT/DELETE - Restaurant CRUD
│   │   │   │       ├── itinerary/
│   │   │   │       │   └── route.ts    # POST - Save itinerary
│   │   │   │       └── story/
│   │   │   │           └── route.ts    # GET/POST - Get/generate trip story
│   │   │   └── ai/
│   │   │       ├── chat/route.ts       # POST - Streaming Gemini chat (SSE)
│   │   │       ├── finalize-trip/route.ts # POST - Extract structured trip data
│   │   │       └── search-restaurants/route.ts # POST - Gemini restaurant search
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
│   │       ├── index.ts                 # Re-exports static trip configs
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
│   │   │   ├── RestaurantCard.tsx       # Card with city color bar, price badge, optional remove
│   │   │   ├── RestaurantFilter.tsx     # City + price range filter buttons
│   │   │   ├── RestaurantSearch.tsx     # AI-powered restaurant search with add buttons
│   │   │   └── RestaurantsList.tsx      # Stateful list with search/remove (dynamic trips)
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
│   │   ├── story/
│   │   │   ├── TripStorySection.tsx    # Main story wrapper (style picker or story view)
│   │   │   ├── StoryStylePicker.tsx    # 4 narrative style cards (2x2 grid)
│   │   │   ├── StoryChapterView.tsx    # Single chapter with day badge + blocks
│   │   │   ├── StoryBlockRenderer.tsx  # Switch on block type (narrative/highlight/meal/transition)
│   │   │   └── StoryActions.tsx        # Regenerate + share + print buttons
│   │   └── trip-creator/
│   │       ├── TripChat.tsx             # Main chat container + state management
│   │       ├── ChatMessage.tsx          # Message bubble with markdown rendering + structured data parsing
│   │       ├── ChatInput.tsx            # Auto-resizing textarea + send button
│   │       ├── AttractionSuggestion.tsx # Rich attraction card with thumbnail + accept button
│   │       ├── TripPreview.tsx          # Side panel showing trip being built
│   │       └── CreateTripButton.tsx     # "Create Trip" button with loading state
│   ├── hooks/
│   │   └── useOsrmRoute.ts             # Valhalla pedestrian walking route hook with cache
│   ├── lib/
│   │   ├── utils.ts                     # cn() helper from shadcn
│   │   ├── wikimedia.ts                 # Multi-language media enrichment (Wikidata, Wikipedia, Commons, tourism sites)
│   │   ├── schemas.ts                   # Zod schemas (attraction, tripConfig, itinerary, restaurant, story)
│   │   ├── normalize-itinerary.ts      # Normalize AI-generated itinerary data before Zod validation
│   │   ├── normalize-story.ts          # Normalize AI-generated story data before Zod validation
│   │   ├── budget-calculator.ts        # Pure utility: calculateBudget() from itinerary + attractions (includes free attractions in breakdown)
│   │   ├── city-colors.ts              # Color utilities (hex->rgba, badge/gradient styles)
│   │   └── repositories/
│   │       ├── types.ts                 # TripRepository + TripDataRepository interfaces
│   │       ├── index.ts                 # Factory (DATA_BACKEND env switch: json | firestore)
│   │       └── json/
│   │           ├── json-trip-repository.ts      # TripConfig CRUD (static TS + JSON from disk)
│   │           └── json-trip-data-repository.ts # Attractions/Restaurants/Itinerary (fs + Zod + cache)
│   ├── types/
│   │   └── index.ts                     # All TypeScript interfaces (City = string)
│   ├── data/
│   │   └── trips/
│   │       └── andalusia-2026/          # Static trip (25 attractions)
│   │           ├── itinerary.json       # 7-day itinerary (activities, meals, transport)
│   │           ├── restaurants.json     # 12 restaurants (4 per city)
│   │           ├── story.json           # AI-generated travel story (7 chapters, 25 attractions, 12 restaurants)
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
│   ├── setup.ts                       # Vitest setup (jest-dom matchers)
│   ├── unit/                          # Pure function tests (Vitest)
│   │   ├── budget-calculator.test.ts  # Budget calculation logic (13 tests)
│   │   ├── schemas.test.ts           # Zod schema validation (28 tests)
│   │   ├── planner-utils.test.ts     # Time parsing/formatting (17 tests)
│   │   ├── normalize-itinerary.test.ts # AI itinerary normalization (37 tests)
│   │   ├── normalize-story.test.ts   # AI story normalization (22 tests)
│   │   ├── city-colors.test.ts       # Color utility functions (16 tests)
│   │   └── wikimedia.test.ts         # Wikimedia enrichment pipeline (35 tests)
│   ├── hooks/                         # React hook tests (Vitest)
│   │   ├── useFavorites.test.ts      # Favorites hook (8 tests)
│   │   └── useDayComments.test.ts    # Day comments hook (9 tests)
│   ├── api/                           # API route handler tests (Vitest)
│   │   ├── helpers.ts                 # Shared mocks & fixtures
│   │   ├── trips.test.ts             # GET/POST /api/trips (7 tests)
│   │   ├── trips-slug.test.ts        # GET/DELETE /api/trips/[slug] (6 tests)
│   │   ├── attractions.test.ts       # POST attractions + enum normalization (8 tests)
│   │   ├── restaurants.test.ts       # POST/PUT/DELETE restaurants (13 tests)
│   │   ├── itinerary.test.ts         # POST itinerary + normalization (6 tests)
│   │   ├── comments.test.ts          # GET/POST/DELETE comments (8 tests)
│   │   └── story.test.ts            # GET/POST story + normalization (10 tests)
│   ├── integration/                   # Browser tests, local data (Playwright)
│   │   ├── navigation-i18n.spec.ts   # NL navigation, language switching, mobile, HTML structure
│   │   ├── trip-selector.spec.ts     # Trip selector homepage
│   │   ├── trip-homepage.spec.ts     # Hero section, navigation, share button, story section
│   │   ├── trip-story.spec.ts       # Story chapters, blocks, locale, actions
│   │   ├── attractions.spec.ts       # List, filters, detail, search, sort, favorites
│   │   ├── restaurants.spec.ts       # Filters, search, cuisine, expand/collapse
│   │   ├── planner.spec.ts           # Split view, day sync, mobile, panel, comments
│   │   ├── planner-map.spec.ts       # Map markers, route toggle, restaurant toggle
│   │   ├── budget.spec.ts            # Calculator, what-if mode
│   │   └── not-found.spec.ts         # 404 page (NL + EN)
│   └── e2e/                           # Browser tests, live APIs (Playwright)
│       ├── create-trip-e2e.spec.ts    # AI trip creation + story generation (uses live Gemini API)
│       └── chat-flow-e2e.spec.ts      # AI chat conversation flow (uses live Gemini API)
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

### Repository / DAO Layer
All data access goes through two repository interfaces in `src/lib/repositories/types.ts`:
- **`TripRepository`** — CRUD for trip configs (`getAll`, `getBySlug`, `create`, `delete`, `isProtected`)
- **`TripDataRepository`** — CRUD for attractions, restaurants, itinerary (scoped by `tripSlug`)

Factory in `src/lib/repositories/index.ts` returns singletons based on `DATA_BACKEND` env var (`json` default, `firestore` later):
```typescript
import { getTripRepository, getTripDataRepository } from '@/lib/repositories';
const tripRepo = getTripRepository();
const trip = await tripRepo.getBySlug(slug);
const tripDataRepo = getTripDataRepository();
const attractions = await tripDataRepo.getAllAttractions(slug);
```

**Key design decisions:**
- All methods are `async` (JSON impl is sync internally, but Firestore needs async)
- `tripSlug` is the scope key (not `TripConfig`) — `dataDirectory` is a JSON implementation detail
- Caching is internal to the implementation (no `clearCache()` in the interface)
- Validation stays in API routes — the DAO receives already-validated data
- `isProtected()` replaces `isStaticTrip()` — storage-agnostic naming

### Multi-Trip Architecture
- **Static trips:** TypeScript configs in `src/config/trips/*.ts`, re-exported from `index.ts`
- **Dynamic trips:** JSON configs in `src/data/trips/*/trip-config.json`, auto-discovered at runtime
- **Hybrid registry:** `JsonTripRepository` merges static TS configs + dynamic JSON configs
- **Cache management:** Handled internally by repository implementations — no manual cache clearing needed. **Important:** `getItinerary()` does not cache `null` results (only successful loads are cached). This prevents stale misses caused by Next.js module duplication between API routes and server components, where cache invalidation from `saveItinerary()` in an API route may not reach the repository instance used by page server components.
- **Trip context:** `useTripConfig()` for trip-scoped components, `useOptionalTripConfig()` for optional
- **URL structure:** `/{locale}/{tripSlug}/attractions/...`
- **Trip deletion:** Only dynamic (JSON-based) trips can be deleted; protected trips return `isProtected()=true`

### AI Trip Builder Architecture
- **Chat API** (`/api/ai/chat`): Streaming SSE with Gemini + Google Search grounding
- **Finalize API** (`/api/ai/finalize-trip`): Non-streaming JSON extraction from conversation. Returns `{ tripConfig, attractions, restaurants, itinerary }`. Restaurants and itinerary are validated with Zod.
- **Restaurant Search API** (`/api/ai/search-restaurants`): Gemini + Google Search for finding real restaurants. Returns validated `Restaurant[]`. Note: `responseMimeType` cannot be combined with `tools: [{ googleSearch }]` — rely on prompt instructions for JSON output.
- **Trip CRUD** (`/api/trips`): Creates trip directory + `trip-config.json`, manages attractions
- **Restaurant CRUD** (`/api/trips/[slug]/restaurants`): POST (batch save), PUT (add single), DELETE (remove by ID). Static trips are protected (403).
- **Itinerary API** (`/api/trips/[slug]/itinerary`): POST to save `itinerary.json`.
- **Chat markdown:** Assistant messages render markdown via `react-markdown` (bold, lists, headers, links). User messages stay plain text. Styled via `.chat-markdown` class in `globals.css`.
- **Wikimedia enrichment:** `src/lib/wikimedia.ts` enriches attractions with real images from multiple sources after AI generates data. **Never trust LLM-generated media URLs** — Gemini hallucinates them. The finalize prompt explicitly tells Gemini to leave `thumbnail: ""` and `images: []` empty, but provide `wikipediaSlug` (exact Wikipedia article title) and `website` (real official URL).
  - **Pipeline:** Wikidata entity resolution → multi-language Wikipedia images → Wikipedia external links (tourism sites) → Wikimedia Commons search (smart with query simplification) → tourism website scraping (og:image + img tags)
  - **Multi-language:** `detectLanguageChain(region)` maps region strings (e.g. "Andalusia, Spain") to language codes `['en', 'es']`. Searches Wikipedia/Wikidata in all detected languages.
  - **Wikidata:** Resolves attraction to Q-ID, extracts P18 (main Commons image), sitelinks (exact Wikipedia article titles per language), and labels (for alt text).
  - **`wikipediaSlug`:** Optional field on Attraction — if the AI provides the exact Wikipedia article title, Wikidata search is skipped (faster, more reliable).
  - **Rate limiting:** `throttledFetch()` enforces 100ms min delay between Wikimedia API calls, adaptive backoff to 1000ms on 429 responses, 5s timeout, proper User-Agent header.
  - **Batch enrichment:** `enrichAttractionsBatch()` processes multiple attractions with concurrency limit of 3 (via `withConcurrencyLimit`), isolates individual failures.
  - **Tourism scraping:** `scrapeWebsiteImages()` extracts og:image and `<img>` tags from HTTPS websites, filters logos/icons/favicons, prefers hero/gallery images.
  - **Smart Commons search:** `searchCommonsImagesSmart()` tries full name+city, then simplified name (strips articles/prepositions like "de", "la", "strand", "promenade").
- **Restaurant normalization:** `normalizeRestaurant()` in finalize-trip route fixes Gemini output: priceRange (`$`→`€`), coordinates (`latitude`→`lat`), cuisine (string→array), description/specialties (string→`{nl,en}`). Validation is per-restaurant (valid ones kept, invalid ones skipped).
- **Flow:** Chat → Accept suggestions → Click "Create Trip" → Finalize → Enrich with Wikimedia images → Validate → Save config + attractions + restaurants + itinerary (restaurants non-blocking, itinerary blocking) → Redirect
- **Gemini model:** `gemini-2.5-flash` with `tools: [{ googleSearch: {} }]` for grounding
- **Attraction normalization:** AI-generated enum values (e.g. `"square"`, `"important"`) are mapped to valid schema values before Zod validation. See `CATEGORY_MAP` and `PRIORITY_MAP` in attractions endpoint.
- **Itinerary normalization:** `normalizeItinerary()` in `src/lib/normalize-itinerary.ts` fixes common Gemini output issues before Zod validation: capitalized/synonym enums (e.g. `"Walk"`→`"walk"`, `"taxi"`→`"car"`, `"Breakfast"`→`"breakfast"`), AM/PM→24h time conversion, string→number coercion, plain string→`{nl,en}` localized string coercion, `latitude`/`longitude`→`lat`/`lng` coordinate normalization, and cleanup of invalid optional fields. Applied in both `finalize-trip` and `itinerary` save endpoints.
- **Finalize prompt:** Uses a concrete one-shot example (Rome trip day) instead of abstract `"..."` placeholders, plus explicit FORMAT RULES block calling out the 5 most common Gemini mistakes.
- **Optional attractionId:** `Activity.attractionId` is optional — Gemini generates free-form activities (train transfers, free time, souvenir shopping) that don't reference a specific attraction. All consumers (planner, map, budget) handle this gracefully.

### AI Trip Story Architecture
- **Story API** (`/api/trips/[slug]/story`): GET returns saved story, POST generates a new one using Gemini
- **Generation:** `gemini-2.5-flash` with `responseMimeType: 'application/json'` (no tools needed, all data comes from itinerary/attractions/restaurants)
- **Narrative styles:** adventure, cultural, romantic, family — each has tailored writing instructions
- **Data structure:** `TripStory` with `StoryChapter[]`, each containing `StoryBlock[]` (discriminated union: narrative, attraction_highlight, meal_highlight, transition)
- **Normalization:** `normalizeStory()` fixes capitalized enums, plain strings → LocalizedString, string → number coercion (same pattern as normalizeItinerary)
- **Storage:** `story.json` in trip data directory, wrapped as `{ story: TripStory }`
- **Cache:** `storyCache` in JsonTripDataRepository, does not cache null (same pattern as getItinerary)
- **Homepage integration:** Trip homepage shows `TripStorySection` when itinerary exists, falls back to quick links when no itinerary
- **Print styles:** `@media print` hides story-actions and trip-context-bar, sets serif font

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
# Optional: DATA_BACKEND=json (default) or DATA_BACKEND=firestore (future)
```

### Commands
```bash
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Production build
npm run lint             # ESLint

# Testing
npm run test:unit        # Run all Vitest tests (~255 tests)
npm run test:unit:watch  # Vitest in watch mode
npm run test:integration # Playwright integration tests (~41 tests, headed)
npm run test:e2e         # Playwright E2E tests (1 test, headed, 10min timeout)
npm run test:playwright  # All Playwright tests (headed)
```

### Testing Strategy

**Vitest (~255 tests)** — fast, no browser needed:
- **Unit tests** (`tests/unit/`): budget calculator, schemas, planner utils, normalize-itinerary, normalize-story, city-colors, wikimedia enrichment (48 tests)
- **Hook tests** (`tests/hooks/`): useFavorites, useDayComments
- **API route tests** (`tests/api/`): all 7 API routes with mocked repositories

**Playwright (~42 tests)** — headed Chrome browser:
- **Integration** (`tests/integration/`, ~41 tests): navigation, i18n, trip selector, trip story (chapters/blocks/locale/actions), attractions (list/detail/filters/search/sort/favorites), restaurants (filters/search/cuisine/expand), planner (split-view/day-sync/mobile/panel/comments/walking-gaps), map (markers/route/restaurants), budget (calculator/what-if), hero, 404
- **E2E** (`tests/e2e/`, 1 test): AI trip creation + story generation (uses live Gemini API, 10min timeout)

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
- [x] Trip finalization: extract structured data from conversation (tripConfig + attractions + restaurants + itinerary)
- [x] Auto-generate restaurants (3-4 per city) and day-by-day itinerary during finalization
- [x] Restaurant CRUD API: batch save, add single, remove by ID (dynamic trips only)
- [x] Itinerary save API for generated itineraries
- [x] AI-powered restaurant search endpoint (Gemini + Google Search)
- [x] RestaurantSearch component with city filter pills and add buttons
- [x] Two-step remove confirmation on RestaurantCard (matching TripCard delete pattern)
- [x] Stateful RestaurantsList with local state for add/remove operations
- [x] Attraction enum normalization (AI values like "square"→"monument", "important"→"essential")
- [x] Trip CRUD API: create trip + attractions as JSON files on disk
- [x] Trip deletion with two-step confirmation (user-created trips only), clears all caches
- [x] Hybrid trip registry: static TS configs + dynamic JSON configs
- [x] GenericHeader for non-trip pages
- [x] Cache invalidation for fresh trip data (attraction, restaurant, itinerary caches)
- [x] E2E Playwright test: full create → verify restaurants + planner + budget → delete flow
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

## Agreed Plans

<!-- When the user agrees to a proposed plan, record it here as a checklist.
     Check off items as they are implemented and committed.
     Keep completed plans for reference; archive old ones under a "### Completed" sub-heading. -->

### Completed

#### Chat UX Fixes: Markdown + JSON Blocks + Media Enrichment
- [x] Install react-markdown + render markdown in assistant chat messages
- [x] Strengthen system prompt for strict JSON attraction_suggestion blocks
- [x] Add `.chat-markdown` prose styles in globals.css
- [x] Fix trip homepage to use dynamic trip data (not hardcoded Andalusia)
- [x] Fix story generation truncation (maxOutputTokens: 65536)
- [x] Server-side Wikimedia image enrichment (never trust LLM URLs)
- [x] Restaurant normalization in finalize-trip (priceRange, coordinates, cuisine)
- [x] Thumbnail previews on AttractionSuggestion cards
- [x] E2E test updated with story generation step (no deletion)

#### AI Chat Flow Improvement
- [x] Phase 1: Rewrite chat system prompt with phased conversation flow + readiness signaling
- [x] Phase 2: Add TripReadiness state + parse trip_ready blocks + smarter create gate in TripChat
- [x] Phase 3: Parse + render trip_ready blocks as status card in ChatMessage
- [x] Phase 4: Pass acceptedAttractions to finalize endpoint + use in prompt
- [x] Phase 5: Add readiness translations (EN + NL)
- [x] Phase 6: Add readiness checklist to TripPreview sidebar

#### Trip Story Feature
- [x] Phase 1: Types + Zod schemas (TripStory, StoryBlock, StoryChapter, NarrativeStyle)
- [x] Phase 2: Story normalizer (normalize-story.ts + tests)
- [x] Phase 3: Repository layer (getStory/saveStory on TripDataRepository)
- [x] Phase 4: Story API route (GET + POST /api/trips/[slug]/story)
- [x] Phase 5: Translations (NL + EN story.* keys)
- [x] Phase 6: Frontend components (TripStorySection, StoryStylePicker, StoryChapterView, StoryBlockRenderer, StoryActions)
- [x] Phase 7: Homepage integration (replace quick links with story) + print styles

#### Multi-Language Media Enrichment System
- [x] Add `wikipediaSlug` to Attraction type + Zod schema
- [x] Write ~35 unit tests for wikimedia enrichment pipeline (TDD)
- [x] Rewrite `src/lib/wikimedia.ts` with Wikidata, multi-lang Wikipedia, smart Commons, tourism scraping
- [x] Update chat system prompt with `wikipediaSlug` + website instructions
- [x] Update finalize-trip prompt with `wikipediaSlug` + website quality instructions
- [x] Switch finalize-trip to `enrichAttractionsBatch()` with region/website/slug
- [x] Update `fetchHeroImage()` with multi-lang fallback
- [x] Update documentation (CLAUDE.md, MEMORY.md)
