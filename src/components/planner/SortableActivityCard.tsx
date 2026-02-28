'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { Activity, Attraction } from '@/types';
import { ActivityCard } from './PlannerActivityCard';

interface SortableActivityCardProps {
  id: string;
  activity: Activity;
  attraction: Attraction | undefined;
  index: number;
  cityColor: string;
  isHighlighted: boolean;
  onClick: () => void;
}

export default function SortableActivityCard({
  id,
  activity,
  attraction,
  index,
  cityColor,
  isHighlighted,
  onClick,
}: SortableActivityCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-stretch gap-0">
      <div
        className="flex items-center px-1 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <ActivityCard
          activity={activity}
          attraction={attraction}
          index={index}
          cityColor={cityColor}
          isHighlighted={isHighlighted}
          onClick={onClick}
        />
      </div>
    </div>
  );
}
