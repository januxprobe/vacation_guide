import { describe, it, expect } from 'vitest';
import { dayCommentSchema, commentsFileSchema, tripStorySchema, storyFileSchema } from '@/lib/schemas';

describe('dayCommentSchema', () => {
  const validComment = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    author: 'Jan',
    text: 'Great spot for lunch!',
    timestamp: 1700000000000,
    dayNumber: 3,
  };

  it('accepts a valid comment', () => {
    const result = dayCommentSchema.safeParse(validComment);
    expect(result.success).toBe(true);
  });

  it('rejects empty author', () => {
    const result = dayCommentSchema.safeParse({ ...validComment, author: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty text', () => {
    const result = dayCommentSchema.safeParse({ ...validComment, text: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing id', () => {
    const { id: _, ...noId } = validComment;
    const result = dayCommentSchema.safeParse(noId);
    expect(result.success).toBe(false);
  });

  it('rejects missing dayNumber', () => {
    const { dayNumber: _, ...noDay } = validComment;
    const result = dayCommentSchema.safeParse(noDay);
    expect(result.success).toBe(false);
  });

  it('rejects non-number timestamp', () => {
    const result = dayCommentSchema.safeParse({ ...validComment, timestamp: 'not-a-number' });
    expect(result.success).toBe(false);
  });
});

describe('commentsFileSchema', () => {
  it('accepts valid comments file', () => {
    const result = commentsFileSchema.safeParse({
      comments: [
        {
          id: 'c1',
          author: 'Alice',
          text: 'Hello',
          timestamp: 1700000000000,
          dayNumber: 1,
        },
        {
          id: 'c2',
          author: 'Bob',
          text: 'World',
          timestamp: 1700000001000,
          dayNumber: 2,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty comments array', () => {
    const result = commentsFileSchema.safeParse({ comments: [] });
    expect(result.success).toBe(true);
  });

  it('rejects missing comments key', () => {
    const result = commentsFileSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects invalid comment in array', () => {
    const result = commentsFileSchema.safeParse({
      comments: [{ id: 'c1', author: '', text: 'Hello', timestamp: 123, dayNumber: 1 }],
    });
    expect(result.success).toBe(false);
  });
});

// ── Trip Story Schemas ──────────────────────────────────────────────

describe('tripStorySchema', () => {
  const validStory = {
    style: 'adventure',
    generatedAt: 1700000000000,
    title: { nl: 'Een avontuur in Andalusië', en: 'An adventure in Andalusia' },
    introduction: { nl: 'Welkom', en: 'Welcome' },
    chapters: [
      {
        dayNumber: 1,
        city: 'seville',
        title: { nl: 'Dag 1: Sevilla', en: 'Day 1: Seville' },
        blocks: [
          { type: 'narrative', content: { nl: 'Het begon...', en: 'It started...' } },
          {
            type: 'attraction_highlight',
            attractionId: 'real-alcazar',
            narrative: { nl: 'Het paleis...', en: 'The palace...' },
          },
          {
            type: 'meal_highlight',
            mealType: 'lunch',
            restaurantName: 'Bar Europa',
            narrative: { nl: 'Lunch bij...', en: 'Lunch at...' },
          },
          { type: 'transition', narrative: { nl: 'Daarna...', en: 'Then...' } },
        ],
      },
    ],
    conclusion: { nl: 'Tot ziens', en: 'Goodbye' },
  };

  it('accepts a valid complete story', () => {
    const result = tripStorySchema.safeParse(validStory);
    expect(result.success).toBe(true);
  });

  it('accepts all four narrative styles', () => {
    for (const style of ['adventure', 'cultural', 'romantic', 'family']) {
      const result = tripStorySchema.safeParse({ ...validStory, style });
      expect(result.success).toBe(true);
    }
  });

  it('accepts a story with empty chapters', () => {
    const result = tripStorySchema.safeParse({ ...validStory, chapters: [] });
    expect(result.success).toBe(true);
  });

  it('accepts a chapter with empty blocks', () => {
    const result = tripStorySchema.safeParse({
      ...validStory,
      chapters: [{ ...validStory.chapters[0], blocks: [] }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts meal_highlight without restaurantName', () => {
    const result = tripStorySchema.safeParse({
      ...validStory,
      chapters: [
        {
          ...validStory.chapters[0],
          blocks: [
            {
              type: 'meal_highlight',
              mealType: 'dinner',
              narrative: { nl: 'Eten', en: 'Food' },
            },
          ],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid narrative style', () => {
    const result = tripStorySchema.safeParse({ ...validStory, style: 'thriller' });
    expect(result.success).toBe(false);
  });

  it('rejects missing title', () => {
    const { title: _, ...noTitle } = validStory;
    const result = tripStorySchema.safeParse(noTitle);
    expect(result.success).toBe(false);
  });

  it('rejects missing chapters', () => {
    const { chapters: _, ...noChapters } = validStory;
    const result = tripStorySchema.safeParse(noChapters);
    expect(result.success).toBe(false);
  });

  it('rejects unknown block type', () => {
    const result = tripStorySchema.safeParse({
      ...validStory,
      chapters: [
        {
          ...validStory.chapters[0],
          blocks: [{ type: 'unknown', content: { nl: 'x', en: 'x' } }],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects attraction_highlight without attractionId', () => {
    const result = tripStorySchema.safeParse({
      ...validStory,
      chapters: [
        {
          ...validStory.chapters[0],
          blocks: [
            {
              type: 'attraction_highlight',
              narrative: { nl: 'x', en: 'x' },
            },
          ],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects plain string instead of LocalizedString for title', () => {
    const result = tripStorySchema.safeParse({ ...validStory, title: 'Just a string' });
    expect(result.success).toBe(false);
  });

  it('rejects plain string instead of LocalizedString for block narrative', () => {
    const result = tripStorySchema.safeParse({
      ...validStory,
      chapters: [
        {
          ...validStory.chapters[0],
          blocks: [{ type: 'narrative', content: 'plain string' }],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-number generatedAt', () => {
    const result = tripStorySchema.safeParse({ ...validStory, generatedAt: 'not-a-number' });
    expect(result.success).toBe(false);
  });

  it('rejects non-number dayNumber in chapter', () => {
    const result = tripStorySchema.safeParse({
      ...validStory,
      chapters: [{ ...validStory.chapters[0], dayNumber: 'one' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing conclusion', () => {
    const { conclusion: _, ...noConclusion } = validStory;
    const result = tripStorySchema.safeParse(noConclusion);
    expect(result.success).toBe(false);
  });
});

describe('storyFileSchema', () => {
  const validStory = {
    style: 'cultural',
    generatedAt: 1700000000000,
    title: { nl: 'Titel', en: 'Title' },
    introduction: { nl: 'Intro', en: 'Intro' },
    chapters: [],
    conclusion: { nl: 'Einde', en: 'End' },
  };

  it('accepts valid story file wrapper', () => {
    const result = storyFileSchema.safeParse({ story: validStory });
    expect(result.success).toBe(true);
  });

  it('rejects missing story key', () => {
    const result = storyFileSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects invalid story inside wrapper', () => {
    const result = storyFileSchema.safeParse({ story: { style: 'invalid' } });
    expect(result.success).toBe(false);
  });
});
