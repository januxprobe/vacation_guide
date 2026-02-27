'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import useEmblaCarousel from 'embla-carousel-react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import VideoEmbed from './VideoEmbed';
import CarouselThumbnailStrip from './CarouselThumbnailStrip';

interface CarouselItem {
  type: 'image' | 'video';
  src: string;
  alt: string;
}

interface FullscreenCarouselProps {
  items: CarouselItem[];
  startIndex: number;
  onClose: () => void;
}

export default function FullscreenCarousel({
  items,
  startIndex,
  onClose,
}: FullscreenCarouselProps) {
  const t = useTranslations('attractions');
  const [emblaRef, emblaApi] = useEmblaCarousel({
    startIndex,
    loop: true,
  });
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') scrollPrev();
      if (e.key === 'ArrowRight') scrollNext();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, scrollPrev, scrollNext]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={t('gallery')}
    >
      {/* Top bar: counter + close */}
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="text-sm font-medium">
          {currentIndex + 1} / {items.length}
        </span>
        <button
          onClick={onClose}
          className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          aria-label={t('closeGallery')}
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main carousel */}
      <div className="flex-1 relative flex items-center min-h-0">
        {/* Previous arrow (hidden on mobile) */}
        <button
          onClick={scrollPrev}
          className="hidden md:flex absolute left-4 z-10 w-11 h-11 items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors cursor-pointer"
          aria-label={t('previousPhoto')}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="overflow-hidden w-full h-full" ref={emblaRef}>
          <div className="flex h-full">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-full h-full flex items-center justify-center px-4 md:px-16"
              >
                {item.type === 'video' ? (
                  <div className="w-full max-w-4xl aspect-video">
                    <VideoEmbed youtubeId={item.src} alt={item.alt} />
                  </div>
                ) : (
                  <img
                    src={item.src}
                    alt={item.alt}
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Next arrow (hidden on mobile) */}
        <button
          onClick={scrollNext}
          className="hidden md:flex absolute right-4 z-10 w-11 h-11 items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors cursor-pointer"
          aria-label={t('nextPhoto')}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Thumbnail strip */}
      <div className="pt-2">
        <CarouselThumbnailStrip items={items} mainApi={emblaApi} />
      </div>
    </div>
  );
}
