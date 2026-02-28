'use client';

import { useState, useCallback, useEffect } from 'react';

interface FavoritesData {
  attractions: string[];
  restaurants: string[];
}

function getStorageKey(tripSlug: string) {
  return `vacation-guide:favorites:${tripSlug}`;
}

function loadFavorites(tripSlug: string): FavoritesData {
  if (typeof window === 'undefined') return { attractions: [], restaurants: [] };
  try {
    const raw = localStorage.getItem(getStorageKey(tripSlug));
    if (!raw) return { attractions: [], restaurants: [] };
    return JSON.parse(raw);
  } catch {
    return { attractions: [], restaurants: [] };
  }
}

function saveFavorites(tripSlug: string, data: FavoritesData) {
  localStorage.setItem(getStorageKey(tripSlug), JSON.stringify(data));
}

export function useFavorites(tripSlug: string) {
  const [favorites, setFavorites] = useState<FavoritesData>({ attractions: [], restaurants: [] });

  useEffect(() => {
    setFavorites(loadFavorites(tripSlug));
  }, [tripSlug]);

  const toggleFavorite = useCallback((type: 'attractions' | 'restaurants', id: string) => {
    setFavorites((prev) => {
      const list = prev[type];
      const next = list.includes(id)
        ? list.filter((x) => x !== id)
        : [...list, id];
      const updated = { ...prev, [type]: next };
      saveFavorites(tripSlug, updated);
      return updated;
    });
  }, [tripSlug]);

  const isFavorite = useCallback((type: 'attractions' | 'restaurants', id: string) => {
    return favorites[type].includes(id);
  }, [favorites]);

  return {
    favoriteAttractionIds: favorites.attractions,
    favoriteRestaurantIds: favorites.restaurants,
    isFavorite,
    toggleFavorite,
  };
}
