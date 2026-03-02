import { GoogleGenAI } from '@google/genai';
import { restaurantSchema, restaurantsFileSchema, itinerarySchema } from '@/lib/schemas';
import { normalizeItinerary } from '@/lib/normalize-itinerary';
import { enrichAttractionsBatch, fetchHeroImage } from '@/lib/wikimedia';

const PRICE_RANGE_MAP: Record<string, string> = {
  '$': '€', '$$': '€€', '$$$': '€€€', '$$$$': '€€€€',
  'budget': '€', 'cheap': '€', 'inexpensive': '€',
  'moderate': '€€', 'mid-range': '€€', 'mid range': '€€', 'medium': '€€',
  'expensive': '€€€', 'upscale': '€€€', 'fine dining': '€€€€', 'luxury': '€€€€',
};

function normalizeRestaurant(r: Record<string, unknown>): void {
  // Fix priceRange: "$" → "€", "moderate" → "€€", etc.
  if (typeof r.priceRange === 'string') {
    const lower = r.priceRange.toLowerCase().trim();
    if (PRICE_RANGE_MAP[lower]) {
      r.priceRange = PRICE_RANGE_MAP[lower];
    } else if (!['€', '€€', '€€€', '€€€€'].includes(r.priceRange)) {
      r.priceRange = '€€'; // safe default
    }
  } else {
    r.priceRange = '€€';
  }

  // Fix coordinates: latitude/longitude → lat/lng, ensure present
  if (!r.coordinates || typeof r.coordinates !== 'object') {
    r.coordinates = { lat: 0, lng: 0 };
  }
  const coords = r.coordinates as Record<string, unknown>;
  if ('latitude' in coords && !('lat' in coords)) {
    coords.lat = coords.latitude; delete coords.latitude;
  }
  if ('longitude' in coords && !('lng' in coords)) {
    coords.lng = coords.longitude; delete coords.longitude;
  }
  if (typeof coords.lat !== 'number') coords.lat = Number(coords.lat) || 0;
  if (typeof coords.lng !== 'number') coords.lng = Number(coords.lng) || 0;

  // Fix cuisine: string → array
  if (typeof r.cuisine === 'string') {
    r.cuisine = (r.cuisine as string).split(',').map((s: string) => s.trim()).filter(Boolean);
  }
  if (!Array.isArray(r.cuisine)) {
    r.cuisine = [];
  }

  // Fix description/specialties: plain string → { nl, en }
  for (const field of ['description', 'specialties'] as const) {
    const val = r[field];
    if (typeof val === 'string' && val) {
      r[field] = { nl: val, en: val };
    }
  }

  // Ensure neighborhood exists
  if (!r.neighborhood || typeof r.neighborhood !== 'string') {
    r.neighborhood = '';
  }
}

const FINALIZE_PROMPT = `Based on the conversation so far, generate the COMPLETE trip configuration, ALL attraction data, restaurant recommendations, and a day-by-day itinerary as a single JSON object.

The output must be valid JSON with this exact structure:
{
  "tripConfig": {
    "id": "destination-year",
    "slug": "destination-year",
    "name": { "nl": "...", "en": "..." },
    "description": { "nl": "...", "en": "..." },
    "region": { "nl": "...", "en": "..." },
    "dates": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" },
    "cities": [
      {
        "id": "city-slug",
        "name": { "nl": "...", "en": "..." },
        "color": "#hexcolor",
        "coordinates": { "lat": 0.0, "lng": 0.0 }
      }
    ],
    "categories": ["monument", "church", "palace", "museum", "neighborhood", "nature"],
    "travelerGroups": [
      {
        "id": "group-id",
        "label": { "nl": "...", "en": "..." },
        "defaultCount": 2,
        "hasStudentDiscount": false
      }
    ],
    "stats": {
      "totalDays": 7,
      "totalCities": 2,
      "totalAttractions": 10,
      "totalDistance": "~200 km"
    },
    "theme": { "primaryColor": "#hexcolor" },
    "highlights": ["attraction-id-1", "attraction-id-2", "attraction-id-3"],
    "dataDirectory": "destination-year"
  },
  "attractions": [
    {
      "id": "city-attraction-name",
      "name": "Attraction Name",
      "city": "city-id",
      "category": "monument",
      "description": { "nl": "Uitgebreide Nederlandse beschrijving (minstens 2-3 zinnen)...", "en": "Detailed English description (at least 2-3 sentences)..." },
      "coordinates": { "lat": 0.0, "lng": 0.0 },
      "pricing": { "adult": 0, "student": 0 },
      "duration": 120,
      "priority": "essential",
      "images": [],
      "thumbnail": "",
      "bookingRequired": false,
      "website": "https://...",
      "wikipediaSlug": "Attraction_Article_Title",
      "tips": { "nl": "Praktische tip in het Nederlands...", "en": "Practical tip in English..." }
    }
  ],
  "restaurants": [
    {
      "id": "city-restaurant-name",
      "name": "Restaurant Name",
      "city": "city-id",
      "neighborhood": "Neighborhood Name",
      "coordinates": { "lat": 0.0, "lng": 0.0 },
      "cuisine": ["Spanish", "Tapas"],
      "priceRange": "€€",
      "specialties": { "nl": "...", "en": "..." },
      "description": { "nl": "...", "en": "..." },
      "website": "https://..."
    }
  ],
  "itinerary": {
    "trip": {
      "title": { "nl": "Rome Stedentrip", "en": "Rome City Trip" },
      "startDate": "2026-06-01",
      "endDate": "2026-06-03"
    },
    "days": [
      {
        "date": "2026-06-01",
        "dayNumber": 1,
        "city": "rome",
        "title": { "nl": "Dag 1: Colosseum & Forum", "en": "Day 1: Colosseum & Forum" },
        "activities": [
          {
            "time": "09:30",
            "attractionId": "rome-colosseum",
            "duration": 150,
            "notes": { "nl": "Reserveer tickets van tevoren", "en": "Book tickets in advance" }
          },
          {
            "time": "13:00",
            "attractionId": "rome-roman-forum",
            "duration": 90,
            "notes": { "nl": "Combiticket met Colosseum", "en": "Combined ticket with Colosseum" },
            "transport": {
              "method": "walk",
              "duration": 5
            }
          }
        ],
        "meals": [
          {
            "type": "breakfast",
            "time": "08:00",
            "neighborhood": "Centro Storico",
            "estimatedCost": 8,
            "notes": { "nl": "Ontbijt bij lokale bar", "en": "Breakfast at local bar" }
          },
          {
            "type": "lunch",
            "time": "12:15",
            "neighborhood": "Monti",
            "estimatedCost": 15,
            "notes": { "nl": "Pasta bij trattoria", "en": "Pasta at trattoria" },
            "coordinates": { "lat": 41.8946, "lng": 12.4964 },
            "restaurantName": "Trattoria da Mario"
          },
          {
            "type": "dinner",
            "time": "19:30",
            "neighborhood": "Trastevere",
            "estimatedCost": 25,
            "notes": { "nl": "Avondeten in Trastevere", "en": "Dinner in Trastevere" }
          }
        ]
      }
    ]
  }
}

IMPORTANT FORMAT RULES — follow the example above exactly:
- All times in 24-hour format WITHOUT AM/PM: "09:30", "14:00", "19:30" (NOT "2:00 PM")
- All text fields with translations MUST be objects: { "nl": "Dutch text", "en": "English text" } (NOT plain strings)
- duration, estimatedCost, dayNumber, transport.duration, transport.cost are NUMBERS (NOT strings like "120")
- coordinates use "lat" and "lng" keys (NOT "latitude"/"longitude")
- attractionId values MUST exactly match the "id" field of an attraction in the attractions array above

RULES:
- Include ALL attractions that were discussed and accepted in the conversation
- Use real data from the conversation (prices, coordinates, etc.)
- Ensure all IDs are lowercase slugified strings
- Each city must have a unique color
- The highlights array should contain the 3 most important attraction IDs
- stats.totalAttractions must match the actual number of attractions

CONTENT QUALITY:
- Descriptions must be rich and evocative (2-3 sentences minimum), not dry one-liners.
- Tips must be practical and useful for travelers.
- Do NOT include image URLs, thumbnail URLs, or YouTube video IDs — media is added automatically by the system.
- The "website" field MUST be a real, working URL to the attraction's official site or the local tourism board page. Use the data from the conversation.
- The "wikipediaSlug" field MUST be the exact Wikipedia article title (e.g., "Alhambra", "Museo_Picasso_Málaga"). If unknown, set to "".

RESTAURANTS:
- Include 3-4 restaurants per city (mix of price ranges: €, €€, €€€)
- Use real restaurant names, real GPS coordinates, real cuisine types
- Search for currently open, well-reviewed restaurants
- Each restaurant needs bilingual descriptions (nl/en)
- priceRange must be one of: "€", "€€", "€€€", "€€€€"

ITINERARY:
- Cover all trip dates (one day entry per date)
- Each activity's attractionId MUST be the exact "id" of an attraction from the attractions array
- Include breakfast, lunch, and dinner meals each day with estimated costs as numbers
- Order activities geographically to minimize travel time
- Include transport between activities; transport.method must be one of: "walk", "bus", "train", "car" (lowercase)
- meal.type must be one of: "breakfast", "lunch", "dinner", "snack" (lowercase)
- Meal coordinates and restaurantName are optional but preferred

- Output ONLY valid JSON, no markdown or explanation`;

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { messages, acceptedAttractions } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // Build the finalize prompt with accepted attractions context
    let finalizePrompt = FINALIZE_PROMPT;
    if (acceptedAttractions && Array.isArray(acceptedAttractions) && acceptedAttractions.length > 0) {
      const attractionSummary = acceptedAttractions.map((a: Record<string, unknown>) =>
        `- id: "${a.id}", name: "${a.name}", city: "${a.city}"`
      ).join('\n');
      finalizePrompt = `ACCEPTED ATTRACTIONS — the user accepted these during the conversation. You MUST include ALL of them in the output attractions array with their exact IDs. You may add more attractions but do NOT remove any accepted ones:\n${attractionSummary}\n\n${FINALIZE_PROMPT}`;
    }

    // Build conversation history + finalize prompt
    const contents = [
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })),
      {
        role: 'user' as const,
        parts: [{ text: finalizePrompt }],
      },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
        maxOutputTokens: 65536,
      },
    });

    const text = response.text;
    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Empty response from AI' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response — strip markdown fences if present
    const cleaned = text.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
    let data;
    try {
      data = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('Failed to parse AI response:', text.slice(0, 500));
      return new Response(
        JSON.stringify({ error: 'AI returned invalid JSON', raw: text.slice(0, 1000) }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Normalize: ensure tripConfig has dataDirectory matching slug
    if (data.tripConfig && !data.tripConfig.dataDirectory) {
      data.tripConfig.dataDirectory = data.tripConfig.slug;
    }

    // Normalize + validate restaurants (keep individually valid ones)
    if (data.restaurants && Array.isArray(data.restaurants)) {
      for (const r of data.restaurants) {
        if (r && typeof r === 'object') normalizeRestaurant(r as Record<string, unknown>);
      }
      // Try batch validation first
      const restaurantsParsed = restaurantsFileSchema.safeParse({ restaurants: data.restaurants });
      if (!restaurantsParsed.success) {
        // Fall back to individual validation — keep valid ones
        console.warn('Batch restaurant validation failed, trying individually...');
        const valid = [];
        for (const r of data.restaurants) {
          const parsed = restaurantSchema.safeParse(r);
          if (parsed.success) {
            valid.push(parsed.data);
          } else {
            console.warn(`Restaurant "${(r as Record<string, unknown>).name}" validation failed:`, parsed.error.format());
          }
        }
        data.restaurants = valid;
      }
    } else {
      data.restaurants = [];
    }

    // Normalize + validate itinerary
    if (data.itinerary) {
      normalizeItinerary(data.itinerary);
      const itineraryParsed = itinerarySchema.safeParse(data.itinerary);
      if (!itineraryParsed.success) {
        const errors = itineraryParsed.error.format();
        console.error('Itinerary validation failed after normalization:', JSON.stringify(errors, null, 2));
        console.error('Itinerary data (first 2000 chars):', JSON.stringify(data.itinerary).slice(0, 2000));
        data.itinerary = null;
        data._itineraryErrors = errors;
      }
    } else {
      data.itinerary = null;
    }

    // Enrich attractions with real images from Wikipedia/Wikimedia Commons
    if (data.attractions && Array.isArray(data.attractions)) {
      const cityNames: Record<string, string> = {};
      if (data.tripConfig?.cities) {
        for (const city of data.tripConfig.cities as Array<{ id: string; name: { en: string } }>) {
          cityNames[city.id] = city.name.en;
        }
      }

      const region = data.tripConfig?.region?.en;
      const enrichInput = data.attractions.map((attr: Record<string, unknown>) => ({
        name: attr.name as string,
        city: cityNames[attr.city as string] || (attr.city as string),
        category: attr.category as string | undefined,
        website: attr.website as string | undefined,
        wikipediaSlug: attr.wikipediaSlug as string | undefined,
      }));

      try {
        const enrichResults = await enrichAttractionsBatch(enrichInput, { region });
        for (let i = 0; i < data.attractions.length; i++) {
          const attr = data.attractions[i] as Record<string, unknown>;
          const { thumbnail, media } = enrichResults[i];
          if (thumbnail) attr.thumbnail = thumbnail;
          if (media.length > 0) attr.media = media;
        }
      } catch (e) {
        console.warn('Batch media enrichment failed:', e);
      }

      // Fetch hero image from the first city
      const firstCityName = data.tripConfig?.cities?.[0]?.name?.en;
      if (firstCityName && !data.tripConfig.heroImage) {
        try {
          const heroImage = await fetchHeroImage(firstCityName, region);
          if (heroImage) data.tripConfig.heroImage = heroImage;
        } catch (e) {
          console.warn('Failed to fetch hero image:', e);
        }
      }
    }

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Finalize API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to finalize trip data' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
