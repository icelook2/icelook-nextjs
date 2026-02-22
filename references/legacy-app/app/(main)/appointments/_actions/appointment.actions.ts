"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import {
  type ClientAppointment,
  getClientPastAppointments,
  PAST_APPOINTMENTS_PAGE_SIZE,
} from "@/lib/queries/appointments";
import type { Enums } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { success: true } | { success: false; error: string };
type ClientCancellationReason = Enums<"client_cancellation_reason">;

type LoadMoreResult =
  | { success: true; results: ClientAppointment[]; hasMore: boolean }
  | { success: false; error: string };

/**
 * Load more past appointments with pagination.
 */
export async function loadMorePastAppointments(
  offset: number,
): Promise<LoadMoreResult> {
  const t = await getTranslations("appointments");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: t("not_authenticated") };
  }

  try {
    const { results, hasMore } = await getClientPastAppointments(user.id, {
      offset,
      limit: PAST_APPOINTMENTS_PAGE_SIZE,
    });

    return { success: true, results, hasMore };
  } catch (error) {
    console.error("Error loading more past appointments:", error);
    return { success: false, error: t("load_failed") };
  }
}

/**
 * Cancels a client's appointment.
 * Verifies that the user owns the appointment before cancelling.
 */
export async function cancelClientAppointment(
  appointmentId: string,
  reason: ClientCancellationReason,
): Promise<ActionResult> {
  const t = await getTranslations("appointments");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: t("not_authenticated") };
  }

  // Fetch the appointment and verify ownership
  const { data: appointment } = await supabase
    .from("appointments")
    .select("id, client_id, status")
    .eq("id", appointmentId)
    .single();

  if (!appointment) {
    return { success: false, error: t("cancel_failed") };
  }

  // Verify the user owns this appointment
  if (appointment.client_id !== user.id) {
    return { success: false, error: t("cancel_failed") };
  }

  // Only allow cancellation of pending/confirmed appointments
  if (appointment.status !== "pending" && appointment.status !== "confirmed") {
    return { success: false, error: t("cancel_failed") };
  }

  // Update status to cancelled with reason
  const { error } = await supabase
    .from("appointments")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by: "client",
      client_cancellation_reason: reason,
    })
    .eq("id", appointmentId);

  if (error) {
    console.error("Error cancelling appointment:", error);
    return { success: false, error: t("cancel_failed") };
  }

  revalidatePath("/appointments");
  revalidatePath(`/appointments/${appointmentId}`);

  return { success: true };
}
