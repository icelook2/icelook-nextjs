"use server";

/**
 * Availability Server Actions
 *
 * Fetches working days, appointments, and booking settings
 * for a specialist to determine available booking slots.
 */

import { createClient } from "@/lib/supabase/server";
import type {
  AppointmentData,
  AvailabilityData,
  GetAvailabilityInput,
  SpecialistBookingSettings,
  WorkingDayData,
} from "../_lib/booking-types";

// ============================================================================
// Types
// ============================================================================

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// ============================================================================
// Queries
// ============================================================================

/**
 * Get availability data for a specialist within a date range.
 *
 * This is a public query (no authentication required) since
 * clients need to see availability before booking.
 */
export async function getAvailabilityData(
  input: GetAvailabilityInput,
): Promise<ActionResult<AvailabilityData>> {
  try {
    const supabase = await createClient();
    const { specialistId, startDate, endDate } = input;

    // Fetch working days with breaks
    const { data: workingDaysRaw, error: workingDaysError } = await supabase
      .from("working_days")
      .select(`
        id,
        date,
        start_time,
        end_time,
        working_day_breaks (
          id,
          start_time,
          end_time
        )
      `)
      .eq("specialist_id", specialistId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    if (workingDaysError) {
      console.error("Error fetching working days:", workingDaysError);
      return { success: false, error: "Failed to fetch availability" };
    }

    // Transform working days to our format
    const workingDays: WorkingDayData[] = (workingDaysRaw ?? []).map((wd) => ({
      date: wd.date,
      startTime: normalizeTime(wd.start_time),
      endTime: normalizeTime(wd.end_time),
      breaks: (
        (wd.working_day_breaks as Array<{
          start_time: string;
          end_time: string;
        }>) ?? []
      ).map((brk) => ({
        startTime: normalizeTime(brk.start_time),
        endTime: normalizeTime(brk.end_time),
      })),
    }));

    // Fetch appointments (pending and confirmed only)
    const { data: appointmentsRaw, error: appointmentsError } = await supabase
      .from("appointments")
      .select("id, start_time, end_time, status")
      .eq("specialist_id", specialistId)
      .gte("date", startDate)
      .lte("date", endDate)
      .in("status", ["pending", "confirmed"]);

    if (appointmentsError) {
      console.error("Error fetching appointments:", appointmentsError);
      return { success: false, error: "Failed to fetch appointments" };
    }

    // Transform appointments to our format
    const appointments: AppointmentData[] = (appointmentsRaw ?? []).map(
      (apt) => ({
        id: apt.id,
        startTime: normalizeTime(apt.start_time),
        endTime: normalizeTime(apt.end_time),
        status: apt.status as "pending" | "confirmed",
      }),
    );

    // Fetch booking settings
    const { data: settingsRaw } = await supabase
      .from("specialist_booking_settings")
      .select(
        "auto_confirm, min_booking_notice_hours, max_days_ahead, cancellation_notice_hours",
      )
      .eq("specialist_id", specialistId)
      .single();

    const bookingSettings: SpecialistBookingSettings | null = settingsRaw
      ? {
          autoConfirm: settingsRaw.auto_confirm,
          minBookingNoticeHours: settingsRaw.min_booking_notice_hours,
          maxDaysAhead: settingsRaw.max_days_ahead,
          cancellationNoticeHours: settingsRaw.cancellation_notice_hours,
        }
      : null;

    return {
      success: true,
      data: {
        workingDays,
        appointments,
        bookingSettings,
      },
    };
  } catch (error) {
    console.error("Error in getAvailabilityData:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get working days for a date range (lighter query for calendar display)
 */
export async function getWorkingDaysForRange(
  specialistId: string,
  startDate: string,
  endDate: string,
): Promise<ActionResult<string[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("working_days")
      .select("date")
      .eq("specialist_id", specialistId)
      .gte("date", startDate)
      .lte("date", endDate);

    if (error) {
      console.error("Error fetching working days:", error);
      return { success: false, error: "Failed to fetch working days" };
    }

    const dates = (data ?? []).map((d) => d.date);
    return { success: true, data: dates };
  } catch (error) {
    console.error("Error in getWorkingDaysForRange:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Working day with specialist ID - used for multi-specialist queries
 */
export interface WorkingDayWithSpecialist {
  date: string;
  specialistId: string;
}

/**
 * Get working days for multiple specialists (for date-first booking flow).
 * Returns all dates where at least one specialist is working,
 * along with which specialists work on each date.
 */
export async function getWorkingDaysForAllSpecialists(
  specialistIds: string[],
  startDate: string,
  endDate: string,
): Promise<ActionResult<{ dates: string[]; dateSpecialistMap: Map<string, string[]> }>> {
  try {
    if (specialistIds.length === 0) {
      return { success: true, data: { dates: [], dateSpecialistMap: new Map() } };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("working_days")
      .select("date, specialist_id")
      .in("specialist_id", specialistIds)
      .gte("date", startDate)
      .lte("date", endDate);

    if (error) {
      console.error("Error fetching working days for all specialists:", error);
      return { success: false, error: "Failed to fetch working days" };
    }

    // Build a map of date -> specialist IDs
    const dateSpecialistMap = new Map<string, string[]>();
    for (const row of data ?? []) {
      const existing = dateSpecialistMap.get(row.date) ?? [];
      existing.push(row.specialist_id);
      dateSpecialistMap.set(row.date, existing);
    }

    // Get unique sorted dates
    const dates = Array.from(dateSpecialistMap.keys()).sort();

    return { success: true, data: { dates, dateSpecialistMap } };
  } catch (error) {
    console.error("Error in getWorkingDaysForAllSpecialists:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get availability data for multiple specialists on a single date.
 * Returns combined time slots with which specialists are available at each slot.
 * Used for date-first booking flow where user selects time before specialist.
 */
export async function getAvailabilityForMultipleSpecialists(
  specialistIds: string[],
  date: string,
): Promise<ActionResult<AvailabilityData[]>> {
  try {
    if (specialistIds.length === 0) {
      return { success: true, data: [] };
    }

    const supabase = await createClient();

    // Fetch working days with breaks for all specialists
    const { data: workingDaysRaw, error: workingDaysError } = await supabase
      .from("working_days")
      .select(`
        id,
        specialist_id,
        date,
        start_time,
        end_time,
        working_day_breaks (
          id,
          start_time,
          end_time
        )
      `)
      .in("specialist_id", specialistIds)
      .eq("date", date);

    if (workingDaysError) {
      console.error("Error fetching working days:", workingDaysError);
      return { success: false, error: "Failed to fetch availability" };
    }

    // Fetch appointments for all specialists on this date
    const { data: appointmentsRaw, error: appointmentsError } = await supabase
      .from("appointments")
      .select("id, specialist_id, start_time, end_time, status")
      .in("specialist_id", specialistIds)
      .eq("date", date)
      .in("status", ["pending", "confirmed"]);

    if (appointmentsError) {
      console.error("Error fetching appointments:", appointmentsError);
      return { success: false, error: "Failed to fetch appointments" };
    }

    // Fetch booking settings for all specialists
    const { data: settingsRaw } = await supabase
      .from("specialist_booking_settings")
      .select(
        "specialist_id, auto_confirm, min_booking_notice_hours, max_days_ahead, cancellation_notice_hours",
      )
      .in("specialist_id", specialistIds);

    // Build availability data per specialist
    const result: AvailabilityData[] = [];

    for (const specId of specialistIds) {
      const workingDay = workingDaysRaw?.find((wd) => wd.specialist_id === specId);
      const appointments = appointmentsRaw?.filter((apt) => apt.specialist_id === specId) ?? [];
      const settings = settingsRaw?.find((s) => s.specialist_id === specId);

      const workingDays: WorkingDayData[] = workingDay
        ? [
            {
              date: workingDay.date,
              startTime: normalizeTime(workingDay.start_time),
              endTime: normalizeTime(workingDay.end_time),
              breaks: (
                (workingDay.working_day_breaks as Array<{
                  start_time: string;
                  end_time: string;
                }>) ?? []
              ).map((brk) => ({
                startTime: normalizeTime(brk.start_time),
                endTime: normalizeTime(brk.end_time),
              })),
            },
          ]
        : [];

      const appointmentData: AppointmentData[] = appointments.map((apt) => ({
        id: apt.id,
        startTime: normalizeTime(apt.start_time),
        endTime: normalizeTime(apt.end_time),
        status: apt.status as "pending" | "confirmed",
      }));

      const bookingSettings: SpecialistBookingSettings | null = settings
        ? {
            autoConfirm: settings.auto_confirm,
            minBookingNoticeHours: settings.min_booking_notice_hours,
            maxDaysAhead: settings.max_days_ahead,
            cancellationNoticeHours: settings.cancellation_notice_hours,
          }
        : null;

      result.push({
        specialistId: specId,
        workingDays,
        appointments: appointmentData,
        bookingSettings,
      });
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("Error in getAvailabilityForMultipleSpecialists:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Normalize time string to HH:MM format (strip seconds if present)
 */
function normalizeTime(time: string): string {
  const parts = time.split(":");
  return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
}
