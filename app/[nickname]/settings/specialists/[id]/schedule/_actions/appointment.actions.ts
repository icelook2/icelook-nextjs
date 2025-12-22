"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

type AuthorizationResult =
  | { authorized: true; userId: string }
  | { authorized: false; error: string };

/**
 * Verify user can manage schedule for a specialist
 */
async function verifyCanManageSchedule(
  beautyPageId: string,
): Promise<AuthorizationResult> {
  const supabase = await createClient();
  const t = await getTranslations("schedule");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false, error: t("errors.not_authenticated") };
  }

  const { data: beautyPage } = await supabase
    .from("beauty_pages")
    .select("owner_id")
    .eq("id", beautyPageId)
    .single();

  if (beautyPage?.owner_id === user.id) {
    return { authorized: true, userId: user.id };
  }

  const { data: member } = await supabase
    .from("beauty_page_members")
    .select("roles")
    .eq("beauty_page_id", beautyPageId)
    .eq("user_id", user.id)
    .single();

  if (member?.roles?.includes("admin")) {
    return { authorized: true, userId: user.id };
  }

  return { authorized: false, error: t("errors.not_authorized") };
}

// Validation schemas
const appointmentStatusSchema = z.enum([
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
]);

const updateStatusSchema = z.object({
  status: appointmentStatusSchema,
  reason: z.string().max(500).optional(),
});

/**
 * Update appointment status
 */
export async function updateAppointmentStatus(input: {
  appointmentId: string;
  beautyPageId: string;
  nickname: string;
  status: string;
  reason?: string;
}): Promise<ActionResult> {
  const t = await getTranslations("schedule");

  // Validate input
  const validation = updateStatusSchema.safeParse({
    status: input.status,
    reason: input.reason,
  });

  if (!validation.success) {
    return { success: false, error: t("errors.validation_failed") };
  }

  // Check authorization
  const authorization = await verifyCanManageSchedule(input.beautyPageId);
  if (!authorization.authorized) {
    return { success: false, error: authorization.error };
  }

  const supabase = await createClient();

  // Get current appointment status
  const { data: current } = await supabase
    .from("appointments")
    .select("status")
    .eq("id", input.appointmentId)
    .single();

  if (!current) {
    return { success: false, error: t("errors.not_found") };
  }

  // Validate status transition
  const validTransitions: Record<string, string[]> = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["completed", "cancelled", "no_show"],
    completed: [], // Terminal state
    cancelled: [], // Terminal state
    no_show: [], // Terminal state
  };

  const allowed = validTransitions[current.status] ?? [];
  if (!allowed.includes(validation.data.status)) {
    return { success: false, error: t("errors.invalid_status_transition") };
  }

  // Update status
  const updateData: Record<string, unknown> = {
    status: validation.data.status,
  };

  if (validation.data.status === "cancelled") {
    updateData.cancelled_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from("appointments")
    .update(updateData)
    .eq("id", input.appointmentId);

  if (updateError) {
    console.error("Error updating appointment status:", updateError);
    return { success: false, error: t("errors.update_failed") };
  }

  // Record status change in history
  const { error: historyError } = await supabase
    .from("appointment_status_history")
    .insert({
      appointment_id: input.appointmentId,
      old_status: current.status,
      new_status: validation.data.status,
      changed_by: authorization.userId,
      reason: validation.data.reason ?? null,
    });

  if (historyError) {
    console.error("Error recording status history:", historyError);
    // Don't fail the action, history is secondary
  }

  revalidatePath(`/${input.nickname}/settings/specialists`);

  return { success: true };
}

/**
 * Cancel an appointment
 */
export async function cancelAppointment(input: {
  appointmentId: string;
  beautyPageId: string;
  nickname: string;
  reason?: string;
}): Promise<ActionResult> {
  return updateAppointmentStatus({
    ...input,
    status: "cancelled",
  });
}

/**
 * Confirm an appointment
 */
export async function confirmAppointment(input: {
  appointmentId: string;
  beautyPageId: string;
  nickname: string;
}): Promise<ActionResult> {
  return updateAppointmentStatus({
    ...input,
    status: "confirmed",
  });
}

/**
 * Mark appointment as completed
 */
export async function completeAppointment(input: {
  appointmentId: string;
  beautyPageId: string;
  nickname: string;
}): Promise<ActionResult> {
  return updateAppointmentStatus({
    ...input,
    status: "completed",
  });
}

/**
 * Mark appointment as no-show
 */
export async function markNoShow(input: {
  appointmentId: string;
  beautyPageId: string;
  nickname: string;
}): Promise<ActionResult> {
  return updateAppointmentStatus({
    ...input,
    status: "no_show",
  });
}

/**
 * Add specialist notes to an appointment
 */
export async function updateAppointmentNotes(input: {
  appointmentId: string;
  beautyPageId: string;
  nickname: string;
  notes: string;
}): Promise<ActionResult> {
  const t = await getTranslations("schedule");

  // Check authorization
  const authorization = await verifyCanManageSchedule(input.beautyPageId);
  if (!authorization.authorized) {
    return { success: false, error: authorization.error };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("appointments")
    .update({ specialist_notes: input.notes || null })
    .eq("id", input.appointmentId);

  if (error) {
    console.error("Error updating appointment notes:", error);
    return { success: false, error: t("errors.update_failed") };
  }

  revalidatePath(`/${input.nickname}/settings/specialists`);

  return { success: true };
}
