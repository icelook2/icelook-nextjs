import { createClient } from "@/lib/supabase/server";
import type {
  BlockedClient,
  BookingRestrictionCheckResult,
  BookingRestrictionDefaults,
  ClientIdentifier,
  ClientNoShow,
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
 * 1. Manual blocklist
 * 2. No-show blocks
 * 3. Overlapping appointments (across all beauty pages)
 * 4. Max future appointments
 * 5. Hourly/daily velocity limits
 * 6. Cooldown between bookings
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

  // Build client identifier conditions for queries
  const clientConditions = buildClientConditions(client);

  if (!clientConditions.hasIdentifier) {
    // No client identifier - allow booking (will be tracked by phone after creation)
    return { allowed: true };
  }

  // 1. Check manual blocklist
  const blocklistResult = await checkBlocklist(
    supabase,
    beautyPageId,
    clientConditions,
  );
  if (!blocklistResult.allowed) {
    return blocklistResult;
  }

  // 2. Check no-show blocks
  const noShowResult = await checkNoShowBlock(
    supabase,
    beautyPageId,
    clientConditions,
  );
  if (!noShowResult.allowed) {
    return noShowResult;
  }

  // 3. Check overlapping appointments
  const overlapResult = await checkOverlappingAppointments(
    supabase,
    clientConditions,
    appointmentDate,
    startTime,
    endTime,
  );
  if (!overlapResult.allowed) {
    return overlapResult;
  }

  // 4. Check max future appointments
  const futureResult = await checkMaxFutureAppointments(
    supabase,
    clientConditions,
    defaults.max_future_appointments,
  );
  if (!futureResult.allowed) {
    return futureResult;
  }

  // 5. Check velocity limits
  const velocityResult = await checkVelocityLimits(
    supabase,
    clientConditions,
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

interface ClientConditions {
  hasIdentifier: boolean;
  clientId: string | null;
  clientPhone: string | null;
  clientEmail: string | null;
}

function buildClientConditions(client: ClientIdentifier): ClientConditions {
  return {
    hasIdentifier: !!(client.clientId || client.clientPhone || client.clientEmail),
    clientId: client.clientId ?? null,
    clientPhone: client.clientPhone ?? null,
    clientEmail: client.clientEmail ?? null,
  };
}

async function checkBlocklist(
  supabase: Awaited<ReturnType<typeof createClient>>,
  beautyPageId: string,
  client: ClientConditions,
): Promise<BookingRestrictionCheckResult> {
  try {
    let query = supabase
      .from("blocked_clients")
      .select("id")
      .eq("beauty_page_id", beautyPageId);

    // Build OR conditions for client identifiers
    const orConditions: string[] = [];
    if (client.clientId) {
      orConditions.push(`client_id.eq.${client.clientId}`);
    }
    if (client.clientPhone) {
      orConditions.push(`client_phone.eq.${client.clientPhone}`);
    }
    if (client.clientEmail) {
      orConditions.push(`client_email.eq.${client.clientEmail}`);
    }

    if (orConditions.length > 0) {
      query = query.or(orConditions.join(","));
    }

    const { data, error } = await query.limit(1);

    if (error) {
      // Table might not exist yet - allow booking
      console.warn("Error checking blocklist:", error);
      return { allowed: true };
    }

    if (data && data.length > 0) {
      return {
        allowed: false,
        reason: "blocked",
        message: "You are not able to book appointments with this specialist",
      };
    }

    return { allowed: true };
  } catch {
    // Table doesn't exist - allow booking
    return { allowed: true };
  }
}

async function checkNoShowBlock(
  supabase: Awaited<ReturnType<typeof createClient>>,
  beautyPageId: string,
  client: ClientConditions,
): Promise<BookingRestrictionCheckResult> {
  try {
    let query = supabase
      .from("client_no_shows")
      .select("is_blocked, blocked_until")
      .eq("beauty_page_id", beautyPageId)
      .eq("is_blocked", true);

    // Build OR conditions
    const orConditions: string[] = [];
    if (client.clientId) {
      orConditions.push(`client_id.eq.${client.clientId}`);
    }
    if (client.clientPhone) {
      orConditions.push(`client_phone.eq.${client.clientPhone}`);
    }

    if (orConditions.length > 0) {
      query = query.or(orConditions.join(","));
    }

    const { data, error } = await query.limit(1);

    if (error) {
      console.warn("Error checking no-show block:", error);
      return { allowed: true };
    }

    if (data && data.length > 0) {
      const record = data[0] as ClientNoShow;

      // Check if block has expired
      if (record.blocked_until) {
        const blockedUntil = new Date(record.blocked_until);
        if (blockedUntil <= new Date()) {
          // Block expired - allow booking
          return { allowed: true };
        }
      }

      return {
        allowed: false,
        reason: "no_show_blocked",
        message: "Booking temporarily restricted due to missed appointments",
        blocked_until: record.blocked_until ?? undefined,
      };
    }

    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}

async function checkOverlappingAppointments(
  supabase: Awaited<ReturnType<typeof createClient>>,
  client: ClientConditions,
  appointmentDate: string,
  startTime: string,
  endTime: string,
): Promise<BookingRestrictionCheckResult> {
  // Query for overlapping appointments across ALL beauty pages
  let query = supabase
    .from("appointments")
    .select("id, start_time, end_time, beauty_page_id")
    .eq("date", appointmentDate)
    .in("status", ["pending", "confirmed"]);

  // Build OR conditions for client
  const orConditions: string[] = [];
  if (client.clientId) {
    orConditions.push(`client_id.eq.${client.clientId}`);
  }
  if (client.clientPhone) {
    orConditions.push(`client_phone.eq.${client.clientPhone}`);
  }

  if (orConditions.length === 0) {
    return { allowed: true };
  }

  query = query.or(orConditions.join(","));

  const { data: appointments, error } = await query;

  if (error) {
    console.error("Error checking overlapping appointments:", error);
    // Err on side of caution - but don't block if query fails
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
  client: ClientConditions,
  maxFuture: number,
): Promise<BookingRestrictionCheckResult> {
  const today = new Date().toISOString().split("T")[0];

  let query = supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .in("status", ["pending", "confirmed"])
    .gte("date", today);

  // Build OR conditions
  const orConditions: string[] = [];
  if (client.clientId) {
    orConditions.push(`client_id.eq.${client.clientId}`);
  }
  if (client.clientPhone) {
    orConditions.push(`client_phone.eq.${client.clientPhone}`);
  }

  if (orConditions.length === 0) {
    return { allowed: true };
  }

  query = query.or(orConditions.join(","));

  const { count, error } = await query;

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
  client: ClientConditions,
  maxPerHour: number,
  maxPerDay: number,
  cooldownSeconds: number,
): Promise<BookingRestrictionCheckResult> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  // Build OR conditions
  const orConditions: string[] = [];
  if (client.clientId) {
    orConditions.push(`client_id.eq.${client.clientId}`);
  }
  if (client.clientPhone) {
    orConditions.push(`client_phone.eq.${client.clientPhone}`);
  }

  if (orConditions.length === 0) {
    return { allowed: true };
  }

  // Get recent appointments for velocity checks
  const { data: recentAppointments, error } = await supabase
    .from("appointments")
    .select("created_at")
    .gte("created_at", oneDayAgo)
    .or(orConditions.join(","))
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
// Blocklist Management
// ============================================================================

/**
 * Add a client to the blocklist
 */
export async function blockClient(
  beautyPageId: string,
  blockedBy: string,
  client: ClientIdentifier,
  reason?: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.from("blocked_clients").insert({
    beauty_page_id: beautyPageId,
    blocked_by: blockedBy,
    client_id: client.clientId ?? null,
    client_phone: client.clientPhone ?? null,
    client_email: client.clientEmail ?? null,
    reason: reason ?? null,
  });

  if (error) {
    if (error.code === "23505") {
      // Unique violation - already blocked
      return { success: true };
    }
    console.error("Error blocking client:", error);
    return { success: false, error: "Failed to block client" };
  }

  return { success: true };
}

/**
 * Remove a client from the blocklist
 */
export async function unblockClient(
  beautyPageId: string,
  client: ClientIdentifier,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  let query = supabase
    .from("blocked_clients")
    .delete()
    .eq("beauty_page_id", beautyPageId);

  if (client.clientId) {
    query = query.eq("client_id", client.clientId);
  } else if (client.clientPhone) {
    query = query.eq("client_phone", client.clientPhone);
  } else if (client.clientEmail) {
    query = query.eq("client_email", client.clientEmail);
  } else {
    return { success: false, error: "No client identifier provided" };
  }

  const { error } = await query;

  if (error) {
    console.error("Error unblocking client:", error);
    return { success: false, error: "Failed to unblock client" };
  }

  return { success: true };
}

/**
 * Get all blocked clients for a beauty page
 */
export async function getBlockedClients(
  beautyPageId: string,
): Promise<BlockedClient[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blocked_clients")
    .select("*")
    .eq("beauty_page_id", beautyPageId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching blocked clients:", error);
    return [];
  }

  return (data ?? []) as BlockedClient[];
}

// ============================================================================
// No-Show Management
// ============================================================================

/**
 * Get no-show records for a beauty page
 */
export async function getNoShowRecords(
  beautyPageId: string,
): Promise<ClientNoShow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("client_no_shows")
    .select("*")
    .eq("beauty_page_id", beautyPageId)
    .gt("no_show_count", 0)
    .order("no_show_count", { ascending: false });

  if (error) {
    console.error("Error fetching no-show records:", error);
    return [];
  }

  return (data ?? []) as ClientNoShow[];
}

/**
 * Reset no-show count for a client (forgive them)
 */
export async function resetNoShowCount(
  beautyPageId: string,
  client: ClientIdentifier,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  let query = supabase
    .from("client_no_shows")
    .update({
      no_show_count: 0,
      is_blocked: false,
      blocked_at: null,
      blocked_until: null,
      updated_at: new Date().toISOString(),
    })
    .eq("beauty_page_id", beautyPageId);

  if (client.clientId) {
    query = query.eq("client_id", client.clientId);
  } else if (client.clientPhone) {
    query = query.eq("client_phone", client.clientPhone);
  } else {
    return { success: false, error: "No client identifier provided" };
  }

  const { error } = await query;

  if (error) {
    console.error("Error resetting no-show count:", error);
    return { success: false, error: "Failed to reset no-show count" };
  }

  return { success: true };
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
