'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import LanguageSwitcher from './LanguageSwitcher';

export default function GlobalBar() {
  const t = useTranslations();

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-12">
          <Link href="/" className="flex items-center">
            <span className="text-lg font-bold text-blue-600">
              {t('tripSelector.appName')}
            </span>
          </Link>

          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}
