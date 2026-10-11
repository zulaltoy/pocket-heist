import { describe, it, expect } from "vitest";

import { formatDeadline, formatTimeLeft } from "@/lib/deadline";

const now = new Date(2026, 11, 4, 10, 18);
const later = (minutes: number) => new Date(now.getTime() + minutes * 60000);

describe("formatTimeLeft", () => {
  it("returns Overdue once the deadline has passed", () => {
    expect(formatTimeLeft(later(-1), now)).toBe("Overdue");
    expect(formatTimeLeft(now, now)).toBe("Overdue");
  });

  it("shows hours and minutes when less than a day is left", () => {
    expect(formatTimeLeft(later(4 * 60 + 42), now)).toBe("4h 42m");
  });

  it("shows days and hours when a day or more is left", () => {
    expect(formatTimeLeft(later(24 * 60), now)).toBe("1d 0h");
    expect(formatTimeLeft(later(47 * 60 + 59), now)).toBe("1d 23h");
  });
});

describe("formatDeadline", () => {
  it("formats as short month, day and 12-hour time", () => {
    expect(formatDeadline(new Date(2026, 11, 4, 15, 0))).toBe(
      "Dec 4, 03:00 PM",
    );
  });
});
