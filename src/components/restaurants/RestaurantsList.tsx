'use client';

import { useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Search, Heart } from 'lucide-react';
import type { Restaurant } from '@/types';
import RestaurantCard from './RestaurantCard';
import RestaurantFilter from './RestaurantFilter';
import RestaurantSearch from './RestaurantSearch';
import { toast } from 'sonner';
import { useFavorites } from '@/hooks/useFavorites';

interface RestaurantsListProps {
  restaurants: Restaurant[];
  tripSlug?: string;
  isDynamic?: boolean;
}

export default function RestaurantsList({ restaurants: initialRestaurants, tripSlug, isDynamic }: RestaurantsListProps) {
  const t = useTranslations();
  const locale = useLocale() as 'nl' | 'en';
  const [restaurants, setRestaurants] = useState(initialRestaurants);
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedPrice, setSelectedPrice] = useState('all');
  const [selectedCuisine, setSelectedCuisine] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const { isFavorite, toggleFavorite, favoriteRestaurantIds } = useFavorites(tripSlug ?? '');

  const availableCuisines = useMemo(() => {
    const cuisines = new Set<string>();
    restaurants.forEach((r) => r.cuisine.forEach((c) => cuisines.add(c)));
    return Array.from(cuisines).sort();
  }, [restaurants]);

  const filtered = restaurants.filter((r) => {
    if (selectedCity !== 'all' && r.city !== selectedCity) return false;
    if (selectedPrice !== 'all' && r.priceRange !== selectedPrice) return false;
    if (selectedCuisine !== 'all' && !r.cuisine.includes(selectedCuisine)) return false;
    if (favoritesOnly && !isFavorite('restaurants', r.id)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = r.name.toLowerCase().includes(q);
      const neighborhoodMatch = r.neighborhood.toLowerCase().includes(q);
      const cuisineMatch = r.cuisine.join(' ').toLowerCase().includes(q);
      const descMatch = r.description?.[locale]?.toLowerCase().includes(q);
      if (!nameMatch && !neighborhoodMatch && !cuisineMatch && !descMatch) return false;
    }
    return true;
  });

  const handleRemove = async (id: string) => {
    if (!tripSlug) return;

    try {
      const res = await fetch(`/api/trips/${tripSlug}/restaurants`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        toast.error(t('restaurants.removeError'));
        return;
      }

      setRestaurants((prev) => prev.filter((r) => r.id !== id));
      toast.success(t('restaurants.removed'));
    } catch (error) {
      console.error('Remove restaurant error:', error);
      toast.error(t('restaurants.removeError'));
    }
  };

  const handleRestaurantAdded = (restaurant: Restaurant) => {
    setRestaurants((prev) => {
      if (prev.some((r) => r.id === restaurant.id)) return prev;
      return [...prev, restaurant];
    });
    toast.success(t('restaurants.added'));
  };

  const hasActiveFilters = selectedCity !== 'all' || selectedPrice !== 'all' || selectedCuisine !== 'all' || searchQuery.trim() !== '' || favoritesOnly;

  const resetFilters = () => {
    setSelectedCity('all');
    setSelectedPrice('all');
    setSelectedCuisine('all');
    setSearchQuery('');
    setFavoritesOnly(false);
  };

  return (
    <div>
      {isDynamic && tripSlug && (
        <RestaurantSearch
          tripSlug={tripSlug}
          onRestaurantAdded={handleRestaurantAdded}
        />
      )}

      {/* Search input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('restaurants.filterSearchPlaceholder')}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <RestaurantFilter
        selectedCity={selectedCity}
        selectedPrice={selectedPrice}
        onCityChange={setSelectedCity}
        onPriceChange={setSelectedPrice}
        availableCuisines={availableCuisines}
        selectedCuisine={selectedCuisine}
        onCuisineChange={setSelectedCuisine}
      />

      {/* Favorites filter */}
      <div className="mt-3">
        <button
          onClick={() => setFavoritesOnly(!favoritesOnly)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            favoritesOnly
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-white' : ''}`} />
          {t('common.favoritesOnly')}
          {favoriteRestaurantIds.length > 0 && (
            <span className={`text-xs ${favoritesOnly ? 'text-white/80' : 'text-gray-400'}`}>
              ({favoriteRestaurantIds.length})
            </span>
          )}
        </button>
      </div>

      <div className="mt-6 text-sm text-gray-500">
        {filtered.length} / {restaurants.length}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-12 text-center">
          <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">{t('restaurants.noResults')}</p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              {t('restaurants.resetFilters')}
            </button>
          )}
        </div>
      ) : (
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              canRemove={isDynamic}
              onRemove={handleRemove}
              isFavorite={isFavorite('restaurants', restaurant.id)}
              onToggleFavorite={() => toggleFavorite('restaurants', restaurant.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
