import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type CancellationPolicy = Tables<"cancellation_policies">;

export interface CancellationStats {
  cancellations: number;
  noShows: number;
  effectiveCount: number;
}

export interface ClientBlockStatus {
  blocked: boolean;
  unblocksAt?: Date;
  stats?: {
    effectiveCount: number;
    max: number;
  };
}

/**
 * Get cancellation policy for a beauty page
 */
export async function getCancellationPolicy(
  beautyPageId: string,
): Promise<CancellationPolicy | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cancellation_policies")
    .select("*")
    .eq("beauty_page_id", beautyPageId)
    .single();

  if (error) {
    // PGRST116 is "no rows returned" - not a real error for us
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Error fetching cancellation policy:", error);
    return null;
  }

  return data;
}

/**
 * Count cancellations and no-shows for a client at a beauty page within the tracking period
 */
export async function getClientCancellationStats(
  clientId: string,
  beautyPageId: string,
  periodDays: number,
  noShowMultiplier: number,
): Promise<CancellationStats> {
  const supabase = await createClient();

  // Calculate the cutoff date for the tracking period
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - periodDays);
  const cutoffDateStr = cutoffDate.toISOString().split("T")[0];

  // Query cancelled appointments within period
  const { data: cancelledAppointments, error: cancelledError } = await supabase
    .from("appointments")
    .select("id, status, cancelled_at, date")
    .eq("client_id", clientId)
    .eq("beauty_page_id", beautyPageId)
    .eq("status", "cancelled")
    .gte("cancelled_at", cutoffDate.toISOString());

  if (cancelledError) {
    console.error("Error fetching cancelled appointments:", cancelledError);
  }

  // Query no-show appointments within period
  const { data: noShowAppointments, error: noShowError } = await supabase
    .from("appointments")
    .select("id, status, date")
    .eq("client_id", clientId)
    .eq("beauty_page_id", beautyPageId)
    .eq("status", "no_show")
    .gte("date", cutoffDateStr);

  if (noShowError) {
    console.error("Error fetching no-show appointments:", noShowError);
  }

  const cancellations = cancelledAppointments?.length ?? 0;
  const noShows = noShowAppointments?.length ?? 0;
  const effectiveCount = cancellations + noShows * noShowMultiplier;

  return {
    cancellations,
    noShows,
    effectiveCount,
  };
}

/**
 * Check if a client is blocked from booking at a beauty page
 */
export async function isClientBlocked(
  clientId: string,
  beautyPageId: string,
): Promise<ClientBlockStatus> {
  // Get the cancellation policy for this beauty page
  const policy = await getCancellationPolicy(beautyPageId);

  // If no policy or policy is disabled, client is not blocked
  if (!policy || !policy.is_enabled) {
    return { blocked: false };
  }

  // Get client's cancellation stats
  const stats = await getClientCancellationStats(
    clientId,
    beautyPageId,
    policy.period_days,
    policy.no_show_multiplier,
  );

  // If client is under the limit, they're not blocked
  if (stats.effectiveCount < policy.max_cancellations) {
    return {
      blocked: false,
      stats: {
        effectiveCount: stats.effectiveCount,
        max: policy.max_cancellations,
      },
    };
  }

  // Client has exceeded the limit - find when the block ends
  const unblocksAt = await calculateUnblockDate(
    clientId,
    beautyPageId,
    policy.period_days,
    policy.block_duration_days,
  );

  // If the unblock date has passed, client is no longer blocked
  if (unblocksAt && unblocksAt <= new Date()) {
    return {
      blocked: false,
      stats: {
        effectiveCount: stats.effectiveCount,
        max: policy.max_cancellations,
      },
    };
  }

  return {
    blocked: true,
    unblocksAt: unblocksAt ?? undefined,
    stats: {
      effectiveCount: stats.effectiveCount,
      max: policy.max_cancellations,
    },
  };
}

/**
 * Calculate when a client's block will end
 * Based on the most recent cancellation/no-show that pushed them over the limit
 */
async function calculateUnblockDate(
  clientId: string,
  beautyPageId: string,
  periodDays: number,
  blockDurationDays: number,
): Promise<Date | null> {
  const supabase = await createClient();

  // Find the most recent cancellation or no-show
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - periodDays);

  // Get the most recent cancellation
  const { data: recentCancellation } = await supabase
    .from("appointments")
    .select("cancelled_at")
    .eq("client_id", clientId)
    .eq("beauty_page_id", beautyPageId)
    .eq("status", "cancelled")
    .gte("cancelled_at", cutoffDate.toISOString())
    .order("cancelled_at", { ascending: false })
    .limit(1)
    .single();

  // Get the most recent no-show
  const { data: recentNoShow } = await supabase
    .from("appointments")
    .select("date")
    .eq("client_id", clientId)
    .eq("beauty_page_id", beautyPageId)
    .eq("status", "no_show")
    .gte("date", cutoffDate.toISOString().split("T")[0])
    .order("date", { ascending: false })
    .limit(1)
    .single();

  // Find the most recent event
  let mostRecentEventDate: Date | null = null;

  if (recentCancellation?.cancelled_at) {
    mostRecentEventDate = new Date(recentCancellation.cancelled_at);
  }

  if (recentNoShow?.date) {
    const noShowDate = new Date(recentNoShow.date);
    if (!mostRecentEventDate || noShowDate > mostRecentEventDate) {
      mostRecentEventDate = noShowDate;
    }
  }

  if (!mostRecentEventDate) {
    return null;
  }

  // Block ends after blockDurationDays from the most recent event
  const unblocksAt = new Date(mostRecentEventDate);
  unblocksAt.setDate(unblocksAt.getDate() + blockDurationDays);

  return unblocksAt;
}
