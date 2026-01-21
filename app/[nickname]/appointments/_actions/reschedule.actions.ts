"use server";

/**
 * Reschedule Actions
 *
 * Server actions for fetching data needed for the reschedule flow.
 */

import { getServiceForRebooking, type RebookingData } from "@/lib/queries/services";

// ============================================================================
// Types
// ============================================================================

// Reuse RebookingData since it has all the data we need for rescheduling
export type RescheduleServiceData = RebookingData;

// ============================================================================
// Actions
// ============================================================================

/**
 * Get service data needed for rescheduling an appointment.
 * Reuses the rebooking query since it fetches the same data.
 */
export async function getRescheduleData(
  serviceId: string,
): Promise<RescheduleServiceData | null> {
  return getServiceForRebooking(serviceId);
}
