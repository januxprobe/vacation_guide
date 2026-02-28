'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { ChevronDown, Landmark, Bus, UtensilsCrossed, Eye, EyeOff } from 'lucide-react';
import type { DayBudget } from '@/types';
import { useTripConfig } from '@/config/trip-context';
import { findCity, hexToRgba } from '@/lib/city-colors';

interface DayBreakdownProps {
  days: DayBudget[];
  onToggleExcluded?: (attractionId: string) => void;
}

const categoryIcon: Record<string, typeof Landmark> = {
  attractions: Landmark,
  transport: Bus,
  meals: UtensilsCrossed,
};

export default function DayBreakdown({ days, onToggleExcluded }: DayBreakdownProps) {
  const t = useTranslations();
  const locale = useLocale();
  const config = useTripConfig();
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const toggle = (dayNumber: number) => {
    setExpanded((prev) => ({ ...prev, [dayNumber]: !prev[dayNumber] }));
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-bold text-gray-900 mb-4">{t('budget.dayBreakdown')}</h3>

      <div className="space-y-2">
        {days.map((day) => {
          const isOpen = expanded[day.dayNumber] ?? false;
          const cityConfig = findCity(config.cities, day.city);
          const cityColor = cityConfig?.color ?? '#6b7280';

          return (
            <div key={day.dayNumber} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Header */}
              <button
                onClick={() => toggle(day.dayNumber)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-sm font-bold"
                    style={{ backgroundColor: cityColor }}
                  >
                    {day.dayNumber}
                  </span>
                  <div className="text-left">
                    <span className="text-sm font-medium text-gray-900">
                      {day.title[locale as 'nl' | 'en']}
                    </span>
                    <span
                      className="ml-2 text-xs font-medium"
                      style={{ color: cityColor }}
                    >
                      {cityConfig?.name[locale as 'nl' | 'en'] ?? day.city}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-900">
                    €{day.total.toFixed(2)}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>

              {/* Expanded content */}
              {isOpen && (
                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50">
                  {(['attractions', 'transport', 'meals'] as const).map((cat) => {
                    const catItems = day.items.filter((item) => item.category === cat);
                    if (catItems.length === 0) return null;

                    const Icon = categoryIcon[cat];
                    const catTotal = cat === 'attractions' ? day.attractionsCost
                      : cat === 'transport' ? day.transportCost
                      : day.mealsCost;

                    return (
                      <div key={cat} className="mb-3 last:mb-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            {t(`budget.${cat}`)}
                          </span>
                          <span className="ml-auto text-xs font-semibold text-gray-600">
                            €{catTotal.toFixed(2)}
                          </span>
                        </div>
                        <div className="space-y-1 ml-5.5">
                          {catItems.map((item, idx) => {
                            const isExcluded = item.excluded;
                            return (
                              <div key={idx} className={`flex items-center justify-between text-sm ${isExcluded ? 'opacity-40' : ''}`}>
                                <div className="flex items-center gap-2">
                                  {onToggleExcluded && item.attractionId && (
                                    <button
                                      onClick={() => onToggleExcluded(item.attractionId!)}
                                      className="text-gray-400 hover:text-gray-600 transition-colors"
                                      title={t('budget.toggleActivity')}
                                    >
                                      {isExcluded ? (
                                        <EyeOff className="w-3.5 h-3.5" />
                                      ) : (
                                        <Eye className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  )}
                                  <span className={`text-gray-600 ${isExcluded ? 'line-through' : ''}`}>
                                    {item.name[locale as 'nl' | 'en']}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400">
                                    €{item.unitPrice.toFixed(2)} {t('budget.unitPrice')}
                                    {item.discountedPrice != null && (
                                      <span
                                        className="ml-1"
                                        style={{ color: hexToRgba(cityColor, 0.8) }}
                                      >
                                        / €{item.discountedPrice.toFixed(2)}
                                      </span>
                                    )}
                                  </span>
                                  <span className={`font-medium min-w-[60px] text-right ${isExcluded ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                    €{item.total.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
