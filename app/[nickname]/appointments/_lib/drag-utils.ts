import { minutesToTime, timesOverlap, timeToMinutes } from "./time-utils";
import type { Appointment, GridConfig, WorkingDayWithBreaks } from "./types";

/** Default snap interval in minutes */
export const DEFAULT_SNAP_INTERVAL = 15;

/**
 * Snap minutes to the nearest interval
 */
export function snapToInterval(
  minutes: number,
  interval: number = DEFAULT_SNAP_INTERVAL,
): number {
  return Math.round(minutes / interval) * interval;
}

/**
 * Snap a time string to the nearest interval
 */
export function snapTimeToInterval(
  time: string,
  interval: number = DEFAULT_SNAP_INTERVAL,
): string {
  const minutes = timeToMinutes(time);
  const snapped = snapToInterval(minutes, interval);
  return minutesToTime(snapped);
}

/**
 * Calculate time from a Y position within a grid element
 */
export function calculateTimeFromY(
  y: number,
  gridRect: DOMRect,
  config: GridConfig,
  snapInterval: number = DEFAULT_SNAP_INTERVAL,
): string {
  // Calculate relative position (0-1)
  const relativeY = Math.max(0, Math.min(y - gridRect.top, gridRect.height));
  const percentage = relativeY / gridRect.height;

  // Convert to minutes
  const totalMinutes = (config.endHour - config.startHour) * 60;
  const rawMinutes = config.startHour * 60 + percentage * totalMinutes;

  // Snap to interval
  const snappedMinutes = snapToInterval(rawMinutes, snapInterval);

  // Clamp to grid bounds
  const minMinutes = config.startHour * 60;
  const maxMinutes = config.endHour * 60;
  const clampedMinutes = Math.max(
    minMinutes,
    Math.min(snappedMinutes, maxMinutes),
  );

  return minutesToTime(clampedMinutes);
}

/**
 * Calculate new time based on Y delta from drag start
 * This is used for "rail-based" dragging where we apply the movement delta
 * to the original position rather than using absolute cursor position.
 */
export function calculateTimeFromDelta(
  deltaY: number,
  gridHeight: number,
  originalStartMinutes: number,
  config: GridConfig,
  snapInterval: number = DEFAULT_SNAP_INTERVAL,
): string {
  // Convert Y delta to minutes delta
  const totalGridMinutes = (config.endHour - config.startHour) * 60;
  const deltaMinutes = (deltaY / gridHeight) * totalGridMinutes;

  // Apply delta to original position
  const newMinutes = originalStartMinutes + deltaMinutes;

  // Snap to interval
  const snappedMinutes = snapToInterval(newMinutes, snapInterval);

  // Clamp to grid bounds
  const minMinutes = config.startHour * 60;
  const maxMinutes = config.endHour * 60;
  const clampedMinutes = Math.max(
    minMinutes,
    Math.min(snappedMinutes, maxMinutes),
  );

  return minutesToTime(clampedMinutes);
}

/**
 * Calculate day index from an X position within a grid element
 */
export function calculateDayIndexFromX(
  x: number,
  gridRect: DOMRect,
  dayCount: number,
): number {
  const relativeX = Math.max(0, Math.min(x - gridRect.left, gridRect.width));
  const dayWidth = gridRect.width / dayCount;
  const dayIndex = Math.floor(relativeX / dayWidth);
  return Math.max(0, Math.min(dayIndex, dayCount - 1));
}

/**
 * Get date string from day index
 */
export function getDateFromIndex(dates: Date[], index: number): string {
  const date = dates[Math.max(0, Math.min(index, dates.length - 1))];
  return date.toISOString().split("T")[0];
}

/**
 * Calculate new appointment times when dragging
 * Preserves the original duration
 */
export function calculateDraggedTimes(
  originalStartTime: string,
  originalEndTime: string,
  newStartTime: string,
): { startTime: string; endTime: string } {
  const originalDuration =
    timeToMinutes(originalEndTime) - timeToMinutes(originalStartTime);
  const newStartMinutes = timeToMinutes(newStartTime);
  const newEndMinutes = newStartMinutes + originalDuration;

  return {
    startTime: newStartTime,
    endTime: minutesToTime(newEndMinutes),
  };
}

/**
 * Calculate new times when resizing from the start edge
 */
export function calculateResizeStartTimes(
  newStartTime: string,
  originalEndTime: string,
  minDuration: number = 15,
): { startTime: string; endTime: string } | null {
  const startMinutes = timeToMinutes(newStartTime);
  const endMinutes = timeToMinutes(originalEndTime);

  // Ensure minimum duration
  if (endMinutes - startMinutes < minDuration) {
    return null;
  }

  return {
    startTime: newStartTime,
    endTime: originalEndTime,
  };
}

/**
 * Calculate new times when resizing from the end edge
 */
export function calculateResizeEndTimes(
  originalStartTime: string,
  newEndTime: string,
  minDuration: number = 15,
): { startTime: string; endTime: string } | null {
  const startMinutes = timeToMinutes(originalStartTime);
  const endMinutes = timeToMinutes(newEndTime);

  // Ensure minimum duration
  if (endMinutes - startMinutes < minDuration) {
    return null;
  }

  return {
    startTime: originalStartTime,
    endTime: newEndTime,
  };
}

/**
 * Check if a time slot conflicts with existing appointments
 */
export function checkAppointmentConflict(
  date: string,
  startTime: string,
  endTime: string,
  appointments: Appointment[],
  excludeAppointmentId?: string,
): { hasConflict: boolean; conflictReason: string | null } {
  const conflictingAppointment = appointments.find((apt) => {
    // Skip the appointment being dragged
    if (excludeAppointmentId && apt.id === excludeAppointmentId) {
      return false;
    }

    // Skip cancelled/no-show appointments
    if (apt.status === "cancelled" || apt.status === "no_show") {
      return false;
    }

    // Check same date
    if (apt.date !== date) {
      return false;
    }

    // Check time overlap
    return timesOverlap(startTime, endTime, apt.start_time, apt.end_time);
  });

  if (conflictingAppointment) {
    return {
      hasConflict: true,
      conflictReason: `Conflicts with ${conflictingAppointment.client_name}'s appointment`,
    };
  }

  return { hasConflict: false, conflictReason: null };
}

/**
 * Check if a time slot is within working hours
 */
export function checkWithinWorkingHours(
  date: string,
  startTime: string,
  endTime: string,
  workingDays: WorkingDayWithBreaks[],
): { isValid: boolean; reason: string | null } {
  const workingDay = workingDays.find((wd) => wd.date === date);

  if (!workingDay) {
    return { isValid: false, reason: "Not a working day" };
  }

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const workStart = timeToMinutes(workingDay.start_time);
  const workEnd = timeToMinutes(workingDay.end_time);

  if (startMinutes < workStart || endMinutes > workEnd) {
    return { isValid: false, reason: "Outside working hours" };
  }

  // Check if overlaps with breaks
  for (const breakPeriod of workingDay.breaks) {
    if (
      timesOverlap(
        startTime,
        endTime,
        breakPeriod.start_time,
        breakPeriod.end_time,
      )
    ) {
      return { isValid: false, reason: "Conflicts with break time" };
    }
  }

  return { isValid: true, reason: null };
}

/**
 * Combined validation for drag position
 */
export function validateDragPosition(
  date: string,
  startTime: string,
  endTime: string,
  appointments: Appointment[],
  workingDays: WorkingDayWithBreaks[],
  excludeAppointmentId?: string,
): { isValid: boolean; reason: string | null } {
  // Check working hours
  const workingHoursCheck = checkWithinWorkingHours(
    date,
    startTime,
    endTime,
    workingDays,
  );
  if (!workingHoursCheck.isValid) {
    return workingHoursCheck;
  }

  // Check appointment conflicts
  const conflictCheck = checkAppointmentConflict(
    date,
    startTime,
    endTime,
    appointments,
    excludeAppointmentId,
  );
  if (conflictCheck.hasConflict) {
    return { isValid: false, reason: conflictCheck.conflictReason };
  }

  return { isValid: true, reason: null };
}
