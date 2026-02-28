'use client';

import { useTranslations } from 'next-intl';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
}

export default function FavoriteButton({ isFavorite, onToggle }: FavoriteButtonProps) {
  const t = useTranslations('common');

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle();
    toast.success(isFavorite ? t('removedFromFavorites') : t('addedToFavorites'));
  };

  return (
    <button
      onClick={handleClick}
      className="p-1.5 rounded-md transition-colors hover:bg-red-50"
      title={isFavorite ? t('unfavorite') : t('favorite')}
    >
      <Heart
        className={`w-4 h-4 transition-colors ${
          isFavorite
            ? 'fill-red-500 text-red-500'
            : 'text-gray-400 hover:text-red-400'
        }`}
      />
    </button>
  );
}
