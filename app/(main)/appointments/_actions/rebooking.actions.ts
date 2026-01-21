"use server";

import {
  getServiceForRebooking,
  type RebookingData,
} from "@/lib/queries/services";

/**
 * Server action to fetch all data needed for rebooking a service.
 * Called when user clicks "Book Again" on a past appointment.
 */
export async function getRebookingData(
  serviceId: string,
): Promise<RebookingData | null> {
  return getServiceForRebooking(serviceId);
}
