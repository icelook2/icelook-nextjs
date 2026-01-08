/**
 * Cancellation Policy Queries (Solo Creator Model)
 *
 * Simplified cancellation policies for solo creator beauty pages.
 * Policies define whether cancellations are allowed, notice requirements,
 * and any cancellation fees.
 */

import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type CancellationPolicy = Tables<"cancellation_policies">;

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
 * Check if a client can cancel an appointment
 * Returns true if cancellation is allowed based on policy and timing
 */
export function canCancelAppointment(
  policy: CancellationPolicy | null,
  appointmentDate: Date,
  appointmentTime: string,
): { allowed: boolean; reason?: string; feePercentage?: number } {
  // If no policy exists, allow cancellation with no fee
  if (!policy) {
    return { allowed: true };
  }

  // If cancellations are not allowed at all
  if (!policy.allow_cancellation) {
    return { allowed: false, reason: "cancellations_not_allowed" };
  }

  // Parse appointment datetime
  const [hours, minutes] = appointmentTime.split(":").map(Number);
  const appointmentDateTime = new Date(appointmentDate);
  appointmentDateTime.setHours(hours, minutes, 0, 0);

  // Check notice period
  const now = new Date();
  const hoursUntilAppointment =
    (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilAppointment < policy.cancellation_notice_hours) {
    // Within notice period - cancellation may incur a fee
    if (policy.cancellation_fee_percentage > 0) {
      return {
        allowed: true,
        reason: "late_cancellation_fee",
        feePercentage: policy.cancellation_fee_percentage,
      };
    }
    // Even within notice period, if no fee is set, allow cancellation
    return { allowed: true };
  }

  // Outside notice period - free cancellation
  return { allowed: true };
}
