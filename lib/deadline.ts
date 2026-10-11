const formatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDeadline(deadline: Date) {
  return formatter.format(deadline);
}

export function formatTimeLeft(deadline: Date, now: Date = new Date()) {
  const ms = deadline.getTime() - now.getTime();
  if (ms <= 0) return "Overdue";

  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  return days > 0 ? `${days}d ${hours}h` : `${hours}h ${minutes}m`;
}
