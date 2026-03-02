'use client';

import { useTranslations } from 'next-intl';
import { RefreshCw, Printer } from 'lucide-react';
import ShareButton from '@/components/shared/ShareButton';

interface StoryActionsProps {
  onRegenerate: () => void;
  generating: boolean;
  tripName: string;
}

export default function StoryActions({ onRegenerate, generating, tripName }: StoryActionsProps) {
  const t = useTranslations('story');

  return (
    <div className="story-actions flex flex-wrap items-center gap-2">
      <button
        onClick={onRegenerate}
        disabled={generating}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
        {t('regenerate')}
      </button>
      <ShareButton title={tripName} />
      <button
        onClick={() => window.print()}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
      >
        <Printer className="w-4 h-4" />
        {t('print')}
      </button>
    </div>
  );
}
