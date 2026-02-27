import { GoogleGenAI } from '@google/genai';

const FINALIZE_PROMPT = `Based on the conversation so far, generate the COMPLETE trip configuration and ALL attraction data as a single JSON object.

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
      "description": { "nl": "...", "en": "..." },
      "coordinates": { "lat": 0.0, "lng": 0.0 },
      "pricing": { "adult": 0, "student": 0 },
      "duration": 120,
      "priority": "essential",
      "images": [],
      "thumbnail": "",
      "bookingRequired": false,
      "website": "https://...",
      "tips": { "nl": "...", "en": "..." }
    }
  ]
}

RULES:
- Include ALL attractions that were discussed and accepted in the conversation
- Use real data from the conversation (prices, coordinates, etc.)
- Ensure all IDs are lowercase slugified strings
- Each city must have a unique color
- The highlights array should contain the 3 most important attraction IDs
- stats.totalAttractions must match the actual number of attractions
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

    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // Build conversation history + finalize prompt
    const contents = [
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })),
      {
        role: 'user' as const,
        parts: [{ text: FINALIZE_PROMPT }],
      },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
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
