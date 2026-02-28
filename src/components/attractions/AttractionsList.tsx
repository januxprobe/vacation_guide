'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Search, SlidersHorizontal, Heart } from 'lucide-react';
import type { Attraction, AttractionCategory, Priority } from '@/types';
import AttractionCard from './AttractionCard';
import AttractionFilter from './AttractionFilter';
import { useFavorites } from '@/hooks/useFavorites';

type SortOption = 'priority' | 'price' | 'duration' | 'name';

interface AttractionsListProps {
  attractions: Attraction[];
  tripSlug: string;
}

export default function AttractionsList({ attractions, tripSlug }: AttractionsListProps) {
  const t = useTranslations();
  const locale = useLocale() as 'nl' | 'en';
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<
    AttractionCategory | 'all'
  >('all');
  const [selectedPriority, setSelectedPriority] = useState<Priority | 'all'>(
    'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const { isFavorite, toggleFavorite, favoriteAttractionIds } = useFavorites(tripSlug);

  const filtered = attractions.filter((a) => {
    if (selectedCity !== 'all' && a.city !== selectedCity) return false;
    if (selectedCategory !== 'all' && a.category !== selectedCategory)
      return false;
    if (selectedPriority !== 'all' && a.priority !== selectedPriority)
      return false;
    if (favoritesOnly && !isFavorite('attractions', a.id)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = a.name.toLowerCase().includes(q);
      const descMatch = a.description[locale]?.toLowerCase().includes(q);
      if (!nameMatch && !descMatch) return false;
    }
    return true;
  });

  const priorityOrder = { essential: 0, recommended: 1, optional: 2 };

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.pricing.adult - b.pricing.adult;
      case 'duration':
        return a.duration - b.duration;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'priority':
      default:
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
  });

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'priority', label: t('attractions.sortPriority') },
    { value: 'price', label: t('attractions.sortPrice') },
    { value: 'duration', label: t('attractions.sortDuration') },
    { value: 'name', label: t('attractions.sortName') },
  ];

  const hasActiveFilters = selectedCity !== 'all' || selectedCategory !== 'all' || selectedPriority !== 'all' || searchQuery.trim() !== '' || favoritesOnly;

  const resetFilters = () => {
    setSelectedCity('all');
    setSelectedCategory('all');
    setSelectedPriority('all');
    setSearchQuery('');
    setFavoritesOnly(false);
  };

  return (
    <div>
      {/* Search input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('attractions.searchPlaceholder')}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <AttractionFilter
        selectedCity={selectedCity}
        selectedCategory={selectedCategory}
        selectedPriority={selectedPriority}
        onCityChange={setSelectedCity}
        onCategoryChange={setSelectedCategory}
        onPriorityChange={setSelectedPriority}
      />

      {/* Favorites filter + Sort pills */}
      <div className="mt-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              favoritesOnly
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-white' : ''}`} />
            {t('common.favoritesOnly')}
            {favoriteAttractionIds.length > 0 && (
              <span className={`text-xs ${favoritesOnly ? 'text-white/80' : 'text-gray-400'}`}>
                ({favoriteAttractionIds.length})
              </span>
            )}
          </button>
          <span className="text-gray-300">|</span>
          <SlidersHorizontal className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">{t('attractions.sortBy')}</span>
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                sortBy === opt.value
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        {sorted.length} / {attractions.length}
      </div>

      {sorted.length === 0 ? (
        <div className="mt-12 text-center">
          <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">{t('attractions.noResults')}</p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              {t('attractions.resetFilters')}
            </button>
          )}
        </div>
      ) : (
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((attraction) => (
            <AttractionCard
            key={attraction.id}
            attraction={attraction}
            isFavorite={isFavorite('attractions', attraction.id)}
            onToggleFavorite={() => toggleFavorite('attractions', attraction.id)}
          />
          ))}
        </div>
      )}
    </div>
  );
}
