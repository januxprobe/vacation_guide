import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFavorites } from '@/hooks/useFavorites';

describe('useFavorites', () => {
  const TRIP_SLUG = 'test-trip';
  const STORAGE_KEY = `vacation-guide:favorites:${TRIP_SLUG}`;

  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with empty favorites when no data in localStorage', async () => {
    const { result } = renderHook(() => useFavorites(TRIP_SLUG));

    // After useEffect runs
    await vi.waitFor(() => {
      expect(result.current.favoriteAttractionIds).toEqual([]);
      expect(result.current.favoriteRestaurantIds).toEqual([]);
    });
  });

  it('loads existing favorites from localStorage', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ attractions: ['a1', 'a2'], restaurants: ['r1'] })
    );

    const { result } = renderHook(() => useFavorites(TRIP_SLUG));

    await vi.waitFor(() => {
      expect(result.current.favoriteAttractionIds).toEqual(['a1', 'a2']);
      expect(result.current.favoriteRestaurantIds).toEqual(['r1']);
    });
  });

  it('toggles attraction favorite on', async () => {
    const { result } = renderHook(() => useFavorites(TRIP_SLUG));

    act(() => {
      result.current.toggleFavorite('attractions', 'a1');
    });

    expect(result.current.favoriteAttractionIds).toContain('a1');
    // Verify persisted to localStorage
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.attractions).toContain('a1');
  });

  it('toggles attraction favorite off', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ attractions: ['a1'], restaurants: [] })
    );

    const { result } = renderHook(() => useFavorites(TRIP_SLUG));

    await vi.waitFor(() => {
      expect(result.current.favoriteAttractionIds).toContain('a1');
    });

    act(() => {
      result.current.toggleFavorite('attractions', 'a1');
    });

    expect(result.current.favoriteAttractionIds).not.toContain('a1');
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.attractions).not.toContain('a1');
  });

  it('toggles restaurant favorite independently', async () => {
    const { result } = renderHook(() => useFavorites(TRIP_SLUG));

    act(() => {
      result.current.toggleFavorite('restaurants', 'r1');
    });

    expect(result.current.favoriteRestaurantIds).toContain('r1');
    expect(result.current.favoriteAttractionIds).toEqual([]);
  });

  it('isFavorite returns correct boolean', async () => {
    const { result } = renderHook(() => useFavorites(TRIP_SLUG));

    expect(result.current.isFavorite('attractions', 'a1')).toBe(false);

    act(() => {
      result.current.toggleFavorite('attractions', 'a1');
    });

    expect(result.current.isFavorite('attractions', 'a1')).toBe(true);
    expect(result.current.isFavorite('attractions', 'a2')).toBe(false);
  });

  it('handles corrupt localStorage gracefully', async () => {
    localStorage.setItem(STORAGE_KEY, 'invalid json{{{');

    const { result } = renderHook(() => useFavorites(TRIP_SLUG));

    await vi.waitFor(() => {
      expect(result.current.favoriteAttractionIds).toEqual([]);
      expect(result.current.favoriteRestaurantIds).toEqual([]);
    });
  });

  it('uses different storage keys for different trips', async () => {
    const { result: result1 } = renderHook(() => useFavorites('trip-a'));
    const { result: result2 } = renderHook(() => useFavorites('trip-b'));

    act(() => {
      result1.current.toggleFavorite('attractions', 'a1');
    });

    expect(result1.current.favoriteAttractionIds).toContain('a1');
    expect(result2.current.favoriteAttractionIds).not.toContain('a1');
  });
});
