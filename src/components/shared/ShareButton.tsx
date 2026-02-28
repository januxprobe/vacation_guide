'use client';

import { useTranslations } from 'next-intl';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonProps {
  title?: string;
  className?: string;
  iconOnly?: boolean;
}

export default function ShareButton({ title, className, iconOnly }: ShareButtonProps) {
  const t = useTranslations('common');

  const handleShare = async () => {
    const url = window.location.href;
    const shareTitle = title ?? document.title;

    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url });
      } catch {
        // User cancelled or error — no toast needed
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success(t('linkCopied'));
      } catch {
        // Fallback: select text
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        toast.success(t('linkCopied'));
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className={className ?? 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors'}
      title={t('shareTrip')}
    >
      <Share2 className="w-4 h-4" />
      {!iconOnly && <span>{t('share')}</span>}
    </button>
  );
}
