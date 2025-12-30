"use server";

/**
 * Booking Server Actions
 *
 * Creates appointments for guests booking services with specialists.
 */

import { createClient } from "@/lib/supabase/server";
import type { CreateBookingInput, BookingResult } from "../_lib/booking-types";

// ============================================================================
// Types
// ============================================================================

interface ServiceAssignment {
  service_id: string;
  service_name: string;
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
      specialistMemberId,
      serviceIds,
      date,
      startTime,
      endTime,
      clientInfo,
      clientId,
    } = input;

    // Validate we have at least one service
    if (serviceIds.length === 0) {
      return {
        success: false,
        error: "validation",
        message: "At least one service must be selected",
      };
    }

    // Get specialist info from member ID (including profile for full_name fallback)
    const { data: specialist, error: specialistError } = await supabase
      .from("beauty_page_specialists")
      .select(`
        id,
        display_name,
        member_id,
        beauty_page_members!inner (
          profiles!inner (
            full_name
          )
        )
      `)
      .eq("member_id", specialistMemberId)
      .single();

    if (specialistError || !specialist) {
      console.error("Error fetching specialist:", specialistError);
      return {
        success: false,
        error: "validation",
        message: "Specialist not found",
      };
    }

    // Get service assignments for the selected services and specialist
    const { data: assignments, error: assignmentsError } = await supabase
      .from("specialist_service_assignments")
      .select(`
        service_id,
        price_cents,
        duration_minutes,
        services!inner (
          id,
          name
        )
      `)
      .eq("member_id", specialistMemberId)
      .in("service_id", serviceIds);

    if (assignmentsError) {
      console.error("Error fetching service assignments:", assignmentsError);
      return {
        success: false,
        error: "validation",
        message: "Failed to fetch service details",
      };
    }

    if (!assignments || assignments.length !== serviceIds.length) {
      return {
        success: false,
        error: "validation",
        message: "Some selected services are not available for this specialist",
      };
    }

    // Map assignments to our format
    const serviceDetails: ServiceAssignment[] = assignments.map((a) => {
      // services is a single object due to !inner join
      const service = a.services as unknown as { id: string; name: string };
      return {
        service_id: a.service_id,
        service_name: service.name,
        price_cents: a.price_cents,
        duration_minutes: a.duration_minutes,
      };
    });

    // Calculate totals
    const totalPriceCents = serviceDetails.reduce(
      (sum, s) => sum + s.price_cents,
      0,
    );
    const totalDurationMinutes = serviceDetails.reduce(
      (sum, s) => sum + s.duration_minutes,
      0,
    );
    const combinedServiceName = serviceDetails
      .map((s) => s.service_name)
      .join(", ");

    // Check if the slot is still available (prevent race conditions)
    const slotAvailable = await isSlotAvailable(
      supabase,
      specialist.id,
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

    // Check if specialist is working on this date
    const { data: workingDay, error: workingDayError } = await supabase
      .from("working_days")
      .select("id, start_time, end_time")
      .eq("specialist_id", specialist.id)
      .eq("date", date)
      .single();

    if (workingDayError || !workingDay) {
      return {
        success: false,
        error: "not_working",
        message: "The specialist is not working on this date",
      };
    }

    // Verify the time slot is within working hours
    const slotStartMinutes = timeToMinutes(startTime);
    const slotEndMinutes = timeToMinutes(endTime);
    const workStartMinutes = timeToMinutes(normalizeTime(workingDay.start_time));
    const workEndMinutes = timeToMinutes(normalizeTime(workingDay.end_time));

    if (slotStartMinutes < workStartMinutes || slotEndMinutes > workEndMinutes) {
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

    // Get beauty page info for currency and timezone
    const { data: beautyPage } = await supabase
      .from("beauty_pages")
      .select("id")
      .eq("id", beautyPageId)
      .single();

    if (!beautyPage) {
      return {
        success: false,
        error: "validation",
        message: "Beauty page not found",
      };
    }

    // Build notes with service IDs metadata for future reference
    const serviceMetadata = {
      service_ids: serviceIds,
      services: serviceDetails.map((s) => ({
        id: s.service_id,
        name: s.service_name,
        price_cents: s.price_cents,
        duration_minutes: s.duration_minutes,
      })),
    };

    const clientNotes = clientInfo.notes
      ? `${clientInfo.notes}\n\n---\n${JSON.stringify(serviceMetadata)}`
      : JSON.stringify(serviceMetadata);

    // Get specialist display name with fallback to profile full_name
    // Supabase returns nested data - beauty_page_members is a single object due to !inner
    const memberData = specialist.beauty_page_members as unknown as {
      profiles: { full_name: string | null };
    };
    const profileFullName = memberData?.profiles?.full_name;
    const specialistDisplayName =
      specialist.display_name ?? profileFullName ?? "Specialist";

    // Create the appointment
    // Note: Using first service as primary service_id for foreign key
    // Full service list is stored in client_notes as JSON
    const { data: appointment, error: createError } = await supabase
      .from("appointments")
      .insert({
        beauty_page_id: beautyPageId,
        specialist_id: specialist.id,
        service_id: serviceIds[0], // Primary service for FK
        client_id: clientId ?? null,
        specialist_display_name: specialistDisplayName,
        service_name: combinedServiceName,
        service_price_cents: totalPriceCents,
        service_currency: "UAH", // Default for now, could come from beauty page settings
        service_duration_minutes: totalDurationMinutes,
        client_name: clientInfo.name,
        client_phone: clientInfo.phone ?? null,
        client_email: clientInfo.email ?? null,
        date,
        start_time: startTime,
        end_time: endTime,
        timezone: "Europe/Kyiv", // Default, could come from beauty page settings
        status: "pending", // Could be 'confirmed' if auto_confirm is enabled
        client_notes: clientNotes,
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
  specialistId: string,
  date: string,
  startTime: string,
  endTime: string,
): Promise<boolean> {
  // Fetch existing appointments for the date
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("start_time, end_time")
    .eq("specialist_id", specialistId)
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
