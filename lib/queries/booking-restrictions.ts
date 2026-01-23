import { createClient } from "@/lib/supabase/server";
import type {
  BookingRestrictionCheckResult,
  BookingRestrictionDefaults,
  ClientIdentifier,
} from "@/lib/types/booking-restrictions";

// ============================================================================
// System Defaults
// ============================================================================

// Hardcoded defaults used when database tables don't exist yet
// These match the SQL migration defaults
const FALLBACK_DEFAULTS: BookingRestrictionDefaults = {
  id: "fallback",
  max_future_appointments: 10,
  max_bookings_per_hour: 3,
  max_bookings_per_day: 5,
  booking_cooldown_seconds: 60,
  no_show_strikes_for_temp_block: 2,
  temp_block_duration_days: 30,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Get system-wide booking restriction defaults
 */
export async function getBookingRestrictionDefaults(): Promise<BookingRestrictionDefaults> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("booking_restriction_defaults")
      .select("*")
      .limit(1)
      .single();

    if (error || !data) {
      // Table doesn't exist yet or no data - use fallback
      return FALLBACK_DEFAULTS;
    }

    return data as BookingRestrictionDefaults;
  } catch {
    // Table doesn't exist - use fallback
    return FALLBACK_DEFAULTS;
  }
}

// ============================================================================
// Booking Restriction Checks (Application Layer)
// ============================================================================

/**
 * Check all booking restrictions for a client.
 * This is the main function called before creating a booking.
 *
 * Checks:
 * 1. Client blocklist (via beauty_page_clients)
 * 2. Overlapping appointments (across all beauty pages)
 * 3. Max future appointments
 * 4. Hourly/daily velocity limits
 * 5. Cooldown between bookings
 */
export async function checkBookingRestrictions(
  beautyPageId: string,
  client: ClientIdentifier,
  appointmentDate: string,
  startTime: string,
  endTime: string,
): Promise<BookingRestrictionCheckResult> {
  const supabase = await createClient();
  const defaults = await getBookingRestrictionDefaults();

  // Only authenticated users can book - must have clientId
  if (!client.clientId) {
    return {
      allowed: false,
      reason: "not_authenticated",
      message: "You must be logged in to book an appointment",
    };
  }

  // 1. Check if client is blocked (using RPC function)
  const blockResult = await checkClientBlocked(supabase, beautyPageId, client.clientId);
  if (!blockResult.allowed) {
    return blockResult;
  }

  // 2. Check overlapping appointments
  const overlapResult = await checkOverlappingAppointments(
    supabase,
    client.clientId,
    appointmentDate,
    startTime,
    endTime,
  );
  if (!overlapResult.allowed) {
    return overlapResult;
  }

  // 3. Check max future appointments
  const futureResult = await checkMaxFutureAppointments(
    supabase,
    client.clientId,
    defaults.max_future_appointments,
  );
  if (!futureResult.allowed) {
    return futureResult;
  }

  // 4. Check velocity limits
  const velocityResult = await checkVelocityLimits(
    supabase,
    client.clientId,
    defaults.max_bookings_per_hour,
    defaults.max_bookings_per_day,
    defaults.booking_cooldown_seconds,
  );
  if (!velocityResult.allowed) {
    return velocityResult;
  }

  return { allowed: true };
}

// ============================================================================
// Individual Check Functions
// ============================================================================

async function checkClientBlocked(
  supabase: Awaited<ReturnType<typeof createClient>>,
  beautyPageId: string,
  clientId: string,
): Promise<BookingRestrictionCheckResult> {
  try {
    const { data, error } = await supabase.rpc("is_client_blocked", {
      p_beauty_page_id: beautyPageId,
      p_client_id: clientId,
    });

    if (error) {
      console.warn("Error checking if client is blocked:", error);
      return { allowed: true };
    }

    if (data === true) {
      return {
        allowed: false,
        reason: "blocked",
        message: "You are not able to book appointments with this specialist",
      };
    }

    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}

async function checkOverlappingAppointments(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clientId: string,
  appointmentDate: string,
  startTime: string,
  endTime: string,
): Promise<BookingRestrictionCheckResult> {
  // Query for overlapping appointments across ALL beauty pages
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("id, start_time, end_time, beauty_page_id")
    .eq("date", appointmentDate)
    .eq("client_id", clientId)
    .in("status", ["pending", "confirmed"]);

  if (error) {
    console.error("Error checking overlapping appointments:", error);
    return { allowed: true };
  }

  if (!appointments || appointments.length === 0) {
    return { allowed: true };
  }

  // Check for time overlaps
  const newStartMinutes = timeToMinutes(startTime);
  const newEndMinutes = timeToMinutes(endTime);

  for (const apt of appointments) {
    const aptStartMinutes = timeToMinutes(normalizeTime(apt.start_time));
    const aptEndMinutes = timeToMinutes(normalizeTime(apt.end_time));

    // Check overlap: new appointment overlaps if it starts before existing ends
    // AND ends after existing starts
    if (newStartMinutes < aptEndMinutes && newEndMinutes > aptStartMinutes) {
      return {
        allowed: false,
        reason: "overlapping",
        message: "You already have an appointment during this time",
      };
    }
  }

  return { allowed: true };
}

async function checkMaxFutureAppointments(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clientId: string,
  maxFuture: number,
): Promise<BookingRestrictionCheckResult> {
  const today = new Date().toISOString().split("T")[0];

  const { count, error } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId)
    .in("status", ["pending", "confirmed"])
    .gte("date", today);

  if (error) {
    console.error("Error checking future appointments:", error);
    return { allowed: true };
  }

  const currentCount = count ?? 0;

  if (currentCount >= maxFuture) {
    return {
      allowed: false,
      reason: "max_future_reached",
      message: "You have reached the maximum number of future appointments",
      current_count: currentCount,
      max_allowed: maxFuture,
    };
  }

  return { allowed: true };
}

async function checkVelocityLimits(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clientId: string,
  maxPerHour: number,
  maxPerDay: number,
  cooldownSeconds: number,
): Promise<BookingRestrictionCheckResult> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  // Get recent appointments for velocity checks
  const { data: recentAppointments, error } = await supabase
    .from("appointments")
    .select("created_at")
    .eq("client_id", clientId)
    .gte("created_at", oneDayAgo)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error checking velocity:", error);
    return { allowed: true };
  }

  if (!recentAppointments || recentAppointments.length === 0) {
    return { allowed: true };
  }

  // Check cooldown (most recent booking)
  const lastBooking = new Date(recentAppointments[0].created_at);
  const secondsSinceLastBooking = (now.getTime() - lastBooking.getTime()) / 1000;

  if (secondsSinceLastBooking < cooldownSeconds) {
    return {
      allowed: false,
      reason: "cooldown",
      message: "Please wait a moment before booking another appointment",
      wait_seconds: Math.ceil(cooldownSeconds - secondsSinceLastBooking),
    };
  }

  // Check hourly limit
  const hourlyCount = recentAppointments.filter(
    (apt) => new Date(apt.created_at) >= new Date(oneHourAgo),
  ).length;

  if (hourlyCount >= maxPerHour) {
    return {
      allowed: false,
      reason: "hourly_limit",
      message:
        "You have reached the maximum bookings per hour. Please try again later.",
      current_count: hourlyCount,
      max_allowed: maxPerHour,
    };
  }

  // Check daily limit
  if (recentAppointments.length >= maxPerDay) {
    return {
      allowed: false,
      reason: "daily_limit",
      message:
        "You have reached the maximum bookings per day. Please try again tomorrow.",
      current_count: recentAppointments.length,
      max_allowed: maxPerDay,
    };
  }

  return { allowed: true };
}

// ============================================================================
// Helper Functions
// ============================================================================

function timeToMinutes(time: string): number {
  const parts = time.split(":");
  const hours = Number.parseInt(parts[0], 10);
  const minutes = Number.parseInt(parts[1], 10);
  return hours * 60 + minutes;
}

function normalizeTime(time: string): string {
  const parts = time.split(":");
  return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
}
