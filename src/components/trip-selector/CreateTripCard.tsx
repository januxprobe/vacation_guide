'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Plus } from 'lucide-react';

export default function CreateTripCard() {
  const t = useTranslations('tripSelector');

  return (
    <Link
      href="/create-trip"
      className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 min-h-[200px] transition-all hover:border-blue-400 hover:bg-blue-50"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 group-hover:bg-blue-100 transition-colors mb-4">
        <Plus className="h-6 w-6 text-gray-500 group-hover:text-blue-600" />
      </div>
      <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600">
        {t('createNew')}
      </span>
    </Link>
  );
}
