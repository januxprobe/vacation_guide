'use client';

import { useTranslations } from 'next-intl';
import { Compass, Landmark, Heart, Users } from 'lucide-react';
import type { NarrativeStyle } from '@/types';

const STYLES: {
  id: NarrativeStyle;
  icon: typeof Compass;
  labelKey: string;
  descKey: string;
}[] = [
  { id: 'adventure', icon: Compass, labelKey: 'styles.adventure', descKey: 'styles.adventureDesc' },
  { id: 'cultural', icon: Landmark, labelKey: 'styles.cultural', descKey: 'styles.culturalDesc' },
  { id: 'romantic', icon: Heart, labelKey: 'styles.romantic', descKey: 'styles.romanticDesc' },
  { id: 'family', icon: Users, labelKey: 'styles.family', descKey: 'styles.familyDesc' },
];

interface StoryStylePickerProps {
  selected: NarrativeStyle;
  onSelect: (style: NarrativeStyle) => void;
  primaryColor: string;
}

export default function StoryStylePicker({ selected, onSelect, primaryColor }: StoryStylePickerProps) {
  const t = useTranslations('story');

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('stylePicker.title')}</h3>
      <p className="text-sm text-gray-500 mb-4">{t('stylePicker.subtitle')}</p>
      <div className="grid grid-cols-2 gap-3">
        {STYLES.map(({ id, icon: Icon, labelKey, descKey }) => {
          const isSelected = selected === id;
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors text-center"
              style={{
                borderColor: isSelected ? primaryColor : '#e5e7eb',
                backgroundColor: isSelected ? `${primaryColor}08` : 'white',
              }}
            >
              <Icon
                className="w-6 h-6"
                style={{ color: isSelected ? primaryColor : '#6b7280' }}
              />
              <span className="text-sm font-medium text-gray-900">{t(labelKey)}</span>
              <span className="text-xs text-gray-500">{t(descKey)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
