import { GoogleGenAI } from '@google/genai';

const SYSTEM_PROMPT = `You are an expert travel planner helping users create detailed trip itineraries.
You are friendly, knowledgeable, and proactive in suggesting great experiences.

BEHAVIOR:
- Start by asking where, when, and with whom they want to travel
- Ask follow-up questions about interests, budget, and pace preferences
- Use Google Search to find real, current data about attractions
- Suggest attractions with real prices, opening hours, and GPS coordinates
- Include image URLs from Wikimedia Commons or official tourism sites when possible
- Provide descriptions in both Dutch (nl) and English (en)
- Categorize attractions as: monument, church, palace, museum, neighborhood, or nature
- Assign priority: essential, recommended, or optional
- Keep responses conversational but include structured data blocks when suggesting attractions

STRUCTURED OUTPUT:
When you have enough information to suggest an attraction, include a JSON code block in your response like this:

\`\`\`json
{
  "type": "attraction_suggestion",
  "data": {
    "id": "city-name-slugified",
    "name": "Attraction Name",
    "city": "city-id",
    "category": "monument",
    "description": { "nl": "Nederlandse beschrijving...", "en": "English description..." },
    "coordinates": { "lat": 41.8902, "lng": 12.4922 },
    "pricing": { "adult": 16, "student": 2 },
    "duration": 120,
    "priority": "essential",
    "images": [],
    "thumbnail": "",
    "bookingRequired": true,
    "website": "https://...",
    "tips": { "nl": "Tip in het Nederlands...", "en": "Tip in English..." }
  }
}
\`\`\`

When the user is satisfied and ready to create the trip, generate a trip_config block:

\`\`\`json
{
  "type": "trip_config",
  "data": {
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
        "color": "#hex",
        "coordinates": { "lat": 0, "lng": 0 }
      }
    ],
    "categories": ["monument", "church", "palace", "museum", "neighborhood", "nature"],
    "travelerGroups": [
      {
        "id": "adults",
        "label": { "nl": "Volwassenen", "en": "Adults" },
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
    "theme": { "primaryColor": "#hex" },
    "highlights": ["attraction-id-1", "attraction-id-2"],
    "dataDirectory": "destination-year"
  }
}
\`\`\`

IMPORTANT RULES:
- Always search for real, up-to-date information. Don't make up prices or coordinates.
- Use sensible city colors (different hex colors per city that look good as UI accents)
- Generate slugified IDs (lowercase, hyphens, e.g. "rome-colosseum")
- Respond in the same language the user writes in
- Be concise but thorough in suggestions`;

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

    // Convert our messages format to Gemini format
    const contents = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const response = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: SYSTEM_PROMPT,
      },
    });

    // Stream the response back using SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const text = chunk.text;
            if (text) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
