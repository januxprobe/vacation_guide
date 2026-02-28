'use client';

import { useTranslations } from 'next-intl';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { Activity, MealSuggestion, Attraction } from '@/types';
import { ActivityCard, MealCard } from './PlannerActivityCard';
import SortableActivityCard from './SortableActivityCard';
import WalkingGap from './WalkingGap';

type TimelineItem =
  | { type: 'activity'; data: Activity; attraction: Attraction | undefined; index: number }
  | { type: 'meal'; data: MealSuggestion };

function getTimePeriod(time: string): 'morning' | 'afternoon' | 'evening' {
  const h = parseInt(time.split(':')[0], 10);
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
  legDurations?: number[];
  canReorder?: boolean;
  onReorder?: (oldIndex: number, newIndex: number) => void;
}

export default function PlannerTimeline({
  activities,
  meals,
  attractions,
  cityColor,
  highlightedActivityId,
  onActivityClick,
  activityRefs,
  legDurations,
  canReorder,
  onReorder,
}: PlannerTimelineProps) {
  const t = useTranslations();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const attractionMap = new Map(attractions.map((a) => [a.id, a]));

  // Build a map from activity index to walking leg duration
  const activityLegMap = new Map<number, number>();
  if (legDurations) {
    const activitiesWithAttractions = activities
      .map((a, i) => ({ index: i, attractionId: a.attractionId }))
      .filter((a) => !!a.attractionId);

    for (let i = 0; i < activitiesWithAttractions.length - 1 && i < legDurations.length; i++) {
      activityLegMap.set(activitiesWithAttractions[i].index, legDurations[i]);
    }
  }

  // Merge activities and meals into a sorted timeline
  const items: TimelineItem[] = [
    ...activities.map((a, i) => ({
      type: 'activity' as const,
      data: a,
      attraction: a.attractionId ? attractionMap.get(a.attractionId) : undefined,
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

  // For DnD: we need sortable IDs for activities only
  const activitySortIds = activities.map((a, i) =>
    a.attractionId ?? `freeform-${i}`
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorder) return;

    const oldIndex = activitySortIds.indexOf(active.id as string);
    const newIndex = activitySortIds.indexOf(over.id as string);
    if (oldIndex !== -1 && newIndex !== -1) {
      onReorder(oldIndex, newIndex);
    }
  };

  const renderActivityItem = (item: TimelineItem & { type: 'activity' }, periodIndex: number) => {
    const activityId = item.data.attractionId ?? `freeform-${periodIndex}`;
    const walkDuration = activityLegMap.get(item.index);

    if (canReorder && onReorder) {
      return (
        <div key={`activity-${activityId}`}>
          <div
            ref={(el) => {
              if (el) activityRefs.current.set(activityId, el);
            }}
          >
            <SortableActivityCard
              id={activityId}
              activity={item.data}
              attraction={item.attraction}
              index={item.index}
              cityColor={cityColor}
              isHighlighted={highlightedActivityId === activityId}
              onClick={() => onActivityClick(activityId)}
            />
          </div>
          {walkDuration != null && walkDuration > 0 && (
            <WalkingGap durationSeconds={walkDuration} />
          )}
        </div>
      );
    }

    return (
      <div key={`activity-${activityId}`}>
        <div
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
        {walkDuration != null && walkDuration > 0 && (
          <WalkingGap durationSeconds={walkDuration} />
        )}
      </div>
    );
  };

  const content = (
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
                return renderActivityItem(item, i);
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  if (canReorder && onReorder) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={activitySortIds} strategy={verticalListSortingStrategy}>
          {content}
        </SortableContext>
      </DndContext>
    );
  }

  return content;
}
