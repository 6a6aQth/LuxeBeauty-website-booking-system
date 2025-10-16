// Time parsing/formatting helpers for HH:mm strings

export type MinutesSinceMidnight = number;

export function parseTimeToMinutes(time: string): MinutesSinceMidnight {
  // expects "HH:mm" 24h format
  const [h, m] = time.split(":").map((v) => parseInt(v, 10));
  return h * 60 + m;
}

export function formatMinutesToTime(minutes: MinutesSinceMidnight): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hh = h.toString().padStart(2, "0");
  const mm = m.toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

export function clampToWindow(
  start: MinutesSinceMidnight,
  end: MinutesSinceMidnight,
  windowStart: MinutesSinceMidnight,
  windowEnd: MinutesSinceMidnight
): { start: MinutesSinceMidnight; end: MinutesSinceMidnight } | null {
  const s = Math.max(start, windowStart);
  const e = Math.min(end, windowEnd);
  if (e <= s) return null;
  return { start: s, end: e };
}


