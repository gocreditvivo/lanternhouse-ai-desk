import { describe, expect, it } from 'vitest';
import {
  dayKeyInTimeZone,
  recentDayKeys,
  safeTimeZone,
  startOfDayUtc,
} from '@/lib/dashboard/zoned-time';

const NY = 'America/New_York';

describe('safeTimeZone', () => {
  it('keeps a valid IANA zone', () => {
    expect(safeTimeZone(NY)).toBe(NY);
  });

  it('falls back to UTC for null or garbage', () => {
    expect(safeTimeZone(null)).toBe('UTC');
    expect(safeTimeZone('Mars/Olympus_Mons')).toBe('UTC');
  });
});

describe('dayKeyInTimeZone', () => {
  it('assigns a late-evening local time to the local day, not the UTC day', () => {
    // 2026-03-10T01:30:00Z is 8:30pm on 2026-03-09 in New York. Bucketing on
    // the UTC date would fold the dinner rush into the next day's counts.
    const instant = new Date('2026-03-10T01:30:00Z');
    expect(dayKeyInTimeZone(instant, NY)).toBe('2026-03-09');
    expect(dayKeyInTimeZone(instant, 'UTC')).toBe('2026-03-10');
  });
});

describe('startOfDayUtc', () => {
  it('resolves local midnight during EST', () => {
    expect(startOfDayUtc('2026-01-15', NY).toISOString()).toBe('2026-01-15T05:00:00.000Z');
  });

  it('resolves local midnight during EDT', () => {
    expect(startOfDayUtc('2026-07-15', NY).toISOString()).toBe('2026-07-15T04:00:00.000Z');
  });

  it('resolves local midnight on the spring-forward day', () => {
    // DST starts at 2am local on 2026-03-08, so midnight is still EST (-05:00).
    expect(startOfDayUtc('2026-03-08', NY).toISOString()).toBe('2026-03-08T05:00:00.000Z');
  });

  it('resolves local midnight on the fall-back day', () => {
    // DST ends at 2am local on 2026-11-01, so midnight is still EDT (-04:00).
    expect(startOfDayUtc('2026-11-01', NY).toISOString()).toBe('2026-11-01T04:00:00.000Z');
  });
});

describe('recentDayKeys', () => {
  it('returns consecutive ascending days ending today', () => {
    const keys = recentDayKeys(7, NY, new Date('2026-07-15T16:00:00Z'));
    expect(keys).toEqual([
      '2026-07-09',
      '2026-07-10',
      '2026-07-11',
      '2026-07-12',
      '2026-07-13',
      '2026-07-14',
      '2026-07-15',
    ]);
  });

  it('does not skip or repeat a date across a DST transition', () => {
    const keys = recentDayKeys(7, NY, new Date('2026-03-11T16:00:00Z'));
    expect(keys).toEqual([
      '2026-03-05',
      '2026-03-06',
      '2026-03-07',
      '2026-03-08',
      '2026-03-09',
      '2026-03-10',
      '2026-03-11',
    ]);
    expect(new Set(keys).size).toBe(7);
  });
});
