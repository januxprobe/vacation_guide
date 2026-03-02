import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getTripRepository, getTripDataRepository } from '@/lib/repositories';
import { narrativeStyleSchema, tripStorySchema } from '@/lib/schemas';
import { normalizeStory } from '@/lib/normalize-story';
import type { Attraction, Itinerary, Restaurant } from '@/types';

type RouteContext = { params: Promise<{ slug: string }> };

/** GET: Return saved story for a trip */
export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const { slug } = await params;
    const tripRepo = getTripRepository();
    const trip = await tripRepo.getBySlug(slug);

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const tripDataRepo = getTripDataRepository();
    const story = await tripDataRepo.getStory(slug);

    if (!story) {
      return NextResponse.json({ error: 'No story found' }, { status: 404 });
    }

    return NextResponse.json({ story });
  } catch (error) {
    console.error('Failed to get story:', error);
    return NextResponse.json({ error: 'Failed to get story' }, { status: 500 });
  }
}

/** POST: Generate a new story using Gemini AI */
export async function POST(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { slug } = await params;
    const tripRepo = getTripRepository();
    const trip = await tripRepo.getBySlug(slug);

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const body = await request.json();
    const styleParsed = narrativeStyleSchema.safeParse(body.style);
    if (!styleParsed.success) {
      return NextResponse.json(
        { error: 'Invalid style. Must be one of: adventure, cultural, romantic, family' },
        { status: 400 }
      );
    }
    const style = styleParsed.data;

    const tripDataRepo = getTripDataRepository();
    const itinerary = await tripDataRepo.getItinerary(slug);
    if (!itinerary) {
      return NextResponse.json(
        { error: 'Cannot generate story: itinerary is required' },
        { status: 400 }
      );
    }

    const attractions = await tripDataRepo.getAllAttractions(slug);
    const restaurants = await tripDataRepo.getRestaurants(slug);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured' },
        { status: 500 }
      );
    }

    const prompt = buildStoryPrompt(style, itinerary, attractions, restaurants);

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (!text) {
      return NextResponse.json({ error: 'Empty response from AI' }, { status: 500 });
    }

    const cleaned = text.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
    let storyData;
    try {
      storyData = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse AI story response:', text.slice(0, 500));
      return NextResponse.json(
        { error: 'AI returned invalid JSON' },
        { status: 500 }
      );
    }

    // Set metadata
    storyData.style = style;
    storyData.generatedAt = Date.now();

    // Normalize before validation
    normalizeStory(storyData);

    const parsed = tripStorySchema.safeParse(storyData);
    if (!parsed.success) {
      console.error('Story validation failed:', JSON.stringify(parsed.error.format(), null, 2));
      return NextResponse.json(
        { error: 'Generated story failed validation', details: parsed.error.format() },
        { status: 500 }
      );
    }

    await tripDataRepo.saveStory(slug, parsed.data);

    return NextResponse.json({ story: parsed.data }, { status: 201 });
  } catch (error) {
    console.error('Failed to generate story:', error);
    return NextResponse.json({ error: 'Failed to generate story' }, { status: 500 });
  }
}

function buildStoryPrompt(
  style: string,
  itinerary: Itinerary,
  attractions: Attraction[],
  restaurants: Restaurant[]
): string {
  const attractionSummaries = attractions.map((a) => {
    const desc = a.description.en;
    const tips = a.tips?.en ?? '';
    const price = a.pricing.adult > 0 ? `€${a.pricing.adult}` : 'Free';
    return `- ${a.id}: ${a.name} (${a.city}, ${a.category}, ${a.priority}) — ${price}, ${a.duration}min — ${desc}${tips ? ` TIP: ${tips}` : ''}`;
  }).join('\n');

  const restaurantSummaries = restaurants.map((r) => {
    const desc = r.description?.en ?? '';
    const spec = r.specialties?.en ?? '';
    return `- ${r.id}: ${r.name} (${r.city}, ${r.neighborhood}) — ${r.cuisine.join(', ')}, ${r.priceRange}${desc ? ` — ${desc}` : ''}${spec ? ` SPECIALTY: ${spec}` : ''}`;
  }).join('\n');

  const itinerarySummary = itinerary.days.map((day) => {
    const activities = day.activities.map((a) => {
      const transport = a.transport
        ? ` [${a.transport.method}, ${a.transport.duration}min${a.transport.notes?.en ? `: ${a.transport.notes.en}` : ''}]`
        : '';
      return `  ${a.time}: ${a.attractionId ?? 'Free time'} (${a.duration}min)${transport}${a.notes?.en ? ` — ${a.notes.en}` : ''}`;
    }).join('\n');
    const meals = day.meals.map((m) =>
      `  ${m.time}: ${m.type}${m.restaurantName ? ` at ${m.restaurantName}` : ''}${m.notes?.en ? ` — ${m.notes.en}` : ''}`
    ).join('\n');
    return `Day ${day.dayNumber} — ${day.city} — ${day.title.en}\nActivities:\n${activities}\nMeals:\n${meals}`;
  }).join('\n\n');

  const attractionIds = attractions.map((a) => a.id);
  const restaurantNames = restaurants.map((r) => `"${r.name}"`);

  const styleInstructions: Record<string, string> = {
    adventure: `Write like an excited travel blogger who just discovered paradise. Use vivid sensory language — the sizzle of tapas, the cool shade of ancient courtyards, the thrill of standing where history happened. Make readers feel the adrenaline. Use active voice, short punchy sentences mixed with flowing descriptions. The reader should think: "I NEED to go there."`,
    cultural: `Write like an award-winning travel journalist for National Geographic. Weave in fascinating historical context — the Moors who built these palaces, the cultural collision of Islam and Christianity, the artists who drew inspiration here. Make every building tell a story spanning centuries. The reader should feel they'll walk away enlightened and transformed.`,
    romantic: `Write like a love letter to Andalusia. Paint scenes of golden hour light on ancient walls, candlelit dinners in hidden courtyards, the sound of flamenco guitar drifting through jasmine-scented air. Create moments the reader wants to share with someone special. Every sunset, every intimate terrace, every shared plate of tapas should make hearts flutter.`,
    family: `Write like an enthusiastic parent sharing the best family trip ever. Highlight moments kids will never forget — spotting Game of Thrones filming locations, getting lost in maze-like Moorish palaces, the thrill of trying new foods. Include practical magic: best times to avoid crowds, where to find the best ice cream, which attractions have the most "wow factor" for kids.`,
  };

  return `You are a world-class travel writer for a luxury travel magazine. Your mission: write a story so compelling that readers immediately want to book this trip. They should feel the sun on their skin, taste the tapas, hear the flamenco guitar. This isn't a dry itinerary — it's a dream unfolding.

NARRATIVE STYLE: ${style}
${styleInstructions[style]}

COMPLETE TRIP DATA — You MUST feature EVERY attraction and EVERY restaurant below:

ITINERARY (${itinerary.days.length} days):
${itinerarySummary}

ALL ATTRACTIONS (${attractions.length} total — include ALL of them as attraction_highlight blocks):
${attractionSummaries}

ALL RESTAURANTS (${restaurants.length} total — include ALL of them as meal_highlight blocks):
${restaurantSummaries}

Generate a travel story as a JSON object. ALL text must be bilingual (Dutch AND English).

CRITICAL REQUIREMENTS:
- **EVERY attraction** listed above MUST appear as an "attraction_highlight" block with its exact attractionId. You have ${attractions.length} attractions — I expect ${attractions.length} attraction_highlight blocks total across all chapters.
- **EVERY restaurant** listed above MUST appear as a "meal_highlight" block with its exact name in restaurantName. You have ${restaurants.length} restaurants — I expect ${restaurants.length} meal_highlight blocks total across all chapters.
- **TRANSITIONS ARE MANDATORY**: Between EVERY pair of consecutive attraction/meal blocks, you MUST insert a "transition" block. The transition should describe the journey between locations — walking through specific neighborhoods, taking a bus or train, what the travelers see and hear along the way, how the cityscape changes. Use the transport info from the itinerary (walk, bus, train, car) to make transitions realistic. A chapter with 4 attractions and 2 meals should have at least 5 transition blocks connecting them. The story must flow like a continuous journey, NOT jump from place to place.
- The story must make readers DESPERATE to go on this trip. Build anticipation, paint vivid scenes, evoke all five senses.
- Each narrative block should be 2-4 sentences of evocative, magazine-quality prose.
- Transitions should be 1-2 sentences describing the physical journey: the walk through narrow lanes, the bus ride through olive groves, the train speeding past sunflower fields, the changing light as afternoon turns to evening.

ATTRACTION IDs that MUST appear (one attraction_highlight each):
${attractionIds.join(', ')}

RESTAURANT NAMES that MUST appear (one meal_highlight each):
${restaurantNames.join(', ')}

EXAMPLE OUTPUT (showing one chapter — notice how EVERY pair of highlights has a transition between them):
{
  "title": { "nl": "Een Onvergetelijke Reis door Andalusië", "en": "An Unforgettable Journey through Andalusia" },
  "introduction": { "nl": "Sluit je ogen en stel je voor...", "en": "Close your eyes and imagine..." },
  "chapters": [
    {
      "dayNumber": 1,
      "city": "rome",
      "title": { "nl": "Dag 1: Waar Geschiedenis Tot Leven Komt", "en": "Day 1: Where History Comes Alive" },
      "blocks": [
        {
          "type": "narrative",
          "content": { "nl": "De ochtendzon werpt lange schaduwen over de keitjes...", "en": "The morning sun casts long shadows across the cobblestones..." }
        },
        {
          "type": "attraction_highlight",
          "attractionId": "rome-colosseum",
          "narrative": { "nl": "Het Colosseum rijst op als een slapende reus...", "en": "The Colosseum rises like a sleeping giant..." }
        },
        {
          "type": "transition",
          "narrative": { "nl": "Met je hoofd nog vol van het Colosseum loop je door het zonlicht naar de Via Sacra. De keien zijn glad gesleten door miljoenen voeten voor jou.", "en": "With your head still buzzing from the Colosseum, you walk through the sunlight toward the Via Sacra. The cobblestones are worn smooth by millions of feet before yours." }
        },
        {
          "type": "meal_highlight",
          "mealType": "lunch",
          "restaurantName": "Trattoria da Mario",
          "narrative": { "nl": "Na een ochtend vol verwondering schuif je aan bij een tafeltje op het terras...", "en": "After a morning of wonder, you slide into a terrace table..." }
        },
        {
          "type": "transition",
          "narrative": { "nl": "Met een volle maag en een vol hart wandel je door smalle steegjes vol klimop naar het volgende wonder.", "en": "With a full belly and a full heart, you wander through narrow ivy-draped lanes toward the next wonder." }
        },
        {
          "type": "attraction_highlight",
          "attractionId": "rome-pantheon",
          "narrative": { "nl": "Het Pantheon — tweeduizend jaar oud en nog steeds het grootste ongewapende betonnen koepel ter wereld...", "en": "The Pantheon — two thousand years old and still the world's largest unreinforced concrete dome..." }
        }
      ]
    }
  ],
  "conclusion": { "nl": "Dit was het soort reis dat je voorgoed verandert...", "en": "This was the kind of trip that changes you forever..." }
}

FORMAT RULES — follow exactly:
1. All text fields MUST be objects with "nl" and "en" keys (NOT plain strings)
2. Block types MUST be lowercase: "narrative", "attraction_highlight", "meal_highlight", "transition"
3. attractionId in attraction_highlight blocks MUST exactly match one of these IDs: ${attractionIds.join(', ')}
4. dayNumber MUST be a number (NOT a string)
5. Every meal_highlight MUST have a restaurantName matching one of the restaurants listed above

Do NOT include "style" or "generatedAt" fields — those are added automatically.
Output ONLY valid JSON, no markdown or explanation.`;
}
