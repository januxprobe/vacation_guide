'use client';

import { useLocale } from 'next-intl';
import type { TravelerGroup } from '@/config/trip-config';
import { Minus, Plus } from 'lucide-react';

interface TravelerCountSelectorProps {
  groups: TravelerGroup[];
  counts: Record<string, number>;
  onChange: (counts: Record<string, number>) => void;
}

export default function TravelerCountSelector({
  groups,
  counts,
  onChange,
}: TravelerCountSelectorProps) {
  const locale = useLocale() as 'nl' | 'en';

  const updateCount = (groupId: string, delta: number) => {
    const current = counts[groupId] ?? 0;
    const next = Math.max(0, current + delta);
    onChange({ ...counts, [groupId]: next });
  };

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <div key={group.id} className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {group.label[locale]}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => updateCount(group.id, -1)}
              className="h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-40"
              disabled={(counts[group.id] ?? 0) === 0}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-6 text-center font-bold text-gray-900">
              {counts[group.id] ?? 0}
            </span>
            <button
              onClick={() => updateCount(group.id, 1)}
              className="h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
