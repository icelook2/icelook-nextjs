/**
 * Pure utility functions for time calculations.
 * All times are in "HH:MM" format unless otherwise specified.
 */

import type {
  SlotDuration,
  TimeRange,
  TimeSlot,
  WorkingDayWithBreaks,
} from "./types";

// ============================================================================
// Time Parsing & Formatting
// ============================================================================

/**
 * Parse "HH:MM" or "HH:MM:SS" string to hours and minutes.
 */
export function parseTime(time: string): { hours: number; minutes: number } {
  const [hoursStr, minutesStr] = time.split(":");
  return {
    hours: Number.parseInt(hoursStr, 10),
    minutes: Number.parseInt(minutesStr, 10),
  };
}

/**
 * Format hours and minutes to "HH:MM" string.
 */
export function formatTime(hours: number, minutes: number): string {
  const h = hours.toString().padStart(2, "0");
  const m = minutes.toString().padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Convert "HH:MM" to total minutes since midnight.
 */
export function timeToMinutes(time: string): number {
  const { hours, minutes } = parseTime(time);
  return hours * 60 + minutes;
}

/**
 * Convert total minutes since midnight to "HH:MM".
 */
export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return formatTime(hours, minutes);
}

/**
 * Normalize database time format "HH:MM:SS" to "HH:MM".
 */
export function normalizeDbTime(dbTime: string): string {
  return dbTime.substring(0, 5);
}

// ============================================================================
// Time Arithmetic
// ============================================================================

/**
 * Add minutes to a time string.
 */
export function addMinutes(time: string, minutesToAdd: number): string {
  const totalMinutes = timeToMinutes(time) + minutesToAdd;
  return minutesToTime(totalMinutes);
}

/**
 * Get minutes between two times.
 */
export function getMinutesBetween(start: string, end: string): number {
  return timeToMinutes(end) - timeToMinutes(start);
}

// ============================================================================
// Time Comparisons
// ============================================================================

/**
 * Check if time is within a range (inclusive start, exclusive end).
 */
export function isTimeInRange(
  time: string,
  start: string,
  end: string,
): boolean {
  const t = timeToMinutes(time);
  const s = timeToMinutes(start);
  const e = timeToMinutes(end);
  return t >= s && t < e;
}

/**
 * Check if two time ranges overlap.
 */
export function doRangesOverlap(a: TimeRange, b: TimeRange): boolean {
  const aStart = timeToMinutes(a.start);
  const aEnd = timeToMinutes(a.end);
  const bStart = timeToMinutes(b.start);
  const bEnd = timeToMinutes(b.end);

  return aStart < bEnd && bStart < aEnd;
}

/**
 * Check if a range is completely within another range.
 */
export function isRangeWithin(inner: TimeRange, outer: TimeRange): boolean {
  const innerStart = timeToMinutes(inner.start);
  const innerEnd = timeToMinutes(inner.end);
  const outerStart = timeToMinutes(outer.start);
  const outerEnd = timeToMinutes(outer.end);

  return innerStart >= outerStart && innerEnd <= outerEnd;
}

/**
 * Compare times (for sorting). Returns negative if a < b, 0 if equal, positive if a > b.
 */
export function compareTimes(a: string, b: string): number {
  return timeToMinutes(a) - timeToMinutes(b);
}

// ============================================================================
// Slot Generation
// ============================================================================

/**
 * Generate time options for a picker (e.g., every 30 minutes).
 */
export function generateTimeOptions(
  startHour = 0,
  endHour = 24,
  intervalMinutes = 30,
): string[] {
  const options: string[] = [];
  let minutes = startHour * 60;
  const endMinutes = endHour * 60;

  while (minutes < endMinutes) {
    options.push(minutesToTime(minutes));
    minutes += intervalMinutes;
  }

  return options;
}

/**
 * Generate time slots for a working day.
 */
export function generateTimeSlots(options: {
  startTime: string;
  endTime: string;
  slotDuration: SlotDuration;
  breaks: TimeRange[];
  bookedSlots?: TimeRange[];
}): TimeSlot[] {
  const {
    startTime,
    endTime,
    slotDuration,
    breaks,
    bookedSlots = [],
  } = options;
  const slots: TimeSlot[] = [];

  let currentTime = startTime;
  const endMinutes = timeToMinutes(endTime);

  while (timeToMinutes(currentTime) + slotDuration <= endMinutes) {
    const slotEnd = addMinutes(currentTime, slotDuration);
    const slotRange: TimeRange = { start: currentTime, end: slotEnd };

    // Check if slot overlaps with any break
    const isOnBreak = breaks.some((breakRange) =>
      doRangesOverlap(slotRange, breakRange),
    );

    // Check if slot overlaps with any booked slot
    const isBooked = bookedSlots.some((booked) =>
      doRangesOverlap(slotRange, booked),
    );

    let blockedReason: TimeSlot["blockedReason"];
    if (isOnBreak) {
      blockedReason = "break";
    } else if (isBooked) {
      blockedReason = "booked";
    }

    slots.push({
      start: currentTime,
      end: slotEnd,
      available: !isOnBreak && !isBooked,
      blockedReason,
    });

    currentTime = slotEnd;
  }

  return slots;
}

/**
 * Generate time slots from a working day with breaks.
 */
export function generateSlotsFromWorkingDay(
  workingDay: WorkingDayWithBreaks,
  slotDuration: SlotDuration,
  bookedSlots: TimeRange[] = [],
): TimeSlot[] {
  const breaks: TimeRange[] = workingDay.working_day_breaks.map((b) => ({
    start: normalizeDbTime(b.start_time),
    end: normalizeDbTime(b.end_time),
  }));

  return generateTimeSlots({
    startTime: normalizeDbTime(workingDay.start_time),
    endTime: normalizeDbTime(workingDay.end_time),
    slotDuration,
    breaks,
    bookedSlots,
  });
}

// ============================================================================
// Break Validation
// ============================================================================

/**
 * Validate that breaks don't overlap each other.
 */
export function validateBreaksNoOverlap(breaks: TimeRange[]): boolean {
  for (let i = 0; i < breaks.length; i++) {
    for (let j = i + 1; j < breaks.length; j++) {
      if (doRangesOverlap(breaks[i], breaks[j])) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Validate all breaks are within working hours.
 */
export function validateBreaksWithinHours(
  breaks: TimeRange[],
  workingHours: TimeRange,
): boolean {
  return breaks.every((breakRange) => isRangeWithin(breakRange, workingHours));
}

/**
 * Sort breaks by start time.
 */
export function sortBreaks(breaks: TimeRange[]): TimeRange[] {
  return [...breaks].sort((a, b) => compareTimes(a.start, b.start));
}
