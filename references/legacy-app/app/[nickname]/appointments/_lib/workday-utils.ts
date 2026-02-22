import { format } from "date-fns";
import { timeToMinutes } from "./time-utils";
import type { Appointment } from "./types";

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
