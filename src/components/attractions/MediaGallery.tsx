'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Camera, Play } from 'lucide-react';
import type { MediaItem } from '@/types';
import FullscreenCarousel from './FullscreenCarousel';

interface MediaGalleryProps {
  thumbnail: string;
  name: string;
  media?: MediaItem[];
}

export default function MediaGallery({
  thumbnail,
  name,
  media,
}: MediaGalleryProps) {
  const t = useTranslations('attractions');
  const locale = useLocale() as 'nl' | 'en';
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  // Build the full list of carousel items: thumbnail first, then media
  const allItems = [
    { type: 'image' as const, src: thumbnail, alt: name },
    ...(media || []).map((item) => ({
      type: item.type,
      src: item.type === 'image' ? item.src : item.src,
      alt: item.alt[locale],
    })),
  ];

  const gridItems = media || [];
  const maxGridVisible = 5;
  const visibleGrid = gridItems.slice(0, maxGridVisible);
  const hiddenCount = gridItems.length - maxGridVisible;

  const openCarousel = (index: number) => {
    setStartIndex(index);
    setCarouselOpen(true);
  };

  return (
    <>
      {/* Hero image */}
      <div className="relative -mx-6 -mt-6 mb-6">
        <button
          onClick={() => openCarousel(0)}
          className="w-full cursor-pointer group"
        >
          <img
            src={thumbnail}
            alt={name}
            className="w-full h-64 md:h-80 lg:h-96 object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          {allItems.length > 1 && (
            <div className="absolute bottom-4 right-4 bg-black/60 text-white text-sm px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Camera className="w-4 h-4" />
              <span>{allItems.length}</span>
            </div>
          )}
        </button>
      </div>

      {/* Thumbnail grid */}
      {visibleGrid.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mb-6">
          {visibleGrid.map((item, index) => (
            <button
              key={index}
              onClick={() => openCarousel(index + 1)}
              className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
            >
              {item.type === 'video' ? (
                <>
                  <img
                    src={`https://img.youtube.com/vi/${item.src}/hqdefault.jpg`}
                    alt={item.alt[locale]}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                      <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                    </div>
                  </div>
                </>
              ) : (
                <img
                  src={item.src}
                  alt={item.alt[locale]}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

              {/* "+N more" overlay on last visible item */}
              {index === maxGridVisible - 1 && hiddenCount > 0 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    +{hiddenCount + 1}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen carousel */}
      {carouselOpen && (
        <FullscreenCarousel
          items={allItems}
          startIndex={startIndex}
          onClose={() => setCarouselOpen(false)}
        />
      )}
    </>
  );
}
