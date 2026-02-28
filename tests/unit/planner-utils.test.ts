import { describe, it, expect } from 'vitest';
import { parseTime, formatTime, recalculateTimes } from '@/lib/planner-utils';
import type { Activity } from '@/types';

describe('parseTime', () => {
  it('parses "09:00" to 540 minutes', () => {
    expect(parseTime('09:00')).toBe(540);
  });

  it('parses "00:00" to 0 minutes', () => {
    expect(parseTime('00:00')).toBe(0);
  });

  it('parses "23:59" to 1439 minutes', () => {
    expect(parseTime('23:59')).toBe(1439);
  });

  it('parses "12:30" to 750 minutes', () => {
    expect(parseTime('12:30')).toBe(750);
  });

  it('parses "14:15" to 855 minutes', () => {
    expect(parseTime('14:15')).toBe(855);
  });
});

describe('formatTime', () => {
  it('formats 540 to "09:00"', () => {
    expect(formatTime(540)).toBe('09:00');
  });

  it('formats 0 to "00:00"', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('formats 1439 to "23:59"', () => {
    expect(formatTime(1439)).toBe('23:59');
  });

  it('formats 750 to "12:30"', () => {
    expect(formatTime(750)).toBe('12:30');
  });

  it('wraps around at 24 hours', () => {
    expect(formatTime(1440)).toBe('00:00');
    expect(formatTime(1500)).toBe('01:00');
  });

  it('pads single-digit hours and minutes', () => {
    expect(formatTime(65)).toBe('01:05');
  });
});

describe('recalculateTimes', () => {
  it('returns empty array for empty input', () => {
    expect(recalculateTimes([])).toEqual([]);
  });

  it('preserves first activity time unchanged', () => {
    const activities: Activity[] = [
      { time: '09:00', duration: 60, attractionId: 'a1' },
    ];
    const result = recalculateTimes(activities);
    expect(result[0].time).toBe('09:00');
  });

  it('recalculates second activity based on first end + 15min gap', () => {
    const activities: Activity[] = [
      { time: '09:00', duration: 60, attractionId: 'a1' },
      { time: '11:00', duration: 90, attractionId: 'a2' },
    ];
    const result = recalculateTimes(activities);
    // First: 09:00 + 60min duration + 15min gap = 10:15
    expect(result[0].time).toBe('09:00');
    expect(result[1].time).toBe('10:15');
  });

  it('recalculates each activity based on original previous activity time', () => {
    const activities: Activity[] = [
      { time: '09:00', duration: 60, attractionId: 'a1' },
      { time: '12:00', duration: 30, attractionId: 'a2' },
      { time: '15:00', duration: 45, attractionId: 'a3' },
    ];
    const result = recalculateTimes(activities);
    // First: 09:00 (unchanged)
    expect(result[0].time).toBe('09:00');
    // Second: 09:00 + 60 + 15 = 10:15
    expect(result[1].time).toBe('10:15');
    // Third: based on original activities[1] time (12:00) + 30 + 15 = 12:45
    expect(result[2].time).toBe('12:45');
  });

  it('handles activities without attractionId', () => {
    const activities: Activity[] = [
      { time: '09:00', duration: 30, notes: { nl: 'Vrije tijd', en: 'Free time' } },
      { time: '10:00', duration: 60, attractionId: 'a1' },
    ];
    const result = recalculateTimes(activities);
    expect(result[0].time).toBe('09:00');
    // 09:00 + 30 + 15 = 09:45
    expect(result[1].time).toBe('09:45');
  });

  it('does not mutate original activities', () => {
    const activities: Activity[] = [
      { time: '09:00', duration: 60, attractionId: 'a1' },
      { time: '14:00', duration: 30, attractionId: 'a2' },
    ];
    const originalSecondTime = activities[1].time;
    recalculateTimes(activities);
    expect(activities[1].time).toBe(originalSecondTime);
  });
});
