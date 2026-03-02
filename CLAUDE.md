# Vacation Guide - Trip Planning Platform

## Important Reminders

- **Never commit or push without manual testing.** Let the user manually test first. Only commit/push when explicitly asked.
- **Do NOT run tests unless explicitly asked.** Never run `npx playwright test` or `npm run build` on your own.
- **Always update documentation before committing.** Ensure `CLAUDE.md`, `README.md`, and `RESOURCES.md` are up to date.
- **Record agreed plans immediately.** Write agreed plans as checklists in `## Agreed Plans` at the bottom of this file.
- **Test-Driven Development (TDD).** Write tests FIRST, then implement to make them pass.
- **Docs live at project root:** `README.md`, `CLAUDE.md`, `RESOURCES.md`, `.env.example`. Don't glob into `node_modules/`.

## Project Overview

A Next.js web app for planning multi-city trips. Users browse pre-configured trips or create new ones via an AI-powered trip builder (Gemini + Google Search grounding). Supports multiple trips via `/{locale}/{tripSlug}/...` routing.

**Key features:** Trip selector homepage, AI trip builder (chat → finalize → enrich → save), AI travel story (4 narrative styles), restaurant search & CRUD, attraction details, budget calculator, unified planner (map + itinerary), bilingual (NL/EN), walking routes (Valhalla), loading skeletons, error boundaries, accessibility.

**Pre-configured trip:** Andalusia 2026 — Seville, Cordoba, Granada (September 2026, 5 travelers)

## Tech Stack

Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, next-intl v4, @google/genai (Gemini), React-Leaflet + Valhalla (OSM), react-leaflet-cluster, Zod, react-markdown, Lucide React, Playwright.

## Project Structure

```
vacation_guide/
├── src/
│   ├── app/
│   │   ├── layout.tsx, globals.css
│   │   ├── api/
│   │   │   ├── trips/
│   │   │   │   ├── route.ts                    # GET/POST - List/create trips
│   │   │   │   └── [slug]/
│   │   │   │       ├── route.ts                # GET/DELETE - Get/delete trip
│   │   │   │       ├── attractions/route.ts    # POST - Add attraction
│   │   │   │       ├── restaurants/route.ts    # POST/PUT/DELETE - Restaurant CRUD
│   │   │   │       ├── itinerary/route.ts      # POST - Save itinerary
│   │   │   │       └── story/route.ts          # GET/POST - Get/generate story
│   │   │   └── ai/
│   │   │       ├── chat/route.ts               # POST - Streaming Gemini chat (SSE)
│   │   │       ├── finalize-trip/route.ts      # POST - Extract structured trip data
│   │   │       └── search-restaurants/route.ts # POST - Gemini restaurant search
│   │   └── [locale]/                           # i18n routing (nl/en)
│   │       ├── layout.tsx, loading.tsx, error.tsx, not-found.tsx
│   │       ├── page.tsx                        # Trip selector homepage
│   │       ├── create-trip/page.tsx            # AI trip builder
│   │       └── [tripSlug]/                     # Trip-scoped routes
│   │           ├── layout.tsx                  # TripConfigProvider + Header
│   │           ├── page.tsx                    # Trip homepage (hero + story)
│   │           ├── attractions/{page,[id]/page}.tsx
│   │           ├── planner/page.tsx            # Unified planner (map + itinerary)
│   │           ├── restaurants/page.tsx
│   │           └── budget/page.tsx
│   ├── config/
│   │   ├── trip-config.ts                      # TripConfig, CityConfig interfaces
│   │   ├── trip-context.tsx                    # React context + useTripConfig()
│   │   └── trips/                              # Static trip configs (andalusia-2026.ts)
│   ├── components/
│   │   ├── layout/          # GlobalBar, TripContextBar, Header, GenericHeader, LanguageSwitcher
│   │   ├── ui/              # shadcn/ui components
│   │   ├── attractions/     # AttractionCard, AttractionDetail, AttractionFilter, AttractionsList, MediaGallery, etc.
│   │   ├── trip-selector/   # TripCard, CreateTripCard, TripGrid
│   │   ├── planner/         # PlannerView, PlannerWrapper, PlannerMap, PlannerPanel, PlannerTimeline, etc.
│   │   ├── restaurants/     # RestaurantCard, RestaurantFilter, RestaurantSearch, RestaurantsList
│   │   ├── budget/          # BudgetCalculator, BudgetSummaryCard, CategoryBreakdown, DayBreakdown
│   │   ├── map/             # MapLegend, MapPopup, MapRoute, map-utils.ts
│   │   ├── story/           # TripStorySection, StoryStylePicker, StoryChapterView, StoryBlockRenderer, StoryActions
│   │   └── trip-creator/    # TripChat, ChatMessage, ChatInput, AttractionSuggestion, TripPreview, CreateTripButton
│   ├── hooks/useOsrmRoute.ts                   # Valhalla pedestrian walking route hook
│   ├── lib/
│   │   ├── utils.ts, schemas.ts, city-colors.ts, budget-calculator.ts
│   │   ├── wikimedia.ts                        # Multi-source media enrichment pipeline
│   │   ├── normalize-itinerary.ts, normalize-story.ts
│   │   └── repositories/                       # DAO layer (types.ts, index.ts, json/)
│   ├── types/index.ts
│   ├── data/trips/andalusia-2026/              # Static trip data (25 attractions, itinerary, restaurants, story)
│   └── i18n/                                   # routing.ts, request.ts, messages/{nl,en}.json
├── tests/
│   ├── unit/       # 7 files: budget-calculator, schemas, planner-utils, normalize-*, city-colors, wikimedia
│   ├── hooks/      # 2 files: useFavorites, useDayComments
│   ├── api/        # 7 files: trips, trips-slug, attractions, restaurants, itinerary, comments, story
│   ├── integration/# 10 files: navigation, trip-selector, trip-homepage, trip-story, attractions, restaurants, planner, planner-map, budget, not-found
│   └── e2e/        # 2 files: create-trip-e2e, chat-flow-e2e
├── middleware.ts, next.config.ts, playwright.config.ts
├── RESOURCES.md                                # Reusable patterns for trip creation
└── package.json
```

## Important Patterns & Conventions

### i18n (next-intl v4)

```typescript
// Server components — MUST pass locale explicitly:
const { locale } = await params;
const t = await getTranslations({ locale });

// Layouts — pass locale to provider:
const messages = await getMessages({ locale });
<NextIntlClientProvider messages={messages} locale={locale} key={locale}>

// Client components — locale from provider:
const t = useTranslations();
```

Language switcher uses `window.location.href` (full page reload required for server component re-rendering).

### Server vs Client Components

- **Pages** are server components → `getTranslations` from `next-intl/server`
- **Interactive components** → `'use client'` + `useTranslations` from `next-intl`
- **Map/Planner** → `'use client'` + dynamic import `ssr: false` via client wrapper

### Header Architecture

Two-row layout: **GlobalBar** (48px, logo + lang switcher) + **TripContextBar** (44px, back link + trip name + nav tabs). `Header.tsx` composes both (92px total, trip pages). `GenericHeader.tsx` uses GlobalBar only (48px, non-trip pages).

### City Colors

Defined in TripConfig per city, applied via inline styles using `src/lib/city-colors.ts` utilities. Tailwind v4 JIT cannot handle runtime-interpolated classes like `bg-${color}-500`.

### Repository / DAO Layer

Two interfaces in `src/lib/repositories/types.ts`: **TripRepository** (trip config CRUD) and **TripDataRepository** (attractions, restaurants, itinerary, story — scoped by `tripSlug`). Factory in `index.ts` returns singletons based on `DATA_BACKEND` env var (`json` default).

Key design: all methods async, `tripSlug` is scope key, caching is internal, validation stays in API routes, `isProtected()` guards static trips. `getItinerary()` does NOT cache `null` results (prevents stale misses from Next.js module duplication).

### Multi-Trip Architecture

- **Static trips:** TS configs in `src/config/trips/*.ts`
- **Dynamic trips:** JSON configs in `src/data/trips/*/trip-config.json`
- **Hybrid:** `JsonTripRepository` merges both. Only dynamic trips can be deleted.

### AI Trip Builder

**Flow:** Chat (SSE + Gemini + Google Search) → Accept suggestions → Finalize (extract tripConfig + attractions + restaurants + itinerary) → Enrich images (Wikimedia pipeline) → Validate (Zod) → Save → Redirect.

**Gemini gotchas:** `responseMimeType` cannot combine with `tools: [{ googleSearch }]`. AI enums need normalization before Zod validation (`CATEGORY_MAP`, `PRIORITY_MAP`, `normalizeItinerary()`, `normalizeRestaurant()`). `Activity.attractionId` is optional (free-form activities). **Never trust LLM-generated media URLs** — use Wikimedia enrichment pipeline instead.

**Wikimedia enrichment** (`src/lib/wikimedia.ts`): Wikidata → multi-lang Wikipedia → Commons search → tourism site scraping. Prompt Gemini for `wikipediaSlug` + `website` (not image URLs). See MEMORY.md for detailed pipeline notes.

### AI Trip Story

Story API (`/api/trips/[slug]/story`): Gemini generates `TripStory` with `StoryChapter[]` containing `StoryBlock[]` (narrative, attraction_highlight, meal_highlight, transition). 4 styles: adventure/cultural/romantic/family. Uses `responseMimeType: 'application/json'` (no tools). `normalizeStory()` fixes AI output before Zod.

### Planner Map

Photo markers with city-colored borders, walking routes via **Valhalla** (`valhalla1.openstreetmap.de/route`, precision 6 polyline), meal markers, CartoDB Positron tiles. **Never use OSRM demo server** for walking (car data only).

## Development

```bash
npm install && cp .env.example .env.local   # Add GEMINI_API_KEY
npm run dev                                  # http://localhost:3000
npm run build                                # Production build
npm run test:unit                            # Vitest (~255 tests)
npm run test:integration                     # Playwright integration (~41 tests, headed)
npm run test:e2e                             # Playwright E2E (2 tests, headed, 10min timeout)
```

**Adding shadcn/ui:** `npx shadcn@latest add <component>`

## Implementation Plan

### Phases 1-5: COMPLETED
Foundation, attractions, platform generalization, trip selector + AI builder, itinerary/restaurants/budget, interactive map, homepage & polish. All features listed in Key Features above.

### Phase 6: Deployment to GCP [PENDING]
- [ ] Multi-stage Dockerfile
- [ ] GCP Project setup (Cloud Run, Artifact Registry)
- [ ] GitHub Actions CI/CD
- [ ] Billing alerts (target: <15 EUR/month)

## Agreed Plans

<!-- When the user agrees to a proposed plan, record it here as a checklist.
     Check off items as they are implemented and committed. -->

### Completed
All previous agreed plans (Chat UX Fixes, AI Chat Flow Improvement, Trip Story Feature, Multi-Language Media Enrichment System) have been implemented and committed. See git history for details.
