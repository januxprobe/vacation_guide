# Vacation Guide - Trip Planning Platform

## Project Overview

A reusable Next.js web application for planning multi-city trips. Currently configured with an Andalusia trip (Seville, Cordoba, Granada, September 2026) for 5 people: 2 adults (50+) and 3 young adults (~20 years). The platform supports multiple trips via URL routing (`/[locale]/[tripSlug]/...`).

### Key Features
- Interactive daily itinerary with timeline
- Interactive map with OpenStreetMap (Leaflet)
- Attraction details with photos, prices, opening hours
- Restaurant tips by neighborhood
- Budget calculator with configurable student discounts
- Bilingual: Dutch (NL) and English (EN)
- Deployable to Google Cloud Run

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 16 (App Router) | Core framework with SSR/SSG |
| TypeScript | Type safety |
| Tailwind CSS v4 | Styling |
| shadcn/ui | UI component primitives |
| next-intl v4 | Internationalization (NL/EN) |
| React-Leaflet | Interactive maps |
| Leaflet Routing Machine | Route visualization |
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
│   │   └── [locale]/                    # i18n routing (nl/en)
│   │       ├── layout.tsx               # Locale layout (NextIntlClientProvider + default TripConfigProvider)
│   │       ├── page.tsx                 # Redirect to default trip
│   │       ├── [tripSlug]/              # Trip-scoped routes
│   │       │   ├── layout.tsx           # Trip layout (resolves TripConfig, provides context)
│   │       │   ├── page.tsx             # Trip homepage (hero, stats, quick links)
│   │       │   ├── attractions/
│   │       │   │   ├── page.tsx         # Attractions list with filters
│   │       │   │   └── [id]/page.tsx    # Attraction detail (static gen)
│   │       │   ├── itinerary/page.tsx   # Day overview
│   │       │   ├── map/page.tsx         # Interactive map
│   │       │   ├── restaurants/page.tsx # Restaurant tips
│   │       │   └── budget/page.tsx      # Budget calculator
│   │       ├── attractions/page.tsx     # Backward-compat redirect
│   │       ├── itinerary/page.tsx       # Backward-compat redirect
│   │       ├── map/page.tsx             # Backward-compat redirect
│   │       ├── restaurants/page.tsx     # Backward-compat redirect
│   │       └── budget/page.tsx          # Backward-compat redirect
│   ├── config/
│   │   ├── trip-config.ts               # TripConfig, CityConfig, TravelerGroup interfaces
│   │   ├── trip-context.tsx             # React context + useTripConfig() hook
│   │   └── trips/
│   │       ├── index.ts                 # Trip registry (getTripBySlug, getAllTrips)
│   │       └── andalusia-2026.ts        # Andalusia trip config instance
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx               # Navigation + language switcher (config-driven colors)
│   │   │   └── LanguageSwitcher.tsx      # NL/EN toggle
│   │   ├── ui/                          # shadcn/ui (empty, add as needed)
│   │   ├── attractions/
│   │   │   ├── AttractionCard.tsx       # Card with config-driven color bar, badges, pricing
│   │   │   ├── AttractionDetail.tsx     # Full detail view (config-driven colors)
│   │   │   ├── AttractionFilter.tsx     # City/category/priority filters (cities from config)
│   │   │   ├── AttractionsList.tsx      # List with filtering and sorting
│   │   │   ├── MediaGallery.tsx         # Image/video gallery with carousel
│   │   │   ├── FullscreenCarousel.tsx   # Fullscreen image viewer
│   │   │   ├── VideoEmbed.tsx           # YouTube embed component
│   │   │   └── PriceInfo.tsx            # Price breakdown display
│   │   ├── itinerary/                   # TODO: Phase 3
│   │   ├── budget/                      # TODO: Phase 3
│   │   ├── restaurants/                 # TODO: Phase 3
│   │   ├── map/                         # TODO: Phase 4
│   │   ├── home/                        # TODO: Phase 5
│   │   └── shared/                      # TODO: Phase 5
│   ├── lib/
│   │   ├── utils.ts                     # cn() helper from shadcn
│   │   ├── data-loaders.ts             # Config-driven fs.readFileSync + Zod validation
│   │   ├── schemas.ts                   # Zod schemas for attraction data validation
│   │   └── city-colors.ts              # Color utilities (hex->rgba, badge/gradient styles)
│   ├── types/
│   │   └── index.ts                     # All TypeScript interfaces (City = string)
│   ├── data/
│   │   └── trips/
│   │       └── andalusia-2026/
│   │           └── attractions/
│   │               ├── seville/         # 10 JSON files
│   │               ├── cordoba/         # 7 JSON files
│   │               └── granada/         # 8 JSON files
│   └── i18n/
│       ├── routing.ts                   # Locale config + navigation wrappers
│       ├── request.ts                   # Server-side locale resolution
│       └── messages/
│           ├── nl.json                  # Dutch translations (generic UI)
│           └── en.json                  # English translations (generic UI)
├── public/
│   ├── images/{cities,attractions}/     # Static images
│   └── icons/markers/                   # Custom map markers
├── tests/
│   ├── visual-test.spec.ts             # Core visual tests (navigation, i18n, mobile)
│   └── attractions-test.spec.ts        # Attractions feature tests (list, detail, filters)
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
- **Map components** must use `'use client'` and dynamic import with `ssr: false`

### City Color Scheme
City colors are defined in trip config (`src/config/trips/andalusia-2026.ts`), not hardcoded:
- Seville: Orange (`#f97316`)
- Cordoba: Red (`#dc2626`)
- Granada: Green (`#16a34a`)

Colors are applied via inline styles using `src/lib/city-colors.ts` utilities (not Tailwind classes, because Tailwind v4 JIT can't handle runtime-interpolated classes).

### Multi-Trip Architecture
- Trip configs: `src/config/trips/*.ts` (implement TripConfig interface)
- Trip registry: `src/config/trips/index.ts` (maps slugs to configs)
- Trip context: `src/config/trip-context.tsx` (React context for client components)
- URL structure: `/{locale}/{tripSlug}/attractions/...`
- Old URLs (without tripSlug) redirect to the default trip
- Adding a new trip = new config file + new data directory + register in index.ts

## Development

### Commands
```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint

# Testing
npx playwright test --headed              # Run all visual tests (visible browser)
npx playwright test --headed --grep "X"   # Run specific test
```

### Testing Strategy
- Playwright visual tests in `tests/visual-test.spec.ts`
- Tests run in headed mode (visible Chrome browser) so progress can be observed
- After any changes, run `npx playwright test --headed` to verify
- 8 tests total: 4 core (NL navigation, language switching, mobile, HTML structure) + 4 attractions (list/filters, detail page, English mode, category filter)

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
- [ ] Unsplash API proxy route for images (deferred - using placeholders)
- [ ] PhotoGallery component (deferred - needs images)

### Phase 2.5: Platform Generalization [COMPLETED]
- [x] TripConfig interface + andalusia-2026 config instance
- [x] React context (TripConfigProvider + useTripConfig hook)
- [x] Dynamic data loading (fs.readFileSync + directory scanning, replaces 25 static imports)
- [x] Zod validation schemas for attraction data
- [x] City color utilities (inline styles replacing hardcoded Tailwind classes)
- [x] All components use config context (AttractionCard, AttractionDetail, AttractionFilter, Header, homepage)
- [x] Multi-trip URL routing: /[locale]/[tripSlug]/...
- [x] Trip registry with getTripBySlug/getAllTrips
- [x] Backward-compatible redirects (old URLs -> default trip)
- [x] RESOURCES.md documentation for future trip creation
- [x] All 8 Playwright tests passing
- [x] City type generalized from union to string
- [x] BudgetConfig generalized to use travelerCounts Record

### Phase 3: Itinerary & Budget [PENDING]
- [ ] Complete itinerary JSON (`september-2026.json`) with all 7 days
- [ ] DayCard and ActivityTimeline components
- [ ] Itinerary overview and day detail pages
- [ ] Budget calculator logic (`budget-calculator.ts`)
- [ ] DiscountSelector, BudgetSummary, CategoryBreakdown components
- [ ] Restaurant data JSON per city (3-5 restaurants per neighborhood)
- [ ] RestaurantCard component and restaurants page
- [ ] Add Playwright tests for itinerary, budget, restaurants

### Phase 4: Interactive Map [PENDING]
- [ ] React-Leaflet setup with dynamic import (ssr: false)
- [ ] InteractiveMap client component with OpenStreetMap tiles
- [ ] Custom colored markers per city (orange/red/green SVGs)
- [ ] AttractionMarker with popup info
- [ ] RouteLayer for routes between attractions
- [ ] Marker clustering (react-leaflet-cluster)
- [ ] Map filters: by city, by day, show/hide restaurants
- [ ] Full-screen map page + mini-maps on detail pages
- [ ] Add Playwright tests for map

### Phase 5: Homepage & Polish [PENDING]
- [ ] Hero section with Andalusia imagery
- [ ] Trip overview card, featured attractions carousel
- [ ] Loading skeletons and error boundaries
- [ ] Smooth transitions between pages
- [ ] Mobile optimizations (touch targets, bottom sheets)
- [ ] Lighthouse audit (target: >90 performance, >95 accessibility)
- [ ] Content enrichment: weather info, packing list, travel tips

### Phase 6: Deployment to GCP [PENDING]
- [ ] Multi-stage Dockerfile (deps -> build -> runtime)
- [ ] `.dockerignore` for minimal images
- [ ] Local Docker testing
- [ ] GCP Project setup (Cloud Run, Artifact Registry, Cloud Build)
- [ ] `cloudbuild.yaml` configuration
- [ ] GitHub Actions CI/CD (`.github/workflows/deploy.yml`)
- [ ] Environment variables (Unsplash API key)
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
