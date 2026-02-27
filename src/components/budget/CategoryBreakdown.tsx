'use client';

import { useTranslations } from 'next-intl';
import { Landmark, Bus, UtensilsCrossed } from 'lucide-react';

interface CategoryBreakdownProps {
  subtotals: Record<string, number>;
  total: number;
}

const categoryConfig: Record<string, { icon: typeof Landmark; colorClass: string }> = {
  attractions: { icon: Landmark, colorClass: 'bg-blue-500' },
  transport: { icon: Bus, colorClass: 'bg-green-500' },
  meals: { icon: UtensilsCrossed, colorClass: 'bg-amber-500' },
};

export default function CategoryBreakdown({ subtotals, total }: CategoryBreakdownProps) {
  const t = useTranslations();

  const categories = ['attractions', 'transport', 'meals'];

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-gray-900">{t('budget.categoryBreakdown')}</h3>

      {categories.map((cat) => {
        const amount = subtotals[cat] ?? 0;
        const percentage = total > 0 ? (amount / total) * 100 : 0;
        const config = categoryConfig[cat];
        const Icon = config.icon;

        return (
          <div key={cat}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {t(`budget.${cat}`)}
                </span>
              </div>
              <div className="text-sm text-gray-700">
                <span className="font-bold">€{amount.toFixed(2)}</span>
                <span className="text-gray-400 ml-2">({percentage.toFixed(0)}%)</span>
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${config.colorClass}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
