import type { Activity } from '@/types';

/**
 * Parse a "HH:MM" time string into total minutes since midnight.
 */
export function parseTime(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Format total minutes since midnight back to "HH:MM" string.
 * Wraps around at 24 hours.
 */
export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Recalculate activity times after reorder based on previous activity's
 * time + duration + a 15-minute gap.
 */
export function recalculateTimes(activities: Activity[]): Activity[] {
  if (activities.length === 0) return activities;

  return activities.map((activity, i) => {
    if (i === 0) return activity;
    const prev = activities[i - 1];
    const prevTime = parseTime(prev.time);
    const prevEnd = prevTime + prev.duration + 15; // 15 min gap
    return { ...activity, time: formatTime(prevEnd) };
  });
}
