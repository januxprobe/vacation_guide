'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Itinerary, Attraction } from '@/types';
import { useTripConfig } from '@/config/trip-context';
import { calculateBudget } from '@/lib/budget-calculator';
import TravelerCountSelector from './TravelerCountSelector';
import CategoryBreakdown from './CategoryBreakdown';
import BudgetSummaryCard from './BudgetSummaryCard';

interface BudgetCalculatorProps {
  itinerary: Itinerary;
  attractions: Attraction[];
}

export default function BudgetCalculator({ itinerary, attractions }: BudgetCalculatorProps) {
  const t = useTranslations();
  const config = useTripConfig();

  // Initialize counts from traveler group defaults
  const defaultCounts: Record<string, number> = {};
  for (const group of config.travelerGroups) {
    defaultCounts[group.id] = group.defaultCount;
  }

  const [counts, setCounts] = useState(defaultCounts);
  const [applyDiscount, setApplyDiscount] = useState(true);

  const summary = calculateBudget({
    itinerary,
    attractions,
    travelerGroups: config.travelerGroups,
    config: {
      travelerCounts: counts,
      applyStudentDiscount: applyDiscount,
    },
  });

  const totalTravelers = Object.values(counts).reduce((s, c) => s + c, 0);

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Left: Configuration */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-4">{t('budget.travelers')}</h3>
          <TravelerCountSelector
            groups={config.travelerGroups}
            counts={counts}
            onChange={setCounts}
          />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={applyDiscount}
              onChange={(e) => setApplyDiscount(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              {t('budget.applyStudentDiscount')}
            </span>
          </label>
        </div>
      </div>

      {/* Right: Results */}
      <div className="lg:col-span-2 space-y-6">
        <BudgetSummaryCard
          summary={summary}
          totalTravelers={totalTravelers}
          totalDays={itinerary.days.length}
        />

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <CategoryBreakdown
            subtotals={summary.subtotalByCategory}
            total={summary.total}
          />
        </div>
      </div>
    </div>
  );
}
