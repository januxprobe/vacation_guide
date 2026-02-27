'use client';

import { useTranslations } from 'next-intl';
import type { Activity, MealSuggestion, Attraction } from '@/types';
import { ActivityCard, MealCard } from './PlannerActivityCard';

type TimelineItem =
  | { type: 'activity'; data: Activity; attraction: Attraction | undefined; index: number }
  | { type: 'meal'; data: MealSuggestion };

function getHour(time: string): number {
  return parseInt(time.split(':')[0], 10);
}

function getTimePeriod(time: string): 'morning' | 'afternoon' | 'evening' {
  const h = getHour(time);
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

interface PlannerTimelineProps {
  activities: Activity[];
  meals: MealSuggestion[];
  attractions: Attraction[];
  cityColor: string;
  highlightedActivityId: string | null;
  onActivityClick: (attractionId: string) => void;
  activityRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
}

export default function PlannerTimeline({
  activities,
  meals,
  attractions,
  cityColor,
  highlightedActivityId,
  onActivityClick,
  activityRefs,
}: PlannerTimelineProps) {
  const t = useTranslations();

  const attractionMap = new Map(attractions.map((a) => [a.id, a]));

  // Merge activities and meals into a sorted timeline
  const items: TimelineItem[] = [
    ...activities.map((a, i) => ({
      type: 'activity' as const,
      data: a,
      attraction: attractionMap.get(a.attractionId),
      index: i,
    })),
    ...meals.map((m) => ({
      type: 'meal' as const,
      data: m,
    })),
  ].sort((a, b) => {
    const timeA = a.type === 'activity' ? a.data.time : a.data.time;
    const timeB = b.type === 'activity' ? b.data.time : b.data.time;
    return timeA.localeCompare(timeB);
  });

  // Group by time period
  const groups: Record<'morning' | 'afternoon' | 'evening', TimelineItem[]> = {
    morning: [],
    afternoon: [],
    evening: [],
  };

  for (const item of items) {
    const time = item.type === 'activity' ? item.data.time : item.data.time;
    groups[getTimePeriod(time)].push(item);
  }

  const periodLabels: Record<string, string> = {
    morning: t('planner.morning'),
    afternoon: t('planner.afternoon'),
    evening: t('planner.evening'),
  };

  return (
    <div className="space-y-4">
      {(['morning', 'afternoon', 'evening'] as const).map((period) => {
        const periodItems = groups[period];
        if (periodItems.length === 0) return null;

        return (
          <div key={period}>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
              {periodLabels[period]}
            </div>
            <div className="space-y-1.5">
              {periodItems.map((item, i) => {
                if (item.type === 'meal') {
                  return <MealCard key={`meal-${item.data.type}-${item.data.time}`} meal={item.data} />;
                }

                const activityId = item.data.attractionId;
                return (
                  <div
                    key={`activity-${activityId}`}
                    ref={(el) => {
                      if (el) activityRefs.current.set(activityId, el);
                    }}
                  >
                    <ActivityCard
                      activity={item.data}
                      attraction={item.attraction}
                      index={item.index}
                      cityColor={cityColor}
                      isHighlighted={highlightedActivityId === activityId}
                      onClick={() => onActivityClick(activityId)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
