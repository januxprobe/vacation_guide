# Vacation Guide

A reusable trip planning platform built with Next.js. Create detailed travel guides with interactive attraction browsing, city-based filtering, media galleries, and bilingual support (Dutch/English).

Currently features a complete **Andalusia 2026** trip covering Seville, Cordoba, and Granada with 25 attractions, photos, videos, pricing info, and opening hours.

## Features

- **Multi-trip architecture** -- each trip has its own config, data, and URL namespace (`/nl/andalusia-2026/attractions`)
- **25 attractions** with photos, YouTube videos, pricing, opening hours, and tips
- **City-based color coding** -- Seville (orange), Cordoba (red), Granada (green)
- **Filtering & sorting** -- by city, category (monument, palace, church...), and priority (essential, recommended, optional)
- **Bilingual** -- Dutch (NL) and English (EN) with full i18n support
- **Media galleries** -- fullscreen carousel with images and embedded YouTube videos
- **Responsive** -- works on desktop and mobile with collapsible navigation
- **Data validation** -- Zod schemas validate all attraction data at build time

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 16 (App Router) | SSR/SSG framework |
| TypeScript | Type safety |
| Tailwind CSS v4 | Styling |
| next-intl v4 | Internationalization |
| Zod | Data validation |
| Playwright | E2E testing |
| Lucide React | Icons |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) -- you'll be redirected to the default trip.

## Project Structure

```
src/
  config/trips/          # Trip configurations (cities, colors, stats)
  data/trips/            # Attraction JSON data per trip
  app/[locale]/[tripSlug]/  # Trip-scoped pages
  components/            # Reusable UI components
  lib/                   # Data loaders, color utilities, Zod schemas
  i18n/                  # Translation files (nl.json, en.json)
```

## Adding a New Trip

1. Create a config file in `src/config/trips/my-trip.ts` implementing the `TripConfig` interface
2. Register it in `src/config/trips/index.ts`
3. Add attraction data in `src/data/trips/my-trip/attractions/{city}/*.json`
4. Add images to `public/images/attractions/`
5. Run `npm run build` to validate data and generate pages

See [RESOURCES.md](./RESOURCES.md) for detailed patterns on data sourcing, image acquisition, and trip creation.

## Testing

```bash
npx playwright test              # Run all 8 tests (headless)
npx playwright test --headed     # Run with visible browser
```

## Scripts

```bash
npm run dev       # Development server
npm run build     # Production build
npm run lint      # ESLint
```

## License

Private project.
