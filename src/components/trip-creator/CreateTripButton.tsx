'use client';

import { useTranslations } from 'next-intl';
import { Loader2, Sparkles } from 'lucide-react';

interface CreateTripButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function CreateTripButton({ onClick, disabled, loading }: CreateTripButtonProps) {
  const t = useTranslations('tripCreator');

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full py-3 px-4 rounded-lg bg-green-600 text-white font-semibold text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('creating')}
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          {t('createTrip')}
        </>
      )}
    </button>
  );
}
