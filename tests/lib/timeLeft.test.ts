import { formatTimeLeft } from "@/lib/timeLeft";

const NOW = new Date("2026-10-09T12:00:00Z");
const inMs = (ms: number) => new Date(NOW.getTime() + ms);

describe("formatTimeLeft", () => {
  it("shows hours and minutes when more than an hour is left", () => {
    expect(formatTimeLeft(inMs((47 * 60 + 12) * 60 * 1000 + 30_000), NOW)).toBe(
      "47h 12m",
    );
  });

  it("shows minutes and seconds when under an hour is left", () => {
    expect(formatTimeLeft(inMs((5 * 60 + 30) * 1000), NOW)).toBe("5m 30s");
  });

  it("shows only seconds when under a minute is left", () => {
    expect(formatTimeLeft(inMs(9_000), NOW)).toBe("9s");
  });

  it("returns null once the deadline has passed", () => {
    expect(formatTimeLeft(NOW, NOW)).toBeNull();
    expect(formatTimeLeft(inMs(-1000), NOW)).toBeNull();
  });
});
