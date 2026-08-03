import { MeetingTime } from "@/types/course";

const DAY_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const parseTime = (time: string): { hours: number; minutes: number } | null => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
};

/**
 * Next date/time this meeting occurs on or after `from` (inclusive of `from`
 * itself if the meeting's start time hasn't passed yet that day).
 * Returns null if the meeting's day/time can't be parsed.
 */
export const nextOccurrence = (meeting: MeetingTime, from: Date): Date | null => {
  const targetDay = DAY_INDEX[meeting.day];
  const time = parseTime(meeting.start_time);
  if (targetDay === undefined || !time) return null;

  const candidate = new Date(from);
  candidate.setHours(time.hours, time.minutes, 0, 0);

  let dayDiff = targetDay - from.getDay();
  if (dayDiff < 0 || (dayDiff === 0 && candidate < from)) {
    dayDiff += 7;
  }
  candidate.setDate(candidate.getDate() + dayDiff);
  return candidate;
};

export interface MeetingOccurrence {
  date: Date;
  meeting: MeetingTime;
}

/**
 * Every occurrence of every given meeting time within [rangeStart, rangeEnd],
 * inclusive. Meetings with an unparseable day/time are silently skipped.
 */
export const occurrencesInRange = (
  meetings: MeetingTime[],
  rangeStart: Date,
  rangeEnd: Date
): MeetingOccurrence[] => {
  const occurrences: MeetingOccurrence[] = [];

  meetings.forEach((meeting) => {
    const targetDay = DAY_INDEX[meeting.day];
    const time = parseTime(meeting.start_time);
    if (targetDay === undefined || !time) return;

    const cursor = new Date(rangeStart);
    cursor.setHours(time.hours, time.minutes, 0, 0);
    let dayDiff = targetDay - rangeStart.getDay();
    if (dayDiff < 0) dayDiff += 7;
    cursor.setDate(cursor.getDate() + dayDiff);

    while (cursor <= rangeEnd) {
      occurrences.push({ date: new Date(cursor), meeting });
      cursor.setDate(cursor.getDate() + 7);
    }
  });

  return occurrences.sort((a, b) => a.date.getTime() - b.date.getTime());
};

/**
 * The nth (1-based) time this class meets on or after `from`, counting
 * across all of its meeting times. For a Mon/Wed class starting on a
 * Monday: n=1 is that Monday, n=2 is Wednesday, n=3 is the next Monday.
 * Returns null if n < 1 or no meeting time is usable.
 */
export const nthOccurrence = (
  meetings: MeetingTime[],
  from: Date,
  n: number
): Date | null => {
  if (n < 1 || meetings.length === 0) return null;

  // n sessions never span more than n weeks (worst case: one meeting per
  // week), so this window is always wide enough. +14d absorbs the partial
  // week at the start.
  const rangeEnd = new Date(from);
  rangeEnd.setDate(rangeEnd.getDate() + n * 7 + 14);

  const occurrences = occurrencesInRange(meetings, from, rangeEnd);
  return occurrences[n - 1]?.date ?? null;
};

export const formatTime12h = (time: string): string => {
  const parsed = parseTime(time);
  if (!parsed) return time;
  const period = parsed.hours >= 12 ? "PM" : "AM";
  const hour12 = parsed.hours % 12 === 0 ? 12 : parsed.hours % 12;
  return `${hour12}:${parsed.minutes.toString().padStart(2, "0")} ${period}`;
};
