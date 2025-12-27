/**
 * Slot Generation Utility
 *
 * Generates available time slots for booking based on
 * working hours, breaks, and existing appointments.
 */

import type {
  AppointmentData,
  TimeSlot,
  WorkingDayData,
} from "./booking-types";

// ============================================================================
// Time Utilities (copied from schedule utils for self-containment)
// ============================================================================

/**
 * Parse time string "HH:MM" to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const parts = time.split(":");
  const hours = Number.parseInt(parts[0], 10);
  const minutes = Number.parseInt(parts[1], 10);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to "HH:MM" format
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

/**
 * Check if two time ranges overlap
 */
function timesOverlap(
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

// ============================================================================
// Slot Generation
// ============================================================================

export interface GenerateSlotsOptions {
  /** Working day data for the selected date */
  workingDay: WorkingDayData | null;
  /** Existing appointments for conflict detection */
  appointments: AppointmentData[];
  /** Total duration of selected services in minutes */
  serviceDurationMinutes: number;
  /** Interval between slots (default: 30) */
  slotIntervalMinutes?: number;
  /** Minimum hours before now for booking */
  minNoticeHours?: number;
  /** Selected date */
  date: Date;
  /** Timezone (IANA format) */
  timezone: string;
}

/**
 * Generate available time slots for a given date.
 *
 * @param options - Slot generation options
 * @returns Array of time slots with availability status
 */
export function generateAvailableSlots(
  options: GenerateSlotsOptions,
): TimeSlot[] {
  const {
    workingDay,
    appointments,
    serviceDurationMinutes,
    slotIntervalMinutes = 30,
    minNoticeHours = 0,
    date,
    timezone,
  } = options;

  // No working day = no slots
  if (!workingDay) {
    return [];
  }

  const slots: TimeSlot[] = [];

  // Get current time in the specified timezone
  const now = new Date();
  const nowInTimezone = new Date(
    now.toLocaleString("en-US", { timeZone: timezone }),
  );

  // Check if the date is today
  const isToday = isSameDay(date, nowInTimezone);

  // Calculate minimum booking time (now + notice hours)
  const minBookingTime = isToday
    ? nowInTimezone.getHours() * 60 +
      nowInTimezone.getMinutes() +
      minNoticeHours * 60
    : 0;

  // Parse working hours
  const workStartMinutes = timeToMinutes(workingDay.startTime);
  const workEndMinutes = timeToMinutes(workingDay.endTime);

  // Generate slots from start to (end - service duration)
  const lastSlotStart = workEndMinutes - serviceDurationMinutes;

  for (
    let slotStart = workStartMinutes;
    slotStart <= lastSlotStart;
    slotStart += slotIntervalMinutes
  ) {
    const slotEnd = slotStart + serviceDurationMinutes;
    const slotTime = minutesToTime(slotStart);
    const slotEndTime = minutesToTime(slotEnd);

    // Check if slot is in the past (considering min notice)
    if (isToday && slotStart < minBookingTime) {
      slots.push({
        time: slotTime,
        available: false,
        reason: "past",
      });
      continue;
    }

    // Check if slot conflicts with breaks
    const conflictsWithBreak = workingDay.breaks.some((brk) =>
      timesOverlap(slotTime, slotEndTime, brk.startTime, brk.endTime),
    );
    if (conflictsWithBreak) {
      slots.push({
        time: slotTime,
        available: false,
        reason: "break",
      });
      continue;
    }

    // Check if slot conflicts with existing appointments
    // Note: appointments are already filtered to pending/confirmed in the server action
    const conflictsWithAppointment = appointments.some((apt) =>
      timesOverlap(slotTime, slotEndTime, apt.startTime, apt.endTime),
    );
    if (conflictsWithAppointment) {
      slots.push({
        time: slotTime,
        available: false,
        reason: "booked",
      });
      continue;
    }

    // Slot is available
    slots.push({
      time: slotTime,
      available: true,
    });
  }

  return slots;
}

/**
 * Check if two dates are the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Filter to only available slots
 */
export function getAvailableSlots(slots: TimeSlot[]): TimeSlot[] {
  return slots.filter((slot) => slot.available);
}

/**
 * Check if a date has any available slots
 */
export function hasAvailableSlots(slots: TimeSlot[]): boolean {
  return slots.some((slot) => slot.available);
}

/**
 * Format time for display (e.g., "14:30" or "2:30 PM")
 */
export function formatSlotTime(time: string, use12Hour = false): string {
  const [hours, minutes] = time.split(":").map(Number);

  if (use12Hour) {
    const period = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
  }

  return time;
}

/**
 * Calculate end time given start time and duration
 */
export function calculateEndTime(
  startTime: string,
  durationMinutes: number,
): string {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + durationMinutes;
  return minutesToTime(endMinutes);
}
