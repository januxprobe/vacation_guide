'use client';

import { useTranslations } from 'next-intl';
import type { Pricing } from '@/types';
import { useLocale } from 'next-intl';

interface PriceInfoProps {
  pricing: Pricing;
}

export default function PriceInfo({ pricing }: PriceInfoProps) {
  const t = useTranslations('attractions');
  const locale = useLocale();

  if (pricing.adult === 0 && !pricing.guidedTour) {
    return (
      <span className="text-green-600 font-semibold">
        {locale === 'nl' ? 'Gratis' : 'Free'}
      </span>
    );
  }

  return (
    <div className="space-y-1">
      {pricing.adult > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{t('adult')}</span>
          <span className="font-medium">€{pricing.adult.toFixed(2)}</span>
        </div>
      )}
      {pricing.adult === 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{t('adult')}</span>
          <span className="font-medium text-green-600">
            {locale === 'nl' ? 'Gratis' : 'Free'}
          </span>
        </div>
      )}
      {pricing.student !== undefined && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{t('student')}</span>
          <span className="font-medium">€{pricing.student.toFixed(2)}</span>
        </div>
      )}
      {pricing.child !== undefined && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{t('child')}</span>
          <span className="font-medium">€{pricing.child.toFixed(2)}</span>
        </div>
      )}
      {pricing.guidedTour !== undefined && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{t('guidedTour')}</span>
          <span className="font-medium">€{pricing.guidedTour.toFixed(2)}</span>
        </div>
      )}
      {pricing.notes && (
        <p className="text-xs text-gray-500 mt-1">
          {pricing.notes[locale as 'nl' | 'en']}
        </p>
      )}
    </div>
  );
}
