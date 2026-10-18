import { addIsoDays, isIsoDate } from "./decimal.js";
import type { FreshnessStatus } from "./policy.js";

export type VerifiedReleaseCalendar = {
  verified: boolean;
  expectedWeekdays: readonly number[];
  excludedDates: readonly string[];
  deadlineOffsetDays: number;
  deadlineMinutesUtc: number;
};

export type FreshnessInput = {
  hasObservation: boolean;
  observedDate: string | null;
  calendar: VerifiedReleaseCalendar | null;
  now: Date;
};

function deadlineInstant(observedDate: string, calendar: VerifiedReleaseCalendar): Date {
  const deadlineDate = addIsoDays(observedDate, calendar.deadlineOffsetDays);
  const [year, month, day] = deadlineDate.split("-").map(Number);
  const hours = Math.floor(calendar.deadlineMinutesUtc / 60);
  const minutes = calendar.deadlineMinutesUtc % 60;
  return new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1, hours, minutes, 0, 0));
}

function calendarUsable(calendar: VerifiedReleaseCalendar | null): calendar is VerifiedReleaseCalendar {
  if (calendar === null || calendar.verified !== true) return false;
  if (!Number.isInteger(calendar.deadlineOffsetDays) || calendar.deadlineOffsetDays < 0 || calendar.deadlineOffsetDays > 14) return false;
  if (!Number.isInteger(calendar.deadlineMinutesUtc) || calendar.deadlineMinutesUtc < 0 || calendar.deadlineMinutesUtc >= 24 * 60) return false;
  if (calendar.expectedWeekdays.length === 0) return false;
  return calendar.expectedWeekdays.every((day) => Number.isInteger(day) && day >= 0 && day <= 6);
}

export function countMissedVerifiedPeriods(observedDate: string, calendar: VerifiedReleaseCalendar, now: Date): number {
  const excluded = new Set(calendar.excludedDates.filter(isIsoDate));
  const expected = new Set(calendar.expectedWeekdays);
  const today = now.toISOString().slice(0, 10);
  let cursor = addIsoDays(observedDate, 1);
  let missed = 0;
  while (cursor <= today) {
    const weekday = new Date(`${cursor}T00:00:00.000Z`).getUTCDay();
    const isExpected = expected.has(weekday) && !excluded.has(cursor);
    if (isExpected && deadlineInstant(cursor, calendar).getTime() <= now.getTime()) {
      missed += 1;
    }
    cursor = addIsoDays(cursor, 1);
  }
  return missed;
}

export function evaluateFreshness(input: FreshnessInput): FreshnessStatus {
  if (!input.hasObservation || input.observedDate === null || !isIsoDate(input.observedDate)) return "UNAVAILABLE";
  if (!calendarUsable(input.calendar)) return "UNKNOWN";
  const missed = countMissedVerifiedPeriods(input.observedDate, input.calendar, input.now);
  return missed >= 2 ? "STALE" : "FRESH";
}
