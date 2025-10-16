import { parseTimeToMinutes, formatMinutesToTime } from '@/lib/time-utils';

export type SessionPreference = 'morning' | 'afternoon';

// Business hours
const DAY_START = parseTimeToMinutes('08:00');
const DAY_END = parseTimeToMinutes('16:30');
const BREAK_MINUTES = 10;

export interface AllocationInput {
  // durations per selected service (in minutes)
  serviceDurations: number[];
  // explicit total duration (optional; computed from serviceDurations if omitted)
  totalDurationMinutes?: number;
  // preferred session
  preference: SessionPreference;
  // existing allocations for the day as [start,end) minutes since midnight
  existingAllocations?: Array<{ start: number; end: number }>;
}

export interface AllocationResult {
  ok: boolean;
  // Allocated start/end if ok
  start?: string;
  end?: string;
  // If not ok, reason and suggestions
  reason?: string;
  remainingMinutes?: number;
  // List of service indexes (from input) that could fit into remaining time
  fitServiceIndexes?: number[];
}

function getWindowForPreference(pref: SessionPreference) {
  if (pref === 'morning') {
    // 08:00 to 12:00 assumed morning; leave configurable later if needed
    return { start: DAY_START, end: parseTimeToMinutes('12:00') };
  }
  // afternoon 12:00 to 16:30
  return { start: parseTimeToMinutes('12:00'), end: DAY_END };
}

function subtractAllocations(
  windowStart: number,
  windowEnd: number,
  allocations: Array<{ start: number; end: number }>
): Array<{ start: number; end: number }> {
  // Returns free intervals within [windowStart, windowEnd)
  const blocks = allocations
    .map((a) => ({ start: Math.max(a.start, windowStart), end: Math.min(a.end, windowEnd) }))
    .filter((a) => a.end > a.start)
    .sort((a, b) => a.start - b.start);

  const free: Array<{ start: number; end: number }> = [];
  let cursor = windowStart;
  for (const b of blocks) {
    if (b.start > cursor) free.push({ start: cursor, end: b.start });
    cursor = Math.max(cursor, b.end);
  }
  if (cursor < windowEnd) free.push({ start: cursor, end: windowEnd });
  return free;
}

export function allocateDuration(input: AllocationInput): AllocationResult {
  const total =
    input.totalDurationMinutes ?? input.serviceDurations.reduce((sum, d) => sum + d, 0);

  // Add a single 10-minute break at the end of the block for cleanup/turnover
  const required = total + BREAK_MINUTES;

  const { start: prefStart, end: prefEnd } = getWindowForPreference(input.preference);

  const existing = input.existingAllocations ?? [];
  const freeBlocks = subtractAllocations(prefStart, prefEnd, existing);

  for (const block of freeBlocks) {
    const blockDuration = block.end - block.start;
    if (blockDuration >= required) {
      // Allocate from the start of the free block
      const start = block.start;
      const end = start + required;
      return {
        ok: true,
        start: formatMinutesToTime(start),
        end: formatMinutesToTime(end),
      };
    }
  }

  // Could not fit in preferred window, compute remaining time in the largest free block
  let maxFree = 0;
  for (const b of freeBlocks) maxFree = Math.max(maxFree, b.end - b.start);

  const remaining = Math.max(0, required - maxFree);

  // Suggest which single service could fit into the largest free window (excluding break)
  const fitIndexes: number[] = [];
  for (let i = 0; i < input.serviceDurations.length; i++) {
    if (input.serviceDurations[i] <= Math.max(0, maxFree - BREAK_MINUTES)) {
      fitIndexes.push(i);
    }
  }

  return {
    ok: false,
    reason: 'Insufficient time in the selected session',
    remainingMinutes: remaining,
    fitServiceIndexes: fitIndexes,
  };
}


