'use client';

import { useState } from 'react';
import type { Attraction, AttractionCategory, Priority } from '@/types';
import AttractionCard from './AttractionCard';
import AttractionFilter from './AttractionFilter';

interface AttractionsListProps {
  attractions: Attraction[];
}

export default function AttractionsList({ attractions }: AttractionsListProps) {
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<
    AttractionCategory | 'all'
  >('all');
  const [selectedPriority, setSelectedPriority] = useState<Priority | 'all'>(
    'all'
  );

  const filtered = attractions.filter((a) => {
    if (selectedCity !== 'all' && a.city !== selectedCity) return false;
    if (selectedCategory !== 'all' && a.category !== selectedCategory)
      return false;
    if (selectedPriority !== 'all' && a.priority !== selectedPriority)
      return false;
    return true;
  });

  // Sort: essential first, then recommended, then optional
  const priorityOrder = { essential: 0, recommended: 1, optional: 2 };
  const sorted = [...filtered].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return (
    <div>
      <AttractionFilter
        selectedCity={selectedCity}
        selectedCategory={selectedCategory}
        selectedPriority={selectedPriority}
        onCityChange={setSelectedCity}
        onCategoryChange={setSelectedCategory}
        onPriorityChange={setSelectedPriority}
      />

      <div className="mt-6 text-sm text-gray-500">
        {sorted.length} / {attractions.length}
      </div>

      <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((attraction) => (
          <AttractionCard key={attraction.id} attraction={attraction} />
        ))}
      </div>
    </div>
  );
}
