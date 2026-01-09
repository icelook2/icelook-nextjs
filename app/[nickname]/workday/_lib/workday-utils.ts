import { format, differenceInMinutes } from "date-fns";
import type { Appointment } from "../../settings/schedule/_lib/types";
import { timeToMinutes } from "../../settings/schedule/_lib/time-utils";

/**
 * Get all appointments for a specific date
 * Sorted by start time
 */
export function getAppointmentsForDate(
  appointments: Appointment[],
  dateStr: string,
): Appointment[] {
  return appointments
    .filter((apt) => apt.date === dateStr)
    .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
}

/**
 * Get the current appointment based on current time
 * Returns the appointment that is currently in progress
 */
export function getCurrentAppointment(
  appointments: Appointment[],
  now: Date,
): Appointment | null {
  const todayStr = format(now, "yyyy-MM-dd");
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const todayAppointments = appointments.filter(
    (apt) =>
      apt.date === todayStr &&
      (apt.status === "pending" || apt.status === "confirmed"),
  );

  for (const apt of todayAppointments) {
    const startMinutes = timeToMinutes(apt.start_time);
    const endMinutes = timeToMinutes(apt.end_time);

    if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      return apt;
    }
  }

  return null;
}

/**
 * Get upcoming appointments (not started yet) for today
 */
export function getUpcomingAppointments(
  appointments: Appointment[],
  now: Date,
): Appointment[] {
  const todayStr = format(now, "yyyy-MM-dd");
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return appointments
    .filter((apt) => {
      if (apt.status === "cancelled" || apt.status === "no_show") {
        return false;
      }
      if (apt.date !== todayStr) {
        return false;
      }
      const startMinutes = timeToMinutes(apt.start_time);
      return startMinutes > currentMinutes;
    })
    .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
}

/**
 * Format time remaining until appointment ends
 * Returns string like "15 min left" or "1h 30min left"
 */
export function formatTimeRemaining(endTime: string, now: Date): string {
  const [hours, minutes] = endTime.split(":").map(Number);
  const endDate = new Date(now);
  endDate.setHours(hours, minutes, 0, 0);

  const diffMinutes = differenceInMinutes(endDate, now);

  if (diffMinutes <= 0) {
    return "ending now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min left`;
  }

  const h = Math.floor(diffMinutes / 60);
  const m = diffMinutes % 60;

  if (m === 0) {
    return `${h}h left`;
  }

  return `${h}h ${m}min left`;
}

/**
 * Format time until appointment starts
 */
export function formatTimeUntil(startTime: string, now: Date): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const startDate = new Date(now);
  startDate.setHours(hours, minutes, 0, 0);

  const diffMinutes = differenceInMinutes(startDate, now);

  if (diffMinutes <= 0) {
    return "now";
  }

  if (diffMinutes < 60) {
    return `in ${diffMinutes}m`;
  }

  const h = Math.floor(diffMinutes / 60);
  const m = diffMinutes % 60;

  if (m === 0) {
    return `in ${h}h`;
  }

  return `in ${h}h ${m}m`;
}

/**
 * Get formatted time range
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  return `${startTime.slice(0, 5)} – ${endTime.slice(0, 5)}`;
}

/**
 * Get completed appointments for today
 * These are appointments that have ended (past end_time) or marked as completed
 */
export function getCompletedAppointments(
  appointments: Appointment[],
  now: Date,
): Appointment[] {
  const todayStr = format(now, "yyyy-MM-dd");
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return appointments
    .filter((apt) => {
      if (apt.date !== todayStr) {
        return false;
      }
      // Include explicitly completed appointments
      if (apt.status === "completed") {
        return true;
      }
      // Include confirmed/pending appointments that have ended
      if (apt.status === "confirmed" || apt.status === "pending") {
        const endMinutes = timeToMinutes(apt.end_time);
        return endMinutes <= currentMinutes;
      }
      return false;
    })
    .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
}

/**
 * Calculate break duration in minutes between two times
 */
export function getBreakMinutes(
  previousEndTime: string,
  nextStartTime: string,
): number {
  const prevEnd = timeToMinutes(previousEndTime);
  const nextStart = timeToMinutes(nextStartTime);
  return Math.max(0, nextStart - prevEnd);
}

/**
 * Format break duration for display
 * Returns string like "30min break" or "1h 30min break"
 */
export function formatBreakDuration(minutes: number): string {
  if (minutes <= 0) {
    return "";
  }

  if (minutes < 60) {
    return `${minutes}min break`;
  }

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  if (m === 0) {
    return `${h}h break`;
  }

  return `${h}h ${m}min break`;
}
