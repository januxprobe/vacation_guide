# Resources & Patterns for Trip Creation

This document tracks reusable patterns, APIs, and resources for creating new trips in the Vacation Guide platform.

## Image Acquisition

### Wikimedia Commons API
The primary source for free-to-use attraction images.

**Search endpoint:**
```
https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=filetype:bitmap+{search_term}&gsrlimit=10&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1200&format=json
```

**Requirements:**
- User-Agent header: `VacationGuideBot/1.0 (your-url; your-email) python-urllib/3`
- Rate limiting: 1.5-2.5 seconds between requests
- Proper User-Agent prevents 429 (Too Many Requests) errors

**License:** CC-BY-SA (attribution required in production)

**Download scripts:** See `scripts/download-images.py` (TODO: move from /tmp)

### Unsplash API (deferred)
- Requires API key for production use
- Higher quality but limited free tier
- Proxy route planned: `/api/unsplash/[query]`

## Video Sources

### YouTube Embeds (No API Key Needed)
Embed URL pattern: `https://www.youtube-nocookie.com/embed/{VIDEO_ID}`

**Known Rick Steves video IDs:**
| Attraction | Video ID | Description |
|---|---|---|
| Seville Alcazar | `8FOx1c1cZgs` | Rick Steves' Seville |
| Mezquita Cordoba | `7YvNMDy_h3g` | Rick Steves' Córdoba |
| Alhambra Granada | `iEseJViidy8` | Rick Steves' Granada |
| Cordoba Mosque | `vBbtkaYcAjc` | Classroom: Cordoba |
| Granada overview | `F2ZJH3p7wg8` | Classroom: Granada |

**Finding videos:**
1. Search YouTube for `{attraction name} travel guide`
2. Rick Steves, DW Travel, and Lonely Planet have reliable content
3. Use `youtube-nocookie.com` domain for GDPR-compliant embedding

## Data Schema Template

### Attraction JSON Template
```json
{
  "id": "{city}-{slug}",
  "name": "Full Attraction Name",
  "city": "{city-id}",
  "category": "monument|church|palace|museum|neighborhood|nature",
  "description": {
    "nl": "Dutch description...",
    "en": "English description..."
  },
  "coordinates": {
    "lat": 0.0,
    "lng": 0.0
  },
  "pricing": {
    "adult": 0,
    "student": 0,
    "child": 0,
    "guidedTour": 0,
    "notes": {
      "nl": "Pricing notes in Dutch",
      "en": "Pricing notes in English"
    }
  },
  "duration": 60,
  "priority": "essential|recommended|optional",
  "images": [],
  "thumbnail": "/images/attractions/{city}/{slug}.jpg",
  "media": [
    {
      "type": "image|video",
      "src": "path or YouTube ID",
      "alt": { "nl": "Alt text NL", "en": "Alt text EN" }
    }
  ],
  "bookingRequired": false,
  "openingHours": {
    "monday": "09:00-18:00",
    "tuesday": "09:00-18:00"
  },
  "website": "https://...",
  "tips": {
    "nl": "Tips in Dutch",
    "en": "Tips in English"
  }
}
```

### Itinerary JSON Template
Each trip can have an `itinerary.json` file in its data directory. See `src/data/trips/andalusia-2026/itinerary.json` for a complete example.

```json
{
  "trip": {
    "title": { "nl": "Trip Name NL", "en": "Trip Name EN" },
    "startDate": "2026-09-01",
    "endDate": "2026-09-07"
  },
  "days": [
    {
      "date": "2026-09-01",
      "dayNumber": 1,
      "city": "city-id",
      "title": { "nl": "Day title NL", "en": "Day title EN" },
      "activities": [
        {
          "time": "09:00",
          "attractionId": "city-attraction-slug",
          "duration": 120,
          "notes": { "nl": "Notes NL", "en": "Notes EN" },
          "transport": {
            "method": "walk|bus|train|car",
            "duration": 10,
            "cost": 3.00,
            "notes": { "nl": "Transport notes NL", "en": "Transport notes EN" }
          }
        }
      ],
      "meals": [
        {
          "type": "breakfast|lunch|dinner|snack",
          "time": "08:30",
          "neighborhood": "Area name",
          "estimatedCost": 15,
          "notes": { "nl": "Meal notes NL", "en": "Meal notes EN" }
        }
      ]
    }
  ]
}
```

### Restaurant JSON Template
Each trip can have a `restaurants.json` file. See `src/data/trips/andalusia-2026/restaurants.json` for a complete example.

```json
{
  "restaurants": [
    {
      "id": "city-restaurant-slug",
      "name": "Restaurant Name",
      "city": "city-id",
      "neighborhood": "Area Name",
      "coordinates": { "lat": 37.38, "lng": -5.99 },
      "cuisine": ["tapas", "traditional"],
      "priceRange": "€|€€|€€€|€€€€",
      "specialties": { "nl": "Specialties NL", "en": "Specialties EN" },
      "description": { "nl": "Description NL", "en": "Description EN" },
      "website": "https://..."
    }
  ]
}
```

### Budget Calculator
The budget is derived automatically from the itinerary + attraction pricing data - no separate budget data file is needed. The `calculateBudget()` function in `src/lib/budget-calculator.ts`:
- Reads itinerary days and resolves attraction pricing per activity
- Includes all attractions in the day breakdown, including free ones (€0)
- Applies student discount per traveler group where applicable
- Adds transport costs (per-person) and meal estimates (per-person)
- Returns items list, subtotalByCategory, total, and perPerson

### Trip Config Template
See `src/config/trips/andalusia-2026.ts` for a complete static example, or `src/data/trips/torremolinos-2027/trip-config.json` (when created via AI) for a JSON-based example.

### GPS Coordinates
- **Google Maps:** Right-click on location -> "What's here?" -> Copy coordinates
- **OpenStreetMap:** Click location -> check URL for lat/lng
- Format: `{ lat: 37.3826, lng: -5.9911 }`

### Pricing Research Sources
1. Official attraction websites (most reliable)
2. GetYourGuide / Viator (current prices, student discounts)
3. TripAdvisor (user-reported prices)
4. Google Maps (sometimes shows prices)

## Translation Workflow

### Current Languages
- **Primary:** Dutch (nl) - main audience
- **Secondary:** English (en)

### Adding Translations
1. All UI strings go in `src/i18n/messages/{locale}.json`
2. Trip-specific text (city names, descriptions) goes in the TripConfig's `LocalizedString` fields
3. Attraction data uses `LocalizedString` objects inline in JSON files

### Future: Machine Translation
- Consider DeepL API for initial translation drafts
- Always review machine translations manually
- Especially careful with attraction names (proper nouns)

## Creating a New Trip

### Option 1: AI Trip Builder (recommended)
1. Navigate to `/{locale}/create-trip` (or click "Create New Trip" on the homepage)
2. Describe your trip in natural language to the Gemini AI chat
3. Accept attraction suggestions (the AI uses Google Search grounding for real data)
4. Click "Create Trip" to save — the finalize API generates:
   - `trip-config.json` — trip configuration
   - Attraction JSON files (one per attraction, in `attractions/{city}/`)
   - `restaurants.json` — 3-4 restaurants per city with real names, coordinates, and bilingual descriptions
   - `itinerary.json` — day-by-day plan referencing attraction IDs, with meals and transport (best-effort; may fail Zod validation)
5. After creation, visit the restaurants page to search for and add more restaurants via AI-powered search
6. Remove restaurants with the trash icon (two-step confirmation)
7. User-created trips can be deleted from the trip selector homepage

**Notes on AI-generated data:**
- Restaurants are reliably generated (Zod validation is lenient for optional fields)
- Itinerary generation is best-effort — Gemini must produce exact `attractionId` matches, valid transport enums, etc. Falls back gracefully to `null` if validation fails
- Attraction categories/priorities are normalized (e.g. `"square"` → `"monument"`, `"important"` → `"essential"`) before validation

### Option 2: Manual
1. Create trip config: `src/config/trips/{trip-slug}.ts` (implement TripConfig)
2. Register in `src/config/trips/index.ts`
3. Create data directory: `src/data/trips/{trip-slug}/attractions/{city}/`
4. Add attraction JSON files (one per attraction, validated by Zod schema)
5. Add `itinerary.json` to `src/data/trips/{trip-slug}/` (optional, enables planner + budget pages)
6. Add `restaurants.json` to `src/data/trips/{trip-slug}/` (optional, enables restaurant page + planner restaurant markers)
7. Add images to `public/images/attractions/{city}/`
8. Update translation files if new categories or UI terms are needed
9. Build and test: `npm run build && npx playwright test --headed`

### Validation
- Zod schemas in `src/lib/schemas.ts` validate all data:
  - `attractionSchema` validates individual attraction files
  - `tripConfigSchema` validates JSON-based trip configs created by the AI builder
  - `itinerarySchema` validates itinerary.json files (days, activities, meals, transport)
  - `restaurantSchema` / `restaurantsFileSchema` validates restaurants.json files
- Invalid JSON files are logged as warnings but don't break the build
- Run `npm run build` to catch data issues early

### Hybrid Trip Registry
The trip registry (`src/config/trips/index.ts`) merges two sources:
- **Static trips:** TypeScript configs in `src/config/trips/*.ts` (cannot be deleted)
- **Dynamic trips:** JSON configs in `src/data/trips/*/trip-config.json` (created by AI, can be deleted)

Call `clearTripCache()` before `getAllTrips()` in server components to ensure fresh data.

## Restaurant CRUD API

Dynamic (AI-created) trips support restaurant management. Static trips (e.g. `andalusia-2026`) return 403.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/trips/{slug}/restaurants` | Batch save `restaurants.json` (used during trip creation) |
| PUT | `/api/trips/{slug}/restaurants` | Add a single restaurant (checks duplicate IDs) |
| DELETE | `/api/trips/{slug}/restaurants` | Remove a restaurant by ID (body: `{ "id": "..." }`) |

### Restaurant Search API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/search-restaurants` | Search for restaurants via Gemini + Google Search |

**Request body:** `{ "query": "tapas", "city": "seville", "tripSlug": "andalusia-2026" }`
**Response:** `{ "restaurants": [Restaurant, ...] }` (Zod-validated, invalid entries filtered out)

**Important:** The Gemini `responseMimeType: 'application/json'` option cannot be combined with `tools: [{ googleSearch: {} }]`. The search endpoint relies on the system prompt to produce JSON output.

## Architecture Notes

### URL Structure
```
/{locale}/{tripSlug}/                    Trip homepage
/{locale}/{tripSlug}/planner             Unified planner (map + itinerary split view)
/{locale}/{tripSlug}/attractions         Attraction list
/{locale}/{tripSlug}/attractions/{id}    Attraction detail
/{locale}/{tripSlug}/restaurants          Restaurant tips (+ search/add/remove for dynamic trips)
/{locale}/{tripSlug}/budget              Budget calculator
```

**Removed routes** (redirected to `/planner` via backward-compat pages):
- `/{locale}/{tripSlug}/itinerary` → merged into planner
- `/{locale}/{tripSlug}/map` → merged into planner

### Color System
- Each city in a trip has a hex color defined in TripConfig
- Colors are applied via inline styles (not Tailwind classes) because Tailwind v4 JIT cannot handle runtime-interpolated class names
- Utility functions in `src/lib/city-colors.ts` handle color conversions (hex to rgba, badge styles, gradients)
- Trip theme has a `primaryColor` used for header branding and CTA buttons
