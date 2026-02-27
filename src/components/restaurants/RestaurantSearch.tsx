'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useTripConfig } from '@/config/trip-context';
import type { Restaurant } from '@/types';
import { getCityBadgeStyle } from '@/lib/city-colors';
import { Search, Plus, Check, Loader2 } from 'lucide-react';

interface RestaurantSearchProps {
  tripSlug: string;
  onRestaurantAdded: (restaurant: Restaurant) => void;
}

export default function RestaurantSearch({ tripSlug, onRestaurantAdded }: RestaurantSearchProps) {
  const t = useTranslations('restaurants');
  const locale = useLocale() as 'nl' | 'en';
  const config = useTripConfig();

  const [query, setQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Restaurant[]>([]);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [addingId, setAddingId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setHasSearched(true);
    setResults([]);

    try {
      const res = await fetch('/api/ai/search-restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          city: selectedCity || undefined,
          tripSlug,
        }),
      });

      const data = await res.json();
      setResults(data.restaurants || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async (restaurant: Restaurant) => {
    setAddingId(restaurant.id);
    try {
      const res = await fetch(`/api/trips/${tripSlug}/restaurants`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restaurant),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add');
      }

      setAddedIds((prev) => new Set(prev).add(restaurant.id));
      onRestaurantAdded(restaurant);
    } catch (error) {
      console.error('Add restaurant error:', error);
    } finally {
      setAddingId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        {t('searchTitle')}
      </h3>

      {/* City filter pills */}
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={() => setSelectedCity('')}
          className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors ${
            selectedCity === ''
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
          }`}
        >
          {t('allRestaurants')}
        </button>
        {config.cities.map((city) => (
          <button
            key={city.id}
            onClick={() => setSelectedCity(city.id)}
            className="text-xs font-medium px-3 py-1 rounded-full border transition-colors"
            style={
              selectedCity === city.id
                ? { ...getCityBadgeStyle(city), fontWeight: 700 }
                : getCityBadgeStyle(city)
            }
          >
            {city.name[locale]}
          </button>
        ))}
      </div>

      {/* Search input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={searching || !query.trim()}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {searching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('searching')}
            </>
          ) : (
            t('searchButton')
          )}
        </button>
      </div>

      {/* Results */}
      {hasSearched && !searching && (
        <div className="mt-4">
          {results.length === 0 ? (
            <p className="text-sm text-gray-500">{t('noSearchResults')}</p>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-2">
                {t('searchResults')} ({results.length})
              </p>
              <div className="space-y-2">
                {results.map((restaurant) => {
                  const isAdded = addedIds.has(restaurant.id);
                  const isAdding = addingId === restaurant.id;

                  return (
                    <div
                      key={restaurant.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3"
                    >
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {restaurant.name}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {restaurant.neighborhood} · {restaurant.priceRange} · {restaurant.cuisine.join(', ')}
                        </p>
                        {restaurant.description && (
                          <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">
                            {restaurant.description[locale]}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleAdd(restaurant)}
                        disabled={isAdded || isAdding}
                        className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          isAdded
                            ? 'bg-green-100 text-green-700 cursor-default'
                            : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                        }`}
                      >
                        {isAdding ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : isAdded ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            {t('added')}
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" />
                            {t('addRestaurant')}
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
