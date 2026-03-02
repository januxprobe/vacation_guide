import { describe, it, expect } from 'vitest';
import { normalizeStory } from '@/lib/normalize-story';

describe('normalizeStory', () => {
  // ── Style normalization ────────────────────────────────────────────

  it('lowercases capitalized style', () => {
    const data = makeValidStory({ style: 'Cultural' });
    normalizeStory(data);
    expect(data.style).toBe('cultural');
  });

  it('lowercases all-caps style', () => {
    const data = makeValidStory({ style: 'ADVENTURE' });
    normalizeStory(data);
    expect(data.style).toBe('adventure');
  });

  it('keeps valid lowercase style unchanged', () => {
    const data = makeValidStory({ style: 'romantic' });
    normalizeStory(data);
    expect(data.style).toBe('romantic');
  });

  // ── LocalizedString coercion ───────────────────────────────────────

  it('coerces plain string title to LocalizedString', () => {
    const data = makeValidStory({ title: 'My Trip' });
    normalizeStory(data);
    expect(data.title).toEqual({ nl: 'My Trip', en: 'My Trip' });
  });

  it('coerces plain string introduction to LocalizedString', () => {
    const data = makeValidStory({ introduction: 'Welcome' });
    normalizeStory(data);
    expect(data.introduction).toEqual({ nl: 'Welcome', en: 'Welcome' });
  });

  it('coerces plain string conclusion to LocalizedString', () => {
    const data = makeValidStory({ conclusion: 'The end' });
    normalizeStory(data);
    expect(data.conclusion).toEqual({ nl: 'The end', en: 'The end' });
  });

  it('coerces plain string chapter title to LocalizedString', () => {
    const data = makeValidStory({
      chapters: [makeValidChapter({ title: 'Day 1' })],
    });
    normalizeStory(data);
    expect(data.chapters[0].title).toEqual({ nl: 'Day 1', en: 'Day 1' });
  });

  it('coerces plain string block narrative to LocalizedString', () => {
    const data = makeValidStory({
      chapters: [
        makeValidChapter({
          blocks: [{ type: 'narrative', content: 'Once upon a time' }],
        }),
      ],
    });
    normalizeStory(data);
    expect(data.chapters[0].blocks[0].content).toEqual({
      nl: 'Once upon a time',
      en: 'Once upon a time',
    });
  });

  it('coerces plain string in attraction_highlight narrative', () => {
    const data = makeValidStory({
      chapters: [
        makeValidChapter({
          blocks: [
            {
              type: 'attraction_highlight',
              attractionId: 'test',
              narrative: 'Beautiful palace',
            },
          ],
        }),
      ],
    });
    normalizeStory(data);
    expect(data.chapters[0].blocks[0].narrative).toEqual({
      nl: 'Beautiful palace',
      en: 'Beautiful palace',
    });
  });

  it('coerces plain string in meal_highlight narrative', () => {
    const data = makeValidStory({
      chapters: [
        makeValidChapter({
          blocks: [
            {
              type: 'meal_highlight',
              mealType: 'lunch',
              narrative: 'Tapas time',
            },
          ],
        }),
      ],
    });
    normalizeStory(data);
    expect(data.chapters[0].blocks[0].narrative).toEqual({
      nl: 'Tapas time',
      en: 'Tapas time',
    });
  });

  it('coerces plain string in transition narrative', () => {
    const data = makeValidStory({
      chapters: [
        makeValidChapter({
          blocks: [{ type: 'transition', narrative: 'Walking to next stop' }],
        }),
      ],
    });
    normalizeStory(data);
    expect(data.chapters[0].blocks[0].narrative).toEqual({
      nl: 'Walking to next stop',
      en: 'Walking to next stop',
    });
  });

  it('fills missing locale from other locale in LocalizedString', () => {
    const data = makeValidStory({ title: { en: 'English only' } });
    normalizeStory(data);
    expect(data.title).toEqual({ nl: 'English only', en: 'English only' });
  });

  // ── Number coercion ────────────────────────────────────────────────

  it('coerces string generatedAt to number', () => {
    const data = makeValidStory({ generatedAt: '1700000000000' });
    normalizeStory(data);
    expect(data.generatedAt).toBe(1700000000000);
  });

  it('coerces string dayNumber to number', () => {
    const data = makeValidStory({
      chapters: [makeValidChapter({ dayNumber: '3' })],
    });
    normalizeStory(data);
    expect(data.chapters[0].dayNumber).toBe(3);
  });

  // ── Block type normalization ───────────────────────────────────────

  it('lowercases capitalized block type "Narrative"', () => {
    const data = makeValidStory({
      chapters: [
        makeValidChapter({
          blocks: [{ type: 'Narrative', content: { nl: 'x', en: 'x' } }],
        }),
      ],
    });
    normalizeStory(data);
    expect(data.chapters[0].blocks[0].type).toBe('narrative');
  });

  it('normalizes "Attraction_Highlight" to "attraction_highlight"', () => {
    const data = makeValidStory({
      chapters: [
        makeValidChapter({
          blocks: [
            {
              type: 'Attraction_Highlight',
              attractionId: 'test',
              narrative: { nl: 'x', en: 'x' },
            },
          ],
        }),
      ],
    });
    normalizeStory(data);
    expect(data.chapters[0].blocks[0].type).toBe('attraction_highlight');
  });

  it('normalizes "MEAL_HIGHLIGHT" to "meal_highlight"', () => {
    const data = makeValidStory({
      chapters: [
        makeValidChapter({
          blocks: [
            {
              type: 'MEAL_HIGHLIGHT',
              mealType: 'dinner',
              narrative: { nl: 'x', en: 'x' },
            },
          ],
        }),
      ],
    });
    normalizeStory(data);
    expect(data.chapters[0].blocks[0].type).toBe('meal_highlight');
  });

  it('normalizes "Transition" to "transition"', () => {
    const data = makeValidStory({
      chapters: [
        makeValidChapter({
          blocks: [{ type: 'Transition', narrative: { nl: 'x', en: 'x' } }],
        }),
      ],
    });
    normalizeStory(data);
    expect(data.chapters[0].blocks[0].type).toBe('transition');
  });

  // ── Edge cases ─────────────────────────────────────────────────────

  it('handles null input gracefully', () => {
    expect(() => normalizeStory(null)).not.toThrow();
  });

  it('handles non-object input gracefully', () => {
    expect(() => normalizeStory('string')).not.toThrow();
  });

  it('handles missing chapters array gracefully', () => {
    const data = makeValidStory({});
    delete (data as Record<string, unknown>).chapters;
    expect(() => normalizeStory(data)).not.toThrow();
  });

  it('handles missing blocks array in chapter gracefully', () => {
    const chapter = makeValidChapter({});
    delete (chapter as Record<string, unknown>).blocks;
    const data = makeValidStory({ chapters: [chapter] });
    expect(() => normalizeStory(data)).not.toThrow();
  });
});

// ── Test helpers ──────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
function makeValidStory(overrides: Record<string, unknown> = {}): any {
  return {
    style: 'adventure',
    generatedAt: 1700000000000,
    title: { nl: 'Titel', en: 'Title' },
    introduction: { nl: 'Intro', en: 'Intro' },
    chapters: [],
    conclusion: { nl: 'Einde', en: 'End' },
    ...overrides,
  };
}

function makeValidChapter(overrides: Record<string, unknown> = {}): any {
  return {
    dayNumber: 1,
    city: 'seville',
    title: { nl: 'Dag 1', en: 'Day 1' },
    blocks: [],
    ...overrides,
  };
}
