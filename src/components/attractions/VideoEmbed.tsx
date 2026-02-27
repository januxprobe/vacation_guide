'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Play } from 'lucide-react';

interface VideoEmbedProps {
  youtubeId: string;
  alt: string;
}

export default function VideoEmbed({ youtubeId, alt }: VideoEmbedProps) {
  const [loaded, setLoaded] = useState(false);
  const t = useTranslations('attractions');

  if (!loaded) {
    return (
      <button
        onClick={() => setLoaded(true)}
        className="relative w-full h-full bg-black flex items-center justify-center group cursor-pointer"
        aria-label={t('playVideo')}
      >
        <img
          src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity"
        />
        <div className="relative z-10 w-16 h-16 md:w-20 md:h-20 bg-red-600 rounded-full flex items-center justify-center group-hover:bg-red-700 transition-colors shadow-lg">
          <Play className="w-8 h-8 md:w-10 md:h-10 text-white ml-1" fill="white" />
        </div>
      </button>
    );
  }

  return (
    <iframe
      src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
      title={alt}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="w-full h-full border-0"
    />
  );
}
