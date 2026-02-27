'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Restaurant } from '@/types';
import RestaurantCard from './RestaurantCard';
import RestaurantFilter from './RestaurantFilter';

interface RestaurantsListProps {
  restaurants: Restaurant[];
}

export default function RestaurantsList({ restaurants }: RestaurantsListProps) {
  const t = useTranslations();
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedPrice, setSelectedPrice] = useState('all');

  const filtered = restaurants.filter((r) => {
    if (selectedCity !== 'all' && r.city !== selectedCity) return false;
    if (selectedPrice !== 'all' && r.priceRange !== selectedPrice) return false;
    return true;
  });

  return (
    <div>
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
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      )}
    </div>
  );
}
