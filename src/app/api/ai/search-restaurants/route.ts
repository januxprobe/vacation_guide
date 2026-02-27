import { GoogleGenAI } from '@google/genai';
import { restaurantSchema } from '@/lib/schemas';

const SEARCH_PROMPT = `You are a restaurant search engine. Based on the user's query, find 3-5 real restaurants that match.

Use Google Search to find real, currently-operating restaurants with accurate information.

Return a JSON object with this exact structure:
{
  "restaurants": [
    {
      "id": "city-restaurant-name-slugified",
      "name": "Restaurant Name",
      "city": "CITY_ID",
      "neighborhood": "Neighborhood Name",
      "coordinates": { "lat": 0.0, "lng": 0.0 },
      "cuisine": ["Italian", "Mediterranean"],
      "priceRange": "€€",
      "specialties": { "nl": "Specialiteiten beschrijving", "en": "Specialties description" },
      "description": { "nl": "Nederlandse beschrijving", "en": "English description" },
      "website": "https://..."
    }
  ]
}

RULES:
- Use real restaurant names, addresses, coordinates, and websites
- priceRange must be one of: "€", "€€", "€€€", "€€€€"
- IDs must be lowercase slugified strings (e.g., "rome-trattoria-da-enzo")
- The city field must exactly match: CITY_ID
- Include cuisine type tags (e.g., "Italian", "Tapas", "Seafood")
- Provide bilingual descriptions in Dutch (nl) and English (en)
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

    const { query, city, tripSlug } = await request.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'query is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const searchQuery = city
      ? `Find restaurants in ${city} matching: ${query}`
      : `Find restaurants matching: ${query}`;

    // Replace CITY_ID placeholder in prompt
    const prompt = SEARCH_PROMPT.replace(/CITY_ID/g, city || tripSlug || 'unknown');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: searchQuery }],
        },
      ],
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: prompt,
      },
    });

    const text = response.text;
    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Empty response from AI', restaurants: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const cleaned = text.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
    let data;
    try {
      data = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse restaurant search response:', text.slice(0, 500));
      return new Response(
        JSON.stringify({ error: 'Invalid AI response', restaurants: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate each restaurant individually, keep valid ones
    const validRestaurants = [];
    if (data.restaurants && Array.isArray(data.restaurants)) {
      for (const r of data.restaurants) {
        const parsed = restaurantSchema.safeParse(r);
        if (parsed.success) {
          validRestaurants.push(parsed.data);
        } else {
          console.warn(`Skipping invalid restaurant ${r.name}:`, parsed.error.format());
        }
      }
    }

    return new Response(
      JSON.stringify({ restaurants: validRestaurants }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Restaurant search error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to search restaurants', restaurants: [] }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
