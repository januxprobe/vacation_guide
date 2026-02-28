'use client';

import { useTranslations } from 'next-intl';
import { Footprints } from 'lucide-react';

interface WalkingGapProps {
  durationSeconds: number;
}

export default function WalkingGap({ durationSeconds }: WalkingGapProps) {
  const t = useTranslations();
  const minutes = Math.round(durationSeconds / 60);

  if (minutes < 1) return null;

  return (
    <div className="flex items-center gap-2 py-1 px-3">
      <div className="flex-1 border-t border-dashed border-gray-300" />
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <Footprints className="w-3 h-3" />
        <span>{t('planner.walkingTime', { minutes })}</span>
      </div>
      <div className="flex-1 border-t border-dashed border-gray-300" />
    </div>
  );
}
