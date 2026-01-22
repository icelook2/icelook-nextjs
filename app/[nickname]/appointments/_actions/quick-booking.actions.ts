"use server";

/**
 * Quick Booking Server Action
 *
 * Creates appointments initiated by the creator (specialist) on behalf of clients.
 * Used for phone bookings and walk-ins.
 *
 * Key differences from client-initiated booking:
 * - Always auto-confirmed (creator-initiated = trusted)
 * - Client info is optional (true walk-in can be anonymous)
 * - No visit preferences (not applicable for quick bookings)
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

// ============================================================================
// Types
// ============================================================================

const quickBookingSchema = z.object({
  beautyPageId: z.string().uuid(),
  nickname: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  startTime: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM
  endTime: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM
  serviceIds: z
    .array(z.string().uuid())
    .min(1, "At least one service required"),
  clientId: z.string().uuid().optional(),
  clientName: z.string().min(1).max(100),
  clientPhone: z.string().max(20).optional(),
  notes: z.string().max(500).optional(),
});

type QuickBookingInput = z.infer<typeof quickBookingSchema>;

interface QuickBookingResult {
  success: boolean;
  appointmentId?: string;
  error?: string;
}

interface ServiceDetails {
  id: string;
  name: string;
  price_cents: number;
  duration_minutes: number;
}

// ============================================================================
// Server Action
// ============================================================================

export async function createQuickBooking(
  input: QuickBookingInput,
): Promise<QuickBookingResult> {
  try {
    // Validate input
    const validated = quickBookingSchema.parse(input);

    // Auth check - must be logged in
    const profile = await getProfile();
    if (!profile) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await createClient();

    // Fetch beauty page with necessary fields
    const { data: beautyPage, error: beautyPageError } = await supabase
      .from("beauty_pages")
      .select("id, owner_id, display_name, currency")
      .eq("id", validated.beautyPageId)
      .single();

    if (beautyPageError || !beautyPage) {
      return { success: false, error: "Beauty page not found" };
    }

    // Verify user is beauty page owner (only creator can quick-book)
    if (beautyPage.owner_id !== profile.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Fetch services
    const { data: services, error: servicesError } = await supabase
      .from("services")
      .select("id, name, price_cents, duration_minutes")
      .in("id", validated.serviceIds);

    if (servicesError) {
      console.error("Error fetching services:", servicesError);
      return { success: false, error: "Failed to fetch service details" };
    }

    if (!services || services.length !== validated.serviceIds.length) {
      return { success: false, error: "Some services are not available" };
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
      validated.beautyPageId,
      validated.date,
      validated.startTime,
      validated.endTime,
    );

    if (!slotAvailable) {
      return { success: false, error: "This time slot is no longer available" };
    }

    // Check if creator is working on this date
    const { data: workingDay, error: workingDayError } = await supabase
      .from("working_days")
      .select("id, start_time, end_time")
      .eq("beauty_page_id", validated.beautyPageId)
      .eq("date", validated.date)
      .single();

    if (workingDayError || !workingDay) {
      return { success: false, error: "Not working on this date" };
    }

    // Verify the time slot is within working hours
    const slotStartMinutes = timeToMinutes(validated.startTime);
    const slotEndMinutes = timeToMinutes(validated.endTime);
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
        error: "The selected time is outside working hours",
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
          validated.startTime,
          validated.endTime,
          normalizeTime(brk.start_time),
          normalizeTime(brk.end_time),
        ),
      );

      if (conflictsWithBreak) {
        return {
          success: false,
          error: "The selected time overlaps with a break",
        };
      }
    }

    // Build notes with service IDs metadata for future reference
    const serviceMetadata = {
      service_ids: validated.serviceIds,
      services: serviceDetails.map((s) => ({
        id: s.id,
        name: s.name,
        price_cents: s.price_cents,
        duration_minutes: s.duration_minutes,
      })),
      quick_booking: true,
      booked_by: "creator",
    };

    const clientNotes = validated.notes
      ? `${validated.notes}\n\n---\n${JSON.stringify(serviceMetadata)}`
      : JSON.stringify(serviceMetadata);

    // Get creator display name from beauty page
    const creatorDisplayName = beautyPage.display_name ?? "Creator";

    // Create the appointment - always confirmed for creator-initiated bookings
    const { data: appointment, error: createError } = await supabase
      .from("appointments")
      .insert({
        beauty_page_id: validated.beautyPageId,
        service_id: validated.serviceIds[0], // Primary service for FK
        client_id: validated.clientId ?? null,
        creator_display_name: creatorDisplayName,
        service_name: combinedServiceName,
        service_price_cents: totalPriceCents,
        service_currency: beautyPage.currency ?? "UAH",
        service_duration_minutes: totalDurationMinutes,
        client_name: validated.clientName,
        client_phone: validated.clientPhone ?? null,
        client_email: null, // Not collected in quick booking
        date: validated.date,
        start_time: validated.startTime,
        end_time: validated.endTime,
        timezone: "Europe/Kyiv",
        status: "confirmed", // Always confirmed for creator-initiated
        client_notes: clientNotes,
        visit_preferences: null,
      })
      .select("id")
      .single();

    if (createError || !appointment) {
      console.error("Error creating appointment:", {
        message: createError?.message,
        code: createError?.code,
        details: createError?.details,
        hint: createError?.hint,
      });
      return {
        success: false,
        error: createError?.message ?? "Failed to create booking",
      };
    }

    // Insert individual services into appointment_services junction table
    const { error: servicesInsertError } = await supabase
      .from("appointment_services")
      .insert(
        serviceDetails.map((s) => ({
          appointment_id: appointment.id,
          service_id: s.id,
          service_name: s.name,
          duration_minutes: s.duration_minutes,
          price_cents: s.price_cents,
        })),
      );

    if (servicesInsertError) {
      console.error(
        "Error inserting appointment services:",
        servicesInsertError,
      );
      // Note: Appointment is already created, so we don't fail the booking
      // The appointment still has the aggregated service data
    }

    // Revalidate the schedule page
    revalidatePath(`/${validated.nickname}/appointments`);

    return {
      success: true,
      appointmentId: appointment.id,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0];
      return {
        success: false,
        error: firstIssue?.message ?? "Validation error",
      };
    }
    console.error("Error in createQuickBooking:", error);
    return { success: false, error: "An unexpected error occurred" };
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
