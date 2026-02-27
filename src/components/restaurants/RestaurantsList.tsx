'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Restaurant } from '@/types';
import RestaurantCard from './RestaurantCard';
import RestaurantFilter from './RestaurantFilter';
import RestaurantSearch from './RestaurantSearch';

interface RestaurantsListProps {
  restaurants: Restaurant[];
  tripSlug?: string;
  isDynamic?: boolean;
}

export default function RestaurantsList({ restaurants: initialRestaurants, tripSlug, isDynamic }: RestaurantsListProps) {
  const t = useTranslations();
  const [restaurants, setRestaurants] = useState(initialRestaurants);
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedPrice, setSelectedPrice] = useState('all');

  const filtered = restaurants.filter((r) => {
    if (selectedCity !== 'all' && r.city !== selectedCity) return false;
    if (selectedPrice !== 'all' && r.priceRange !== selectedPrice) return false;
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
        console.error('Failed to remove restaurant');
        return;
      }

      setRestaurants((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error('Remove restaurant error:', error);
    }
  };

  const handleRestaurantAdded = (restaurant: Restaurant) => {
    setRestaurants((prev) => {
      if (prev.some((r) => r.id === restaurant.id)) return prev;
      return [...prev, restaurant];
    });
  };

  return (
    <div>
      {isDynamic && tripSlug && (
        <RestaurantSearch
          tripSlug={tripSlug}
          onRestaurantAdded={handleRestaurantAdded}
        />
      )}

      <RestaurantFilter
        selectedCity={selectedCity}
        selectedPrice={selectedPrice}
        onCityChange={setSelectedCity}
        onPriceChange={setSelectedPrice}
      />

      <div className="mt-6 text-sm text-gray-500">
        {filtered.length} / {restaurants.length}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-center text-gray-500">{t('restaurants.noResults')}</p>
      ) : (
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              canRemove={isDynamic}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
