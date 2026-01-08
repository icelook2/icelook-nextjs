"use server";

/**
 * Booking Server Actions (Solo Creator Model)
 *
 * Creates appointments for guests booking services.
 *
 * Key changes from multi-specialist model:
 * - No specialist selection - creator is the service provider
 * - Prices come directly from services table
 * - Working days are linked to beauty page, not specialist
 */

import { createClient } from "@/lib/supabase/server";
import type { BookingResult, CreateBookingInput } from "../_lib/booking-types";

// ============================================================================
// Types
// ============================================================================

interface ServiceDetails {
  id: string;
  name: string;
  price_cents: number;
  duration_minutes: number;
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Create a new appointment booking.
 *
 * This is a public mutation - guests can book without authentication.
 * Authenticated users can optionally provide their clientId for tracking.
 */
export async function createBooking(
  input: CreateBookingInput,
): Promise<BookingResult> {
  try {
    const supabase = await createClient();
    const {
      beautyPageId,
      serviceIds,
      date,
      startTime,
      endTime,
      clientInfo,
      clientId,
      visitPreferences,
    } = input;

    // Validate we have at least one service
    if (serviceIds.length === 0) {
      return {
        success: false,
        error: "validation",
        message: "At least one service must be selected",
      };
    }

    // Get beauty page info including creator profile
    const { data: beautyPage, error: beautyPageError } = await supabase
      .from("beauty_pages")
      .select(`
        id,
        display_name,
        currency,
        auto_confirm_bookings
      `)
      .eq("id", beautyPageId)
      .single();

    if (beautyPageError || !beautyPage) {
      console.error("Error fetching beauty page:", beautyPageError);
      return {
        success: false,
        error: "validation",
        message: "Beauty page not found",
      };
    }

    // Get services with their prices and durations
    const { data: services, error: servicesError } = await supabase
      .from("services")
      .select(`
        id,
        name,
        price_cents,
        duration_minutes
      `)
      .in("id", serviceIds);

    if (servicesError) {
      console.error("Error fetching services:", servicesError);
      return {
        success: false,
        error: "validation",
        message: "Failed to fetch service details",
      };
    }

    if (!services || services.length !== serviceIds.length) {
      return {
        success: false,
        error: "validation",
        message: "Some selected services are not available",
      };
    }

    // Map services to our format
    const serviceDetails: ServiceDetails[] = services.map((s) => ({
      id: s.id,
      name: s.name,
      price_cents: s.price_cents,
      duration_minutes: s.duration_minutes,
    }));

    // Calculate totals
    const totalPriceCents = serviceDetails.reduce(
      (sum, s) => sum + s.price_cents,
      0,
    );
    const totalDurationMinutes = serviceDetails.reduce(
      (sum, s) => sum + s.duration_minutes,
      0,
    );
    const combinedServiceName = serviceDetails.map((s) => s.name).join(", ");

    // Check if the slot is still available (prevent race conditions)
    const slotAvailable = await isSlotAvailable(
      supabase,
      beautyPageId,
      date,
      startTime,
      endTime,
    );

    if (!slotAvailable) {
      return {
        success: false,
        error: "slot_taken",
        message: "This time slot is no longer available",
      };
    }

    // Check if creator is working on this date
    const { data: workingDay, error: workingDayError } = await supabase
      .from("working_days")
      .select("id, start_time, end_time")
      .eq("beauty_page_id", beautyPageId)
      .eq("date", date)
      .single();

    if (workingDayError || !workingDay) {
      return {
        success: false,
        error: "not_working",
        message: "Not working on this date",
      };
    }

    // Verify the time slot is within working hours
    const slotStartMinutes = timeToMinutes(startTime);
    const slotEndMinutes = timeToMinutes(endTime);
    const workStartMinutes = timeToMinutes(
      normalizeTime(workingDay.start_time),
    );
    const workEndMinutes = timeToMinutes(normalizeTime(workingDay.end_time));

    if (
      slotStartMinutes < workStartMinutes ||
      slotEndMinutes > workEndMinutes
    ) {
      return {
        success: false,
        error: "not_working",
        message: "The selected time is outside working hours",
      };
    }

    // Check for break conflicts
    const { data: breaks } = await supabase
      .from("working_day_breaks")
      .select("start_time, end_time")
      .eq("working_day_id", workingDay.id);

    if (breaks && breaks.length > 0) {
      const conflictsWithBreak = breaks.some((brk) =>
        timesOverlap(
          startTime,
          endTime,
          normalizeTime(brk.start_time),
          normalizeTime(brk.end_time),
        ),
      );

      if (conflictsWithBreak) {
        return {
          success: false,
          error: "not_working",
          message: "The selected time overlaps with a break",
        };
      }
    }

    // Build notes with service IDs metadata for future reference
    const serviceMetadata = {
      service_ids: serviceIds,
      services: serviceDetails.map((s) => ({
        id: s.id,
        name: s.name,
        price_cents: s.price_cents,
        duration_minutes: s.duration_minutes,
      })),
    };

    const clientNotes = clientInfo.notes
      ? `${clientInfo.notes}\n\n---\n${JSON.stringify(serviceMetadata)}`
      : JSON.stringify(serviceMetadata);

    // Get creator display name from beauty page
    const creatorDisplayName = beautyPage.display_name ?? "Creator";

    // Determine status based on auto_confirm setting
    const appointmentStatus = beautyPage.auto_confirm_bookings
      ? "confirmed"
      : "pending";

    // Create the appointment
    const { data: appointment, error: createError } = await supabase
      .from("appointments")
      .insert({
        beauty_page_id: beautyPageId,
        service_id: serviceIds[0], // Primary service for FK
        client_id: clientId ?? null,
        creator_display_name: creatorDisplayName,
        service_name: combinedServiceName,
        service_price_cents: totalPriceCents,
        service_currency: beautyPage.currency ?? "UAH",
        service_duration_minutes: totalDurationMinutes,
        client_name: clientInfo.name,
        client_phone: clientInfo.phone ?? null,
        client_email: clientInfo.email ?? null,
        date,
        start_time: startTime,
        end_time: endTime,
        timezone: "Europe/Kyiv",
        status: appointmentStatus,
        client_notes: clientNotes,
        visit_preferences: visitPreferences ?? null,
      })
      .select("id, status")
      .single();

    if (createError || !appointment) {
      console.error("Error creating appointment:", createError);
      return {
        success: false,
        error: "unknown",
        message: "Failed to create booking",
      };
    }

    return {
      success: true,
      appointmentId: appointment.id,
      status: appointment.status as "pending" | "confirmed",
    };
  } catch (error) {
    console.error("Error in createBooking:", error);
    return {
      success: false,
      error: "unknown",
      message: "An unexpected error occurred",
    };
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Check if a time slot is available (no conflicting appointments)
 */
async function isSlotAvailable(
  supabase: Awaited<ReturnType<typeof createClient>>,
  beautyPageId: string,
  date: string,
  startTime: string,
  endTime: string,
): Promise<boolean> {
  // Fetch existing appointments for the date
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("start_time, end_time")
    .eq("beauty_page_id", beautyPageId)
    .eq("date", date)
    .in("status", ["pending", "confirmed"]);

  if (error) {
    console.error("Error checking slot availability:", error);
    return false; // Err on the side of caution
  }

  if (!appointments || appointments.length === 0) {
    return true;
  }

  // Check for overlaps with existing appointments
  for (const apt of appointments) {
    if (
      timesOverlap(
        startTime,
        endTime,
        normalizeTime(apt.start_time),
        normalizeTime(apt.end_time),
      )
    ) {
      return false;
    }
  }

  return true;
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
 * Normalize time string to HH:MM format (strip seconds if present)
 */
function normalizeTime(time: string): string {
  const parts = time.split(":");
  return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
}
