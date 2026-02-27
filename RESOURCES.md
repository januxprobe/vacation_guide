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
4. Click "Create Trip" to save
5. The AI creates `src/data/trips/{slug}/trip-config.json` and attraction JSON files automatically
6. User-created trips can be deleted from the trip selector homepage

### Option 2: Manual
1. Create trip config: `src/config/trips/{trip-slug}.ts` (implement TripConfig)
2. Register in `src/config/trips/index.ts`
3. Create data directory: `src/data/trips/{trip-slug}/attractions/{city}/`
4. Add attraction JSON files (one per attraction, validated by Zod schema)
5. Add images to `public/images/attractions/{city}/`
6. Update translation files if new categories or UI terms are needed
7. Build and test: `npm run build && npx playwright test --headed`

### Validation
- Zod schemas in `src/lib/schemas.ts` validate all attraction and trip config data
- `tripConfigSchema` validates JSON-based trip configs created by the AI builder
- `attractionSchema` validates individual attraction files
- Invalid JSON files are logged as warnings but don't break the build
- Run `npm run build` to catch data issues early

### Hybrid Trip Registry
The trip registry (`src/config/trips/index.ts`) merges two sources:
- **Static trips:** TypeScript configs in `src/config/trips/*.ts` (cannot be deleted)
- **Dynamic trips:** JSON configs in `src/data/trips/*/trip-config.json` (created by AI, can be deleted)

Call `clearTripCache()` before `getAllTrips()` in server components to ensure fresh data.

## Architecture Notes

### URL Structure
```
/{locale}/{tripSlug}/                    Trip homepage
/{locale}/{tripSlug}/attractions         Attraction list
/{locale}/{tripSlug}/attractions/{id}    Attraction detail
/{locale}/{tripSlug}/itinerary           Day planning
/{locale}/{tripSlug}/map                 Interactive map
/{locale}/{tripSlug}/restaurants          Restaurant tips
/{locale}/{tripSlug}/budget              Budget calculator
```

### Color System
- Each city in a trip has a hex color defined in TripConfig
- Colors are applied via inline styles (not Tailwind classes) because Tailwind v4 JIT cannot handle runtime-interpolated class names
- Utility functions in `src/lib/city-colors.ts` handle color conversions (hex to rgba, badge styles, gradients)
- Trip theme has a `primaryColor` used for header branding and CTA buttons
