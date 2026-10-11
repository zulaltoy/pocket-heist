const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

// Formats the time between now and a deadline, e.g. "47h 12m" or "5m 30s".
// Returns null once the deadline has passed.
export function formatTimeLeft(deadline: Date, now: Date): string | null {
  const ms = deadline.getTime() - now.getTime();
  if (ms <= 0) return null;

  const hours = Math.floor(ms / HOUR_MS);
  const minutes = Math.floor((ms % HOUR_MS) / MINUTE_MS);
  const seconds = Math.floor((ms % MINUTE_MS) / 1000);

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}
