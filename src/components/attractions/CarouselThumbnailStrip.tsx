'use client';

import { useCallback, useEffect, useState } from 'react';
import type { EmblaCarouselType } from 'embla-carousel';
import useEmblaCarousel from 'embla-carousel-react';
import type { MediaItem } from '@/types';
import { Play } from 'lucide-react';

interface CarouselThumbnailStripProps {
  items: { type: 'image' | 'video'; src: string; alt: string }[];
  mainApi: EmblaCarouselType | undefined;
}

export default function CarouselThumbnailStrip({
  items,
  mainApi,
}: CarouselThumbnailStripProps) {
  const [thumbRef, thumbApi] = useEmblaCarousel({
    containScroll: 'keepSnaps',
    dragFree: true,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onThumbClick = useCallback(
    (index: number) => {
      if (!mainApi || !thumbApi) return;
      mainApi.scrollTo(index);
    },
    [mainApi, thumbApi]
  );

  const onSelect = useCallback(() => {
    if (!mainApi || !thumbApi) return;
    const index = mainApi.selectedScrollSnap();
    setSelectedIndex(index);
    thumbApi.scrollTo(index);
  }, [mainApi, thumbApi]);

  useEffect(() => {
    if (!mainApi) return;
    onSelect();
    mainApi.on('select', onSelect);
    mainApi.on('reInit', onSelect);
    return () => {
      mainApi.off('select', onSelect);
      mainApi.off('reInit', onSelect);
    };
  }, [mainApi, onSelect]);

  return (
    <div className="overflow-hidden px-2 pb-2" ref={thumbRef}>
      <div className="flex gap-2">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={() => onThumbClick(index)}
            className={`relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
              index === selectedIndex
                ? 'border-white opacity-100'
                : 'border-transparent opacity-50 hover:opacity-75'
            }`}
          >
            {item.type === 'video' ? (
              <>
                <img
                  src={`https://img.youtube.com/vi/${item.src}/default.jpg`}
                  alt={item.alt}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="w-4 h-4 text-white drop-shadow-md" fill="white" />
                </div>
              </>
            ) : (
              <img
                src={item.src}
                alt={item.alt}
                className="w-full h-full object-cover"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
