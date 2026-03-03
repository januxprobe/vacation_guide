import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
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

    const localizedString = {
      type: Type.OBJECT,
      properties: {
        nl: { type: Type.STRING },
        en: { type: Type.STRING },
      },
      required: ['nl', 'en'],
    };

    const storyResponseSchema = {
      type: Type.OBJECT,
      properties: {
        title: localizedString,
        introduction: localizedString,
        chapters: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              dayNumber: { type: Type.NUMBER },
              city: { type: Type.STRING },
              title: localizedString,
              blocks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, enum: ['narrative', 'attraction_highlight', 'meal_highlight', 'transition'] },
                    narrative: localizedString,
                    attractionId: { type: Type.STRING },
                    mealType: { type: Type.STRING },
                    restaurantName: { type: Type.STRING },
                  },
                  required: ['type', 'narrative'],
                },
              },
            },
            required: ['dayNumber', 'city', 'title', 'blocks'],
          },
        },
        conclusion: localizedString,
      },
      required: ['title', 'introduction', 'chapters', 'conclusion'],
    };

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_STORY_MODEL!,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: storyResponseSchema,
        maxOutputTokens: 65536,
        thinkingConfig: { thinkingBudget: 0 },
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

  return `You are a world-class travel writer for a luxury travel magazine. Write a SINGLE CONTINUOUS STORY that reads like the reader is actually wandering through the city. The reader walks alongside you from the moment they step off the train until the last evening. This is NOT an itinerary with descriptions — it is an immersive first-person journey.

NARRATIVE STYLE: ${style}
${styleInstructions[style]}

THE GOLDEN RULE — SEAMLESS INTEGRATION:
The story must read as ONE flowing piece of prose. There are NO "information boxes" or "attraction descriptions" — instead, each attraction and restaurant is a SCENE in the story. You arrive somewhere, you experience it, you notice specific details, you learn something surprising, you get a practical tip from a local, and then the city pulls you onward to the next place.

Think of it like this: a great travel magazine article doesn't say "The Colosseum is a famous amphitheater built in 70 AD." Instead it says: "You round the corner and suddenly there it is — impossibly large, impossibly old, its honey-colored arches catching the morning light. Inside, standing on the arena floor where gladiators once fought, you feel the weight of two thousand years pressing down. A guide whispers that the best view is from the third tier, where most tourists never go. Don't skip it — that panorama alone is worth the €16 ticket."

HOW TO WRITE EACH BLOCK TYPE:
- "narrative": Sets the scene for the day, builds atmosphere, describes the city waking up or the mood shifting.
- "attraction_highlight": This is the RICHEST part of the story (3-5 sentences). You ARRIVE at the place. Describe what you see, feel, hear. Weave in history and context naturally ("built by Emperor X because..."). Include a practical insider tip as if a local friend is whispering it to you ("arrive before 9am to have the courtyard to yourself", "the €2 student discount is worth asking about", "don't miss the hidden garden behind the main hall"). The reader should feel they are THERE.
- "meal_highlight": A scene at the restaurant (2-3 sentences). The ambiance, what you order, how it tastes, the waiter's recommendation. Make the reader hungry.
- "transition": The physical journey between places (1-2 sentences). What you see, hear, smell while walking/riding. The changing neighborhoods, the street musicians, the narrowing alleys. Use real transport info from the itinerary.

COMPLETE TRIP DATA:

ITINERARY (${itinerary.days.length} days):
${itinerarySummary}

ALL ATTRACTIONS (${attractions.length} — each MUST appear as an attraction_highlight):
${attractionSummaries}

ALL RESTAURANTS (${restaurants.length} — each MUST appear as a meal_highlight):
${restaurantSummaries}

Generate a travel story as a JSON object. ALL text must be bilingual (Dutch AND English).

REQUIREMENTS:
- EVERY attraction above → one "attraction_highlight" block with its exact attractionId (${attractions.length} total)
- EVERY restaurant above → one "meal_highlight" block with its exact restaurantName (${restaurants.length} total)
- Between EVERY consecutive pair of highlight blocks → a "transition" block
- Each chapter starts with a "narrative" block setting the scene for that day
- attraction_highlight narratives: 3-5 vivid sentences — arrive, experience, insider tip, emotional reaction
- meal_highlight narratives: 2-3 sentences — ambiance, food, sensory details
- transition narratives: 1-2 sentences — the physical journey, what you see along the way
- The story must flow so naturally that removing the block type labels would leave a perfect magazine article

ATTRACTION IDs: ${attractionIds.join(', ')}
RESTAURANT NAMES: ${restaurantNames.join(', ')}

EXAMPLE (one chapter excerpt — notice how the attraction_highlight reads as part of the continuous journey, not a standalone description):
{
  "title": { "nl": "Een Onvergetelijke Reis door Rome", "en": "An Unforgettable Journey through Rome" },
  "introduction": { "nl": "Er zijn steden die je bezoekt, en steden die je binnenstappen als een levende droom. Rome is het tweede.", "en": "There are cities you visit, and cities you step into like a living dream. Rome is the latter." },
  "chapters": [
    {
      "dayNumber": 1,
      "city": "rome",
      "title": { "nl": "Dag 1: Waar Elke Steen een Verhaal Vertelt", "en": "Day 1: Where Every Stone Tells a Story" },
      "blocks": [
        {
          "type": "narrative",
          "narrative": { "nl": "De ochtendzon giet honing over de daken van Monti terwijl je eerste Italiaanse espresso precies goed is — kort, bitter, en gedronken aan de bar zoals de locals het doen. De stad is al wakker, scooters zoemen, marktkooplui roepen, en ergens in de verte klinkt een kerkklok.", "en": "The morning sun pours honey over the rooftops of Monti as your first Italian espresso hits just right — short, bitter, and drunk standing at the bar the way locals do. The city is already alive, scooters buzzing, market vendors calling, and somewhere in the distance a church bell rings." }
        },
        {
          "type": "attraction_highlight",
          "attractionId": "rome-colosseum",
          "narrative": { "nl": "Je draait de hoek om en daar staat het — het Colosseum, onmogelijk groot, onmogelijk oud, de honingkleurige bogen badend in het ochtendlicht. Binnen, op de arenabloer waar gladiatoren ooit vochten, voel je het gewicht van twee millennia. Een tip van een lokale gids: ga naar de derde ring, waar de meeste toeristen nooit komen. Dat panorama — de arena aan je voeten, de Palatijn erachter — is alleen al de €16 entree waard. Reserveer je tickets online, want de rij bij de kassa is meedogenloos.", "en": "You round the corner and there it stands — the Colosseum, impossibly large, impossibly old, its honey-colored arches bathing in the morning light. Inside, standing on the arena floor where gladiators once fought, you feel the weight of two millennia pressing down. A tip from a local guide: head to the third tier, where most tourists never venture. That panorama — the arena at your feet, the Palatine Hill behind it — is worth the €16 entry alone. Book your tickets online, because the queue at the box office is merciless." }
        },
        {
          "type": "transition",
          "narrative": { "nl": "Met je hoofd nog vol echo's van het verleden loop je vijf minuten door de Via Sacra, waar de keien glad gesleten zijn door miljoenen voeten voor jou. De geur van versgebakken pizza drijft uit een steegje.", "en": "With your head still echoing with the past, you walk five minutes down the Via Sacra, where the cobblestones are worn smooth by millions of feet before yours. The scent of fresh-baked pizza drifts from an alleyway." }
        },
        {
          "type": "meal_highlight",
          "mealType": "lunch",
          "restaurantName": "Trattoria da Mario",
          "narrative": { "nl": "Bij Trattoria da Mario, een onopvallend restaurantje met geruit tafelkleed en een handgeschreven menu op een krijtbord, bestel je de cacio e pepe. De pasta komt dampend aan tafel, de pecorino perfect gesmolten, de zwarte peper net scherp genoeg. De eigenaar knikt goedkeurend als je bord leeg is.", "en": "At Trattoria da Mario, an unassuming spot with checkered tablecloths and a handwritten chalk menu, you order the cacio e pepe. The pasta arrives steaming, the pecorino perfectly melted, the black pepper just sharp enough. The owner nods approvingly when your plate is clean." }
        }
      ]
    }
  ],
  "conclusion": { "nl": "Je koffer is zwaarder dan bij aankomst — gevuld met wijn, olijfolie, en herinneringen die zwaarder wegen dan alles.", "en": "Your suitcase is heavier than when you arrived — filled with wine, olive oil, and memories that weigh more than anything." }
}

FORMAT RULES:
1. All text fields MUST be objects with "nl" and "en" keys (NOT plain strings)
2. Block types: "narrative", "attraction_highlight", "meal_highlight", "transition"
3. attractionId MUST exactly match one of: ${attractionIds.join(', ')}
4. dayNumber MUST be a number
5. Every meal_highlight MUST have restaurantName matching a restaurant listed above

Do NOT include "style" or "generatedAt" fields.
Output ONLY valid JSON.`;
}
