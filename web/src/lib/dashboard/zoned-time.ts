/**
 * Day boundaries in the business's own timezone.
 *
 * "Calls today" has to mean today where the restaurant is. Lantern House is
 * America/New_York, so a UTC midnight boundary would fold the previous
 * evening's dinner rush (8pm-midnight ET) into today's counts — the owner
 * opening the dashboard at 6pm would see roughly double.
 */

function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function safeTimeZone(timeZone: string | null | undefined): string {
  return timeZone && isValidTimeZone(timeZone) ? timeZone : 'UTC';
}

/** How far ahead of UTC the zone is at this instant, in milliseconds. */
function offsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);

  const field: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') field[part.type] = part.value;
  }

  const asUtc = Date.UTC(
    Number(field.year),
    Number(field.month) - 1,
    Number(field.day),
    // Some engines render midnight as hour 24 under hour12: false.
    Number(field.hour) % 24,
    Number(field.minute),
    Number(field.second)
  );
  return asUtc - instant.getTime();
}

/** The calendar date at `instant` in `timeZone`, as YYYY-MM-DD. */
export function dayKeyInTimeZone(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

/** The UTC instant at which the given local calendar day begins. */
export function startOfDayUtc(dayKey: string, timeZone: string): Date {
  const [year, month, day] = dayKey.split('-').map(Number);
  const wallClock = Date.UTC(year, month - 1, day, 0, 0, 0);
  // The offset depends on the instant we are asking about, so seed with a
  // guess and refine once. The second pass settles DST transition days.
  const first = wallClock - offsetMs(new Date(wallClock), timeZone);
  return new Date(wallClock - offsetMs(new Date(first), timeZone));
}

/** Calendar day keys for the last `days` days in `timeZone`, oldest first. */
export function recentDayKeys(days: number, timeZone: string, now = new Date()): string[] {
  const todayStart = startOfDayUtc(dayKeyInTimeZone(now, timeZone), timeZone);
  const keys: string[] = [];
  for (let back = days - 1; back >= 0; back--) {
    // Step by whole days from a midday anchor so a 23- or 25-hour DST day
    // cannot skip or repeat a date.
    const anchor = new Date(todayStart.getTime() - back * 86_400_000 + 43_200_000);
    keys.push(dayKeyInTimeZone(anchor, timeZone));
  }
  return keys;
}
