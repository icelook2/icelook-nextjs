import { toDateString } from "./date-utils";
import { timesOverlap, timeToMinutes } from "./time-utils";
import type {
  Appointment,
  WorkingDay,
  WorkingDayBreak,
  WorkingDayWithBreaks,
} from "./types";

/**
 * Find working day for a specific date
 */
export function findWorkingDayForDate(
  workingDays: WorkingDayWithBreaks[],
  date: Date | string,
): WorkingDayWithBreaks | null {
  const dateStr = typeof date === "string" ? date : toDateString(date);
  return workingDays.find((wd) => wd.date === dateStr) ?? null;
}

/**
 * Get appointments for a specific date
 */
export function getAppointmentsForDate(
  appointments: Appointment[],
  date: Date | string,
): Appointment[] {
  const dateStr = typeof date === "string" ? date : toDateString(date);
  return appointments.filter((apt) => apt.date === dateStr);
}

/**
 * Group working days by date for quick lookup
 */
export function groupWorkingDaysByDate(
  workingDays: WorkingDayWithBreaks[],
): Map<string, WorkingDayWithBreaks> {
  return new Map(workingDays.map((wd) => [wd.date, wd]));
}

/**
 * Group appointments by date for quick lookup
 */
export function groupAppointmentsByDate(
  appointments: Appointment[],
): Map<string, Appointment[]> {
  const grouped = new Map<string, Appointment[]>();

  for (const apt of appointments) {
    const existing = grouped.get(apt.date) ?? [];
    existing.push(apt);
    grouped.set(apt.date, existing);
  }

  return grouped;
}

/**
 * Check if a time slot conflicts with existing breaks
 */
export function conflictsWithBreaks(
  startTime: string,
  endTime: string,
  breaks: WorkingDayBreak[],
): boolean {
  return breaks.some((brk) =>
    timesOverlap(startTime, endTime, brk.start_time, brk.end_time),
  );
}

/**
 * Check if a time slot conflicts with existing appointments
 */
export function conflictsWithAppointments(
  startTime: string,
  endTime: string,
  appointments: Appointment[],
): boolean {
  return appointments.some(
    (apt) =>
      apt.status !== "cancelled" &&
      timesOverlap(startTime, endTime, apt.start_time, apt.end_time),
  );
}

/**
 * Check if a time slot is within working hours
 */
export function isWithinWorkingHours(
  startTime: string,
  endTime: string,
  workingDay: WorkingDay | null,
): boolean {
  if (!workingDay) {
    return false;
  }

  return (
    !timesOverlap(startTime, endTime, workingDay.end_time, "23:59") &&
    !timesOverlap(startTime, endTime, "00:00", workingDay.start_time)
  );
}

/**
 * Check if a time slot is available (not blocked by breaks or appointments)
 */
export function isSlotAvailable(
  date: string,
  startTime: string,
  endTime: string,
  workingDays: WorkingDayWithBreaks[],
  appointments: Appointment[],
): { available: boolean; reason?: string } {
  const workingDay = findWorkingDayForDate(workingDays, date);

  if (!workingDay) {
    return { available: false, reason: "No working hours set for this day" };
  }

  if (!isWithinWorkingHours(startTime, endTime, workingDay)) {
    return { available: false, reason: "Outside working hours" };
  }

  if (conflictsWithBreaks(startTime, endTime, workingDay.breaks)) {
    return { available: false, reason: "Conflicts with a break" };
  }

  const dayAppointments = getAppointmentsForDate(appointments, date);
  if (conflictsWithAppointments(startTime, endTime, dayAppointments)) {
    return { available: false, reason: "Conflicts with an appointment" };
  }

  return { available: true };
}

/**
 * Get appointment status color class
 */
export function getAppointmentStatusColor(status: Appointment["status"]): {
  bg: string;
  border: string;
  text: string;
} {
  switch (status) {
    case "pending":
      return {
        bg: "bg-yellow-50 dark:bg-yellow-900/20",
        border: "border-yellow-200 dark:border-yellow-700",
        text: "text-yellow-700 dark:text-yellow-300",
      };
    case "confirmed":
      return {
        bg: "bg-green-50 dark:bg-green-900/20",
        border: "border-green-200 dark:border-green-700",
        text: "text-green-700 dark:text-green-300",
      };
    case "completed":
      return {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        border: "border-blue-200 dark:border-blue-700",
        text: "text-blue-700 dark:text-blue-300",
      };
    case "cancelled":
    case "no_show":
      return {
        bg: "bg-gray-50 dark:bg-gray-900/20",
        border: "border-gray-200 dark:border-gray-700",
        text: "text-gray-500 dark:text-gray-400",
      };
  }
}

/**
 * Get appointment color based on time (past, current, future)
 */
export function getAppointmentTimeColor(
  date: string,
  startTime: string,
  endTime: string,
): {
  bg: string;
  border: string;
  text: string;
  type: "past" | "current" | "future";
} {
  const now = new Date();
  const todayStr = toDateString(now);

  // Different day comparison
  if (date < todayStr) {
    return {
      bg: "bg-muted/50 dark:bg-muted/30",
      border: "border-border",
      text: "text-muted-foreground",
      type: "past",
    };
  }
  if (date > todayStr) {
    return {
      bg: "bg-accent-soft dark:bg-accent-soft",
      border: "border-accent/50",
      text: "text-accent",
      type: "future",
    };
  }

  // Same day - compare times
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  if (endMinutes <= nowMinutes) {
    // Past appointment
    return {
      bg: "bg-muted/50 dark:bg-muted/30",
      border: "border-border",
      text: "text-muted-foreground",
      type: "past",
    };
  }
  if (startMinutes <= nowMinutes && nowMinutes < endMinutes) {
    // Current appointment (in progress)
    return {
      bg: "bg-accent dark:bg-accent",
      border: "border-accent",
      text: "text-white dark:text-white",
      type: "current",
    };
  }
  // Future appointment
  return {
    bg: "bg-accent-soft dark:bg-accent-soft",
    border: "border-accent/50",
    text: "text-accent",
    type: "future",
  };
}

/**
 * Sort appointments by start time
 */
export function sortAppointmentsByTime(
  appointments: Appointment[],
): Appointment[] {
  return [...appointments].sort((a, b) =>
    a.start_time.localeCompare(b.start_time),
  );
}

/**
 * Sort breaks by start time
 */
export function sortBreaksByTime(breaks: WorkingDayBreak[]): WorkingDayBreak[] {
  return [...breaks].sort((a, b) => a.start_time.localeCompare(b.start_time));
}

/**
 * Check if working day has any appointments
 */
export function hasAppointments(
  date: string,
  appointments: Appointment[],
): boolean {
  return getAppointmentsForDate(appointments, date).some(
    (apt) => apt.status !== "cancelled",
  );
}

/**
 * Count active appointments for a date
 */
export function countActiveAppointments(
  date: string,
  appointments: Appointment[],
): number {
  return getAppointmentsForDate(appointments, date).filter(
    (apt) => apt.status !== "cancelled",
  ).length;
}
