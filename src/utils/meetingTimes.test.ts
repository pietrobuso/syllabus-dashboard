import { describe, it, expect } from "vitest";
import { nextOccurrence, occurrencesInRange, nthOccurrence, formatTime12h } from "./meetingTimes";
import { MeetingTime } from "@/types/course";

// Wednesday 2026-01-07
const WEDNESDAY = new Date(2026, 0, 7, 9, 0, 0, 0);

describe("nextOccurrence", () => {
  it("returns later this same day when the start time hasn't passed yet", () => {
    const meeting: MeetingTime = { day: "wednesday", start_time: "14:00", end_time: "15:20" };
    const result = nextOccurrence(meeting, WEDNESDAY);
    expect(result?.getDate()).toBe(7);
    expect(result?.getHours()).toBe(14);
  });

  it("rolls over to next week when today's start time has already passed", () => {
    const meeting: MeetingTime = { day: "wednesday", start_time: "08:00", end_time: "09:00" };
    const result = nextOccurrence(meeting, WEDNESDAY);
    expect(result?.getDate()).toBe(14);
  });

  it("finds the next matching weekday", () => {
    const meeting: MeetingTime = { day: "friday", start_time: "10:00", end_time: "10:50" };
    const result = nextOccurrence(meeting, WEDNESDAY);
    expect(result?.getDate()).toBe(9); // Friday two days later
  });

  it("returns null for an unparseable day or time", () => {
    expect(nextOccurrence({ day: "someday" as MeetingTime["day"], start_time: "10:00", end_time: "11:00" }, WEDNESDAY)).toBeNull();
    expect(nextOccurrence({ day: "monday", start_time: "not-a-time", end_time: "11:00" }, WEDNESDAY)).toBeNull();
  });
});

describe("occurrencesInRange", () => {
  it("expands a weekly meeting into one entry per week in range", () => {
    const meeting: MeetingTime = { day: "monday", start_time: "10:00", end_time: "11:00" };
    const rangeStart = new Date(2026, 0, 1); // Thursday
    const rangeEnd = new Date(2026, 0, 31);
    const occurrences = occurrencesInRange([meeting], rangeStart, rangeEnd);
    // Mondays in Jan 2026: 5, 12, 19, 26
    expect(occurrences.map((o) => o.date.getDate())).toEqual([5, 12, 19, 26]);
  });

  it("skips meetings with invalid day/time instead of throwing", () => {
    const meetings: MeetingTime[] = [
      { day: "invalid" as MeetingTime["day"], start_time: "10:00", end_time: "11:00" },
      { day: "tuesday", start_time: "10:00", end_time: "11:00" },
    ];
    const occurrences = occurrencesInRange(meetings, new Date(2026, 0, 1), new Date(2026, 0, 7));
    expect(occurrences).toHaveLength(1);
  });
});

describe("nthOccurrence", () => {
  const monday = new Date(2026, 0, 5, 0, 0, 0, 0); // Monday 2026-01-05

  it("counts sessions across all meeting days for a twice-a-week class", () => {
    const meetings: MeetingTime[] = [
      { day: "monday", start_time: "10:00", end_time: "11:00" },
      { day: "wednesday", start_time: "10:00", end_time: "11:00" },
    ];
    expect(nthOccurrence(meetings, monday, 1)?.getDate()).toBe(5);
    expect(nthOccurrence(meetings, monday, 2)?.getDate()).toBe(7);
    expect(nthOccurrence(meetings, monday, 3)?.getDate()).toBe(12);
  });

  it("advances a week per session for a once-a-week class", () => {
    const meetings: MeetingTime[] = [{ day: "monday", start_time: "10:00", end_time: "11:00" }];
    expect(nthOccurrence(meetings, monday, 4)?.getDate()).toBe(26);
  });

  it("stays correct far into the term", () => {
    const meetings: MeetingTime[] = [{ day: "monday", start_time: "10:00", end_time: "11:00" }];
    const session15 = nthOccurrence(meetings, monday, 15);
    // 14 weeks after Jan 5 2026 = April 13 2026
    expect(session15?.getMonth()).toBe(3);
    expect(session15?.getDate()).toBe(13);
  });

  it("returns null for n < 1 or when there are no meeting times", () => {
    const meetings: MeetingTime[] = [{ day: "monday", start_time: "10:00", end_time: "11:00" }];
    expect(nthOccurrence(meetings, monday, 0)).toBeNull();
    expect(nthOccurrence([], monday, 1)).toBeNull();
  });
});

describe("formatTime12h", () => {
  it("formats 24h times as 12h with AM/PM", () => {
    expect(formatTime12h("14:00")).toBe("2:00 PM");
    expect(formatTime12h("09:05")).toBe("9:05 AM");
    expect(formatTime12h("00:00")).toBe("12:00 AM");
    expect(formatTime12h("12:00")).toBe("12:00 PM");
  });
});
