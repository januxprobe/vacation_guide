'use client';

import { useTranslations } from 'next-intl';
import type { BudgetSummary } from '@/types';
import { useTripConfig } from '@/config/trip-context';
import { Calculator, Users } from 'lucide-react';

interface BudgetSummaryCardProps {
  summary: BudgetSummary;
  totalTravelers: number;
  totalDays: number;
}

export default function BudgetSummaryCard({
  summary,
  totalTravelers,
  totalDays,
}: BudgetSummaryCardProps) {
  const t = useTranslations();
  const config = useTripConfig();
  const primaryColor = config.theme.primaryColor;

  const dailyAverage = totalDays > 0 ? summary.total / totalDays : 0;

  return (
    <div
      className="rounded-lg p-6 text-white"
      style={{ backgroundColor: primaryColor }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="h-5 w-5" />
        <h3 className="text-lg font-bold">{t('budget.summary')}</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm opacity-80">{t('budget.total')}</p>
          <p className="text-3xl font-bold">€{summary.total.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm opacity-80">{t('budget.perPerson')}</p>
          <p className="text-3xl font-bold">€{summary.perPerson.toFixed(2)}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 opacity-80" />
          <span className="text-sm">
            {totalTravelers} {t('budget.travelers').toLowerCase()}
          </span>
        </div>
        <div>
          <span className="text-sm opacity-80">{t('budget.dailyAverage')}: </span>
          <span className="text-sm font-bold">€{dailyAverage.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
