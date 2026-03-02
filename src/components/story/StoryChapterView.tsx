'use client';

import type { StoryChapter, Attraction } from '@/types';
import type { CityConfig } from '@/config/trip-config';
import StoryBlockRenderer from './StoryBlockRenderer';

interface StoryChapterViewProps {
  chapter: StoryChapter;
  locale: 'nl' | 'en';
  tripSlug: string;
  attractions: Attraction[];
  cities: CityConfig[];
}

export default function StoryChapterView({
  chapter,
  locale,
  tripSlug,
  attractions,
  cities,
}: StoryChapterViewProps) {
  const cityConfig = cities.find((c) => c.id === chapter.city);
  const cityColor = cityConfig?.color ?? '#6b7280';
  const cityName = cityConfig?.name?.[locale] ?? chapter.city;

  return (
    <div className="story-chapter mb-12">
      {/* Chapter header */}
      <div className="flex items-center gap-3 mb-6">
        <span
          className="inline-flex items-center justify-center w-10 h-10 rounded-full text-white text-base font-bold flex-shrink-0 shadow-sm"
          style={{ backgroundColor: cityColor }}
        >
          {chapter.dayNumber}
        </span>
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-gray-900">
            {chapter.title[locale]}
          </h3>
          <p className="text-sm text-gray-500">{cityName}</p>
        </div>
      </div>

      {/* Blocks */}
      <div className="space-y-3 pl-3 sm:pl-6 border-l-2" style={{ borderColor: `${cityColor}30` }}>
        {chapter.blocks.map((block, index) => (
          <StoryBlockRenderer
            key={index}
            block={block}
            locale={locale}
            tripSlug={tripSlug}
            attractions={attractions}
          />
        ))}
      </div>
    </div>
  );
}
