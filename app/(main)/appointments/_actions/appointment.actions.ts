"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Cancels a client's appointment.
 * Verifies that the user owns the appointment before cancelling.
 */
export async function cancelClientAppointment(
  appointmentId: string,
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

  // Update status to cancelled
  const { error } = await supabase
    .from("appointments")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", appointmentId);

  if (error) {
    console.error("Error cancelling appointment:", error);
    return { success: false, error: t("cancel_failed") };
  }

  revalidatePath("/appointments");

  return { success: true };
}
