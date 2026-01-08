"use server";

/**
 * Availability Server Actions (Solo Creator Model)
 *
 * Fetches working days, appointments, and booking settings
 * for a beauty page to determine available booking slots.
 *
 * Key changes from multi-specialist model:
 * - Uses beautyPageId instead of specialistId
 * - Booking settings come from beauty_pages table
 * - Removed multi-specialist queries
 */

import { createClient } from "@/lib/supabase/server";
import type {
  AppointmentData,
  AvailabilityData,
  BookingSettings,
  GetAvailabilityInput,
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
 * Get availability data for a beauty page within a date range.
 *
 * This is a public query (no authentication required) since
 * clients need to see availability before booking.
 */
export async function getAvailabilityData(
  input: GetAvailabilityInput,
): Promise<ActionResult<AvailabilityData>> {
  try {
    const supabase = await createClient();
    const { beautyPageId, startDate, endDate } = input;

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
      .eq("beauty_page_id", beautyPageId)
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
      .eq("beauty_page_id", beautyPageId)
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

    // Fetch booking settings from beauty_pages table
    const { data: beautyPage } = await supabase
      .from("beauty_pages")
      .select(
        "auto_confirm_bookings, min_booking_notice_hours, max_days_ahead, cancellation_notice_hours",
      )
      .eq("id", beautyPageId)
      .single();

    const bookingSettings: BookingSettings | null = beautyPage
      ? {
          autoConfirm: beautyPage.auto_confirm_bookings ?? false,
          minBookingNoticeHours: beautyPage.min_booking_notice_hours ?? 0,
          maxDaysAhead: beautyPage.max_days_ahead ?? 90,
          cancellationNoticeHours: beautyPage.cancellation_notice_hours ?? 24,
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
  beautyPageId: string,
  startDate: string,
  endDate: string,
): Promise<ActionResult<string[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("working_days")
      .select("date")
      .eq("beauty_page_id", beautyPageId)
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
