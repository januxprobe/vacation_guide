'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { BookOpen, Loader2 } from 'lucide-react';
import type { TripStory, NarrativeStyle, Attraction } from '@/types';
import type { CityConfig } from '@/config/trip-config';
import StoryStylePicker from './StoryStylePicker';
import StoryChapterView from './StoryChapterView';
import StoryActions from './StoryActions';

interface TripStorySectionProps {
  initialStory: TripStory | null;
  attractions: Attraction[];
  tripSlug: string;
  locale: 'nl' | 'en';
  primaryColor: string;
  cities: CityConfig[];
  tripName: string;
}

export default function TripStorySection({
  initialStory,
  attractions,
  tripSlug,
  locale,
  primaryColor,
  cities,
  tripName,
}: TripStorySectionProps) {
  const t = useTranslations('story');
  const [story, setStory] = useState<TripStory | null>(initialStory);
  const [style, setStyle] = useState<NarrativeStyle>(initialStory?.style ?? 'adventure');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripSlug}/story`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ style }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate story');
      }
      const data = await res.json();
      setStory(data.story);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'));
    } finally {
      setGenerating(false);
    }
  };

  // Generating state — show loading overlay
  if (generating && !story) {
    return (
      <section className="story-container">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Loader2
            className="w-10 h-10 animate-spin mb-4"
            style={{ color: primaryColor }}
          />
          <p className="text-lg font-medium text-gray-700">{t('generating')}</p>
          <p className="text-sm text-gray-400 mt-1">
            {locale === 'nl' ? 'Dit kan even duren...' : 'This may take a moment...'}
          </p>
        </div>
      </section>
    );
  }

  // No story yet — show style picker
  if (!story) {
    return (
      <section className="story-container">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="w-6 h-6" style={{ color: primaryColor }} />
          <h2 className="text-2xl font-bold text-gray-900">{t('title')}</h2>
        </div>

        <StoryStylePicker selected={style} onSelect={setStyle} primaryColor={primaryColor} />

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="mt-6 w-full sm:w-auto text-white px-6 py-3 rounded-lg font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: primaryColor }}
        >
          {generating ? t('generating') : t('generate')}
        </button>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </section>
    );
  }

  // Story exists — render it
  return (
    <section className="story-container max-w-3xl mx-auto">
      {/* Title bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6" style={{ color: primaryColor }} />
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{story.title[locale]}</h2>
        </div>
        <StoryActions
          onRegenerate={handleGenerate}
          generating={generating}
          tripName={tripName}
        />
      </div>

      <p className="text-sm text-gray-400 mb-8">
        {t('generatedAt', {
          date: new Date(story.generatedAt).toLocaleDateString(locale === 'nl' ? 'nl-NL' : 'en-US'),
        })}
      </p>

      {/* Introduction — larger, more impactful */}
      <div className="mb-10 border-l-4 pl-5" style={{ borderColor: primaryColor }}>
        <p className="text-gray-800 leading-relaxed text-lg md:text-xl" style={{ fontFamily: 'Georgia, serif' }}>
          {story.introduction[locale]}
        </p>
      </div>

      {/* Chapters */}
      {story.chapters.map((chapter, index) => (
        <StoryChapterView
          key={index}
          chapter={chapter}
          locale={locale}
          tripSlug={tripSlug}
          attractions={attractions}
          cities={cities}
        />
      ))}

      {/* Conclusion — visually distinct */}
      <div className="mt-10 pt-8 border-t-2 border-gray-200">
        <div className="border-l-4 pl-5" style={{ borderColor: primaryColor }}>
          <p className="text-gray-800 leading-relaxed text-lg md:text-xl" style={{ fontFamily: 'Georgia, serif' }}>
            {story.conclusion[locale]}
          </p>
        </div>
      </div>

      {/* Regenerate overlay when regenerating */}
      {generating && (
        <div className="fixed inset-0 bg-white/80 z-50 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="w-10 h-10 animate-spin mb-3" style={{ color: primaryColor }} />
            <p className="text-lg font-medium text-gray-700">{t('generating')}</p>
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </section>
  );
}
