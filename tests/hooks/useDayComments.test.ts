import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDayComments } from '@/hooks/useDayComments';

// Mock global fetch
const mockFetch = vi.fn() as Mock;
global.fetch = mockFetch;

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: () => 'test-uuid-123',
});

describe('useDayComments', () => {
  const TRIP_SLUG = 'test-trip';
  const DAY_NUMBER = 2;

  beforeEach(() => {
    mockFetch.mockReset();
    localStorage.clear();
  });

  it('fetches and filters comments by day number on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        comments: [
          { id: 'c1', author: 'Alice', text: 'Day 1 comment', timestamp: 1000, dayNumber: 1 },
          { id: 'c2', author: 'Bob', text: 'Day 2 comment', timestamp: 2000, dayNumber: 2 },
          { id: 'c3', author: 'Charlie', text: 'Another day 2', timestamp: 3000, dayNumber: 2 },
        ],
      }),
    });

    const { result } = renderHook(() => useDayComments(TRIP_SLUG, DAY_NUMBER));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.comments).toHaveLength(2);
    expect(result.current.comments[0].author).toBe('Bob');
    expect(result.current.comments[1].author).toBe('Charlie');
    expect(mockFetch).toHaveBeenCalledWith(`/api/trips/${TRIP_SLUG}/comments`);
  });

  it('starts in loading state', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ comments: [] }),
    });

    const { result } = renderHook(() => useDayComments(TRIP_SLUG, DAY_NUMBER));
    expect(result.current.isLoading).toBe(true);

    // Let the effect complete to avoid act() warnings
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('handles fetch failure gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useDayComments(TRIP_SLUG, DAY_NUMBER));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.comments).toEqual([]);
  });

  it('handles non-ok response gracefully', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    const { result } = renderHook(() => useDayComments(TRIP_SLUG, DAY_NUMBER));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.comments).toEqual([]);
  });

  describe('addComment', () => {
    it('optimistically adds comment and persists author name', async () => {
      // Initial fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ comments: [] }),
      });

      const { result } = renderHook(() => useDayComments(TRIP_SLUG, DAY_NUMBER));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // POST response
      mockFetch.mockResolvedValueOnce({ ok: true });

      let addResult: boolean | undefined;
      await act(async () => {
        addResult = await result.current.addComment('Jan', 'Great place!');
      });

      expect(addResult).toBe(true);
      expect(result.current.comments).toHaveLength(1);
      expect(result.current.comments[0]).toMatchObject({
        author: 'Jan',
        text: 'Great place!',
        dayNumber: DAY_NUMBER,
      });

      // Verify author name saved to localStorage
      expect(localStorage.getItem('vacation-guide:commenter-name')).toBe('Jan');

      // Verify POST was called
      expect(mockFetch).toHaveBeenCalledTimes(2);
      const postCall = mockFetch.mock.calls[1];
      expect(postCall[0]).toBe(`/api/trips/${TRIP_SLUG}/comments`);
      expect(JSON.parse(postCall[1].body)).toMatchObject({
        author: 'Jan',
        text: 'Great place!',
        dayNumber: DAY_NUMBER,
      });
    });

    it('rolls back on POST failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ comments: [] }),
      });

      const { result } = renderHook(() => useDayComments(TRIP_SLUG, DAY_NUMBER));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      mockFetch.mockResolvedValueOnce({ ok: false });

      let addResult: boolean | undefined;
      await act(async () => {
        addResult = await result.current.addComment('Jan', 'Will be rolled back');
      });

      expect(addResult).toBe(false);
      expect(result.current.comments).toHaveLength(0);
    });

    it('rolls back on network error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ comments: [] }),
      });

      const { result } = renderHook(() => useDayComments(TRIP_SLUG, DAY_NUMBER));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      let addResult: boolean | undefined;
      await act(async () => {
        addResult = await result.current.addComment('Jan', 'Network fail');
      });

      expect(addResult).toBe(false);
      expect(result.current.comments).toHaveLength(0);
    });
  });

  describe('deleteComment', () => {
    it('optimistically removes comment', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          comments: [
            { id: 'c1', author: 'Alice', text: 'Keep me', timestamp: 1000, dayNumber: DAY_NUMBER },
            { id: 'c2', author: 'Bob', text: 'Delete me', timestamp: 2000, dayNumber: DAY_NUMBER },
          ],
        }),
      });

      const { result } = renderHook(() => useDayComments(TRIP_SLUG, DAY_NUMBER));
      await waitFor(() => expect(result.current.comments).toHaveLength(2));

      // DELETE response
      mockFetch.mockResolvedValueOnce({ ok: true });

      let deleteResult: boolean | undefined;
      await act(async () => {
        deleteResult = await result.current.deleteComment('c2');
      });

      expect(deleteResult).toBe(true);
      expect(result.current.comments).toHaveLength(1);
      expect(result.current.comments[0].id).toBe('c1');
    });

    it('rolls back on DELETE failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          comments: [
            { id: 'c1', author: 'Alice', text: 'Keep me', timestamp: 1000, dayNumber: DAY_NUMBER },
          ],
        }),
      });

      const { result } = renderHook(() => useDayComments(TRIP_SLUG, DAY_NUMBER));
      await waitFor(() => expect(result.current.comments).toHaveLength(1));

      mockFetch.mockResolvedValueOnce({ ok: false });

      let deleteResult: boolean | undefined;
      await act(async () => {
        deleteResult = await result.current.deleteComment('c1');
      });

      expect(deleteResult).toBe(false);
      expect(result.current.comments).toHaveLength(1);
    });
  });
});
