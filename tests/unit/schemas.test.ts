import { describe, it, expect } from 'vitest';
import { dayCommentSchema, commentsFileSchema } from '@/lib/schemas';

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
