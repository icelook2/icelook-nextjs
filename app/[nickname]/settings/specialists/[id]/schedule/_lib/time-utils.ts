import type { GridConfig, TimeSlot } from "./types";

/**
 * Parse time string "HH:MM" or "HH:MM:SS" to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const parts = time.split(":");
  const hours = Number.parseInt(parts[0], 10);
  const minutes = Number.parseInt(parts[1], 10);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to "HH:MM" format
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

/**
 * Calculate pixel position from time string
 */
export function timeToPixels(
  time: string,
  config: Pick<GridConfig, "startHour" | "pixelsPerHour">,
): number {
  const minutes = timeToMinutes(time);
  const startMinutes = config.startHour * 60;
  const offsetMinutes = minutes - startMinutes;
  return (offsetMinutes / 60) * config.pixelsPerHour;
}

/**
 * Calculate percentage offset from grid top (0-100)
 */
export function timeToPercentage(
  time: string,
  config: Pick<GridConfig, "startHour" | "endHour">,
): number {
  const minutes = timeToMinutes(time);
  const startMinutes = config.startHour * 60;
  const endMinutes = config.endHour * 60;
  const totalMinutes = endMinutes - startMinutes;
  const offsetMinutes = minutes - startMinutes;
  return (offsetMinutes / totalMinutes) * 100;
}

/**
 * Generate time slots for the grid
 */
export function generateTimeSlots(config: GridConfig): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const totalMinutes = (config.endHour - config.startHour) * 60;

  for (
    let offset = 0;
    offset <= totalMinutes;
    offset += config.intervalMinutes
  ) {
    const totalMins = config.startHour * 60 + offset;
    const hour = Math.floor(totalMins / 60);
    const minute = totalMins % 60;

    slots.push({
      hour,
      minute,
      label: formatTimeForDisplay(
        `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
      ),
      topOffset: (offset / totalMinutes) * 100,
    });
  }

  return slots;
}

/**
 * Format time for display based on locale preference
 * For now, uses 24-hour format; can be extended to use system locale
 */
export function formatTimeForDisplay(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);

  // Check if user prefers 12-hour format (can be extended with locale detection)
  const use12Hour = false; // TODO: Make configurable

  if (use12Hour) {
    const period = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 || 12;
    return minutes === 0
      ? `${displayHour} ${period}`
      : `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
  }

  return minutes === 0
    ? `${hours}:00`
    : `${hours}:${minutes.toString().padStart(2, "0")}`;
}

/**
 * Check if two time ranges overlap
 */
export function timesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string,
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  return s1 < e2 && s2 < e1;
}

/**
 * Check if time is within a range
 */
export function isTimeInRange(
  time: string,
  rangeStart: string,
  rangeEnd: string,
): boolean {
  const t = timeToMinutes(time);
  const start = timeToMinutes(rangeStart);
  const end = timeToMinutes(rangeEnd);
  return t >= start && t < end;
}

/**
 * Calculate the height in pixels for a time duration
 */
export function durationToPixels(
  startTime: string,
  endTime: string,
  pixelsPerHour: number,
): number {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const durationMinutes = endMinutes - startMinutes;
  return (durationMinutes / 60) * pixelsPerHour;
}

/**
 * Calculate the total grid height based on configuration
 */
export function calculateGridHeight(config: GridConfig): number {
  return (config.endHour - config.startHour) * config.pixelsPerHour;
}

/**
 * Normalize time string to HH:MM format (strip seconds if present)
 */
export function normalizeTime(time: string): string {
  const parts = time.split(":");
  return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
}

/**
 * Add minutes to a time string
 */
export function addMinutesToTime(time: string, minutesToAdd: number): string {
  const totalMinutes = timeToMinutes(time) + minutesToAdd;
  return minutesToTime(totalMinutes);
}
