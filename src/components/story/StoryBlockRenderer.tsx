'use client';

import { Link } from '@/i18n/routing';
import { UtensilsCrossed, ArrowRight, Star, Clock, Ticket } from 'lucide-react';
import VideoEmbed from '@/components/attractions/VideoEmbed';
import type { StoryBlock, Attraction } from '@/types';

interface StoryBlockRendererProps {
  block: StoryBlock;
  locale: 'nl' | 'en';
  tripSlug: string;
  attractions: Attraction[];
}

export default function StoryBlockRenderer({
  block,
  locale,
  tripSlug,
  attractions,
}: StoryBlockRendererProps) {
  switch (block.type) {
    case 'narrative':
      return (
        <p className="story-narrative text-gray-700 leading-relaxed text-base md:text-lg" style={{ fontFamily: 'Georgia, serif' }}>
          {block.content[locale]}
        </p>
      );

    case 'attraction_highlight': {
      const attraction = attractions.find((a) => a.id === block.attractionId);
      if (!attraction) {
        return (
          <p className="text-gray-700 leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
            {block.narrative[locale]}
          </p>
        );
      }

      const images = attraction.media?.filter((m) => m.type === 'image') ?? [];
      const video = attraction.media?.find((m) => m.type === 'video');
      const heroImage = images[0]?.src ?? attraction.thumbnail ?? attraction.images?.[0];
      const secondaryImages = images.slice(1, 3);

      return (
        <div className="my-6 rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
          {/* Hero image — full width */}
          {heroImage && (
            <div className="relative w-full aspect-[16/7] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroImage}
                alt={images[0]?.alt?.[locale] ?? attraction.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Overlay gradient for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <Link
                  href={`/${tripSlug}/attractions/${attraction.id}`}
                  className="text-white text-lg md:text-xl font-bold hover:underline drop-shadow-lg"
                >
                  {attraction.name}
                </Link>
              </div>
            </div>
          )}

          <div className="p-4 md:p-5">
            {/* Narrative text */}
            <p className="text-gray-700 leading-relaxed text-base md:text-lg mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              {block.narrative[locale]}
            </p>

            {/* Secondary images row */}
            {secondaryImages.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {secondaryImages.map((img, i) => (
                  <div key={i} className="relative aspect-[4/3] rounded-lg overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.src}
                      alt={img.alt[locale]}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Video embed */}
            {video && (
              <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
                <VideoEmbed
                  youtubeId={video.src}
                  alt={video.alt[locale]}
                />
              </div>
            )}

            {/* Quick info badges */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
              {attraction.priority === 'essential' && (
                <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                  <Star className="w-3.5 h-3.5" fill="currentColor" />
                  {locale === 'nl' ? 'Must-see' : 'Must-see'}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {Math.round(attraction.duration / 60) >= 1
                  ? `${Math.round(attraction.duration / 60)}${locale === 'nl' ? 'u' : 'h'}${attraction.duration % 60 > 0 ? ` ${attraction.duration % 60}min` : ''}`
                  : `${attraction.duration}min`}
              </span>
              {attraction.pricing.adult > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Ticket className="w-3.5 h-3.5" />
                  €{attraction.pricing.adult}
                </span>
              )}
              <Link
                href={`/${tripSlug}/attractions/${attraction.id}`}
                className="inline-flex items-center gap-1 font-medium hover:underline ml-auto"
                style={{ color: '#2563eb' }}
              >
                {locale === 'nl' ? 'Meer info' : 'More info'}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      );
    }

    case 'meal_highlight':
      return (
        <div className="flex items-start gap-3 my-3 p-3 rounded-lg bg-amber-50/50 border border-amber-100">
          <UtensilsCrossed className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            {block.restaurantName && (
              <span className="font-semibold text-amber-800">{block.restaurantName} — </span>
            )}
            <span className="text-gray-700" style={{ fontFamily: 'Georgia, serif' }}>
              {block.narrative[locale]}
            </span>
          </div>
        </div>
      );

    case 'transition':
      return (
        <p className="text-gray-500 italic my-4" style={{ fontFamily: 'Georgia, serif' }}>
          {block.narrative[locale]}
        </p>
      );
  }
}
