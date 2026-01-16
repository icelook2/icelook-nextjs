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
 * Verify user can manage schedule for a beauty page
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

  revalidatePath(`/${input.nickname}/schedule`);

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
 * Start an appointment early by updating start_time to NOW
 * This allows clients who arrive early to be served immediately
 */
export async function startAppointmentEarly(input: {
  appointmentId: string;
  beautyPageId: string;
  nickname: string;
}): Promise<ActionResult> {
  const t = await getTranslations("schedule");

  // Check authorization
  const authorization = await verifyCanManageSchedule(input.beautyPageId);
  if (!authorization.authorized) {
    return { success: false, error: authorization.error };
  }

  const supabase = await createClient();

  // Get appointment
  const { data: appointment } = await supabase
    .from("appointments")
    .select("id, status, start_time, end_time, service_duration_minutes")
    .eq("id", input.appointmentId)
    .eq("beauty_page_id", input.beautyPageId)
    .single();

  if (!appointment) {
    return { success: false, error: t("errors.not_found") };
  }

  // Only confirmed appointments can be started early
  if (appointment.status !== "confirmed") {
    return { success: false, error: t("errors.invalid_status_transition") };
  }

  // Calculate new times - start now, end based on duration
  const now = new Date();
  const newStartTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  const newEndMinutes =
    timeToMinutes(newStartTime) + appointment.service_duration_minutes;
  const newEndTime = minutesToTime(newEndMinutes);

  // Update appointment start/end times
  const { error: updateError } = await supabase
    .from("appointments")
    .update({
      start_time: newStartTime,
      end_time: newEndTime,
    })
    .eq("id", input.appointmentId);

  if (updateError) {
    console.error("Error starting appointment early:", updateError);
    return { success: false, error: t("errors.update_failed") };
  }

  revalidatePath(`/${input.nickname}/appointments`);
  revalidatePath(`/${input.nickname}/appointments/${input.appointmentId}`);

  return { success: true };
}

// Validation schema for reschedule
const rescheduleSchema = z.object({
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  newStartTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  newEndTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
});

/**
 * Reschedule an appointment to a new date/time
 * Used for drag-and-drop rescheduling
 */
export async function rescheduleAppointment(input: {
  appointmentId: string;
  beautyPageId: string;
  nickname: string;
  newDate: string;
  newStartTime: string;
  newEndTime: string;
}): Promise<ActionResult> {
  const t = await getTranslations("schedule");

  // Validate input
  const validation = rescheduleSchema.safeParse({
    newDate: input.newDate,
    newStartTime: input.newStartTime,
    newEndTime: input.newEndTime,
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

  // Get appointment to verify it exists and can be rescheduled
  const { data: appointment } = await supabase
    .from("appointments")
    .select("id, status, date, start_time, end_time")
    .eq("id", input.appointmentId)
    .single();

  if (!appointment) {
    return { success: false, error: t("errors.not_found") };
  }

  // Only pending/confirmed can be rescheduled
  if (!["pending", "confirmed"].includes(appointment.status)) {
    return { success: false, error: t("errors.cannot_reschedule_status") };
  }

  // Normalize time format (strip seconds if present)
  const normalizedStartTime = input.newStartTime.substring(0, 5);
  const normalizedEndTime = input.newEndTime.substring(0, 5);

  // Check for conflicts with other appointments
  const { data: conflicts } = await supabase
    .from("appointments")
    .select("id")
    .eq("beauty_page_id", input.beautyPageId)
    .eq("date", input.newDate)
    .neq("id", input.appointmentId)
    .not("status", "in", '("cancelled","no_show")')
    .or(
      `and(start_time.lt.${normalizedEndTime},end_time.gt.${normalizedStartTime})`,
    );

  if (conflicts && conflicts.length > 0) {
    return { success: false, error: t("errors.slot_conflict") };
  }

  // Update the appointment
  const { error: updateError } = await supabase
    .from("appointments")
    .update({
      date: input.newDate,
      start_time: normalizedStartTime,
      end_time: normalizedEndTime,
    })
    .eq("id", input.appointmentId);

  if (updateError) {
    console.error("Error rescheduling appointment:", updateError);
    return { success: false, error: t("errors.update_failed") };
  }

  revalidatePath(`/${input.nickname}/schedule`);

  return { success: true };
}

const creatorNotesSchema = z.object({
  notes: z.string().max(2000),
});

/**
 * Update creator's private notes for an appointment
 */
export async function updateCreatorNotes(input: {
  appointmentId: string;
  beautyPageId: string;
  nickname: string;
  notes: string;
}): Promise<ActionResult> {
  const t = await getTranslations("schedule");

  // Validate input
  const validation = creatorNotesSchema.safeParse({ notes: input.notes });
  if (!validation.success) {
    return { success: false, error: t("errors.validation_failed") };
  }

  // Check authorization
  const authorization = await verifyCanManageSchedule(input.beautyPageId);
  if (!authorization.authorized) {
    return { success: false, error: authorization.error };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("appointments")
    .update({ creator_notes: validation.data.notes || null })
    .eq("id", input.appointmentId)
    .eq("beauty_page_id", input.beautyPageId);

  if (error) {
    console.error("Error updating creator notes:", error);
    return { success: false, error: t("errors.update_failed") };
  }

  revalidatePath(`/${input.nickname}/appointments/${input.appointmentId}`);

  return { success: true };
}

// ============================================================================
// Service Management Actions
// ============================================================================

export type OverlapCheckResult = {
  wouldOverlap: boolean;
  newEndTime: string;
  nextAppointment: { start_time: string; client_name: string } | null;
  serviceDuration: number;
  serviceName: string;
};

/**
 * Check if adding a service would cause overlap with the next appointment
 */
export async function checkServiceAdditionOverlap(input: {
  appointmentId: string;
  beautyPageId: string;
  serviceId: string;
}): Promise<ActionResult<OverlapCheckResult>> {
  const t = await getTranslations("schedule");

  // Check authorization
  const authorization = await verifyCanManageSchedule(input.beautyPageId);
  if (!authorization.authorized) {
    return { success: false, error: authorization.error };
  }

  const supabase = await createClient();

  // Get the appointment
  const { data: appointment } = await supabase
    .from("appointments")
    .select("date, start_time, end_time, status")
    .eq("id", input.appointmentId)
    .eq("beauty_page_id", input.beautyPageId)
    .single();

  if (!appointment) {
    return { success: false, error: t("errors.not_found") };
  }

  // Check if appointment can be modified
  if (!["pending", "confirmed"].includes(appointment.status)) {
    return { success: false, error: t("errors.cannot_modify_status") };
  }

  // Get the service to add
  const { data: service } = await supabase
    .from("services")
    .select("id, name, duration_minutes, price_cents")
    .eq("id", input.serviceId)
    .single();

  if (!service) {
    return { success: false, error: t("errors.service_not_found") };
  }

  // Calculate new end time
  const currentEndMinutes = timeToMinutes(appointment.end_time);
  const newEndMinutes = currentEndMinutes + service.duration_minutes;
  const newEndTime = minutesToTime(newEndMinutes);

  // Get next appointment on the same day
  const { data: nextAppointment } = await supabase
    .from("appointments")
    .select("start_time, client_name")
    .eq("beauty_page_id", input.beautyPageId)
    .eq("date", appointment.date)
    .gt("start_time", appointment.end_time)
    .neq("id", input.appointmentId)
    .not("status", "in", '("cancelled","no_show")')
    .order("start_time", { ascending: true })
    .limit(1)
    .maybeSingle();

  // Check if new end time would overlap with next appointment
  const wouldOverlap = nextAppointment
    ? timeToMinutes(newEndTime) > timeToMinutes(nextAppointment.start_time)
    : false;

  return {
    success: true,
    data: {
      wouldOverlap,
      newEndTime,
      nextAppointment,
      serviceDuration: service.duration_minutes,
      serviceName: service.name,
    },
  };
}

/**
 * Add a service to an appointment
 */
export async function addServiceToAppointment(input: {
  appointmentId: string;
  beautyPageId: string;
  nickname: string;
  serviceId: string;
  extendDuration: boolean;
}): Promise<ActionResult> {
  const t = await getTranslations("schedule");

  // Check authorization
  const authorization = await verifyCanManageSchedule(input.beautyPageId);
  if (!authorization.authorized) {
    return { success: false, error: authorization.error };
  }

  const supabase = await createClient();

  // Get the appointment
  const { data: appointment } = await supabase
    .from("appointments")
    .select("date, start_time, end_time, status, service_price_cents")
    .eq("id", input.appointmentId)
    .eq("beauty_page_id", input.beautyPageId)
    .single();

  if (!appointment) {
    return { success: false, error: t("errors.not_found") };
  }

  // Check if appointment can be modified
  if (!["pending", "confirmed"].includes(appointment.status)) {
    return { success: false, error: t("errors.cannot_modify_status") };
  }

  // Get the service to add
  const { data: service } = await supabase
    .from("services")
    .select("id, name, duration_minutes, price_cents")
    .eq("id", input.serviceId)
    .single();

  if (!service) {
    return { success: false, error: t("errors.service_not_found") };
  }

  // Insert the new appointment service
  const { error: insertError } = await supabase
    .from("appointment_services")
    .insert({
      appointment_id: input.appointmentId,
      service_id: service.id,
      service_name: service.name,
      duration_minutes: service.duration_minutes,
      price_cents: service.price_cents,
    });

  if (insertError) {
    console.error("Error adding service to appointment:", insertError);
    return { success: false, error: t("errors.update_failed") };
  }

  // Update appointment end_time and total price if extending duration
  if (input.extendDuration) {
    const currentEndMinutes = timeToMinutes(appointment.end_time);
    const newEndMinutes = currentEndMinutes + service.duration_minutes;
    const newEndTime = minutesToTime(newEndMinutes);

    const { error: updateError } = await supabase
      .from("appointments")
      .update({
        end_time: newEndTime,
        service_price_cents:
          appointment.service_price_cents + service.price_cents,
        service_duration_minutes:
          timeToMinutes(newEndTime) - timeToMinutes(appointment.start_time),
      })
      .eq("id", input.appointmentId);

    if (updateError) {
      console.error("Error updating appointment end time:", updateError);
      // Service was added, but end time update failed - don't roll back
    }
  } else {
    // Just update the total price
    const { error: updateError } = await supabase
      .from("appointments")
      .update({
        service_price_cents:
          appointment.service_price_cents + service.price_cents,
      })
      .eq("id", input.appointmentId);

    if (updateError) {
      console.error("Error updating appointment price:", updateError);
    }
  }

  revalidatePath(`/${input.nickname}/appointments/${input.appointmentId}`);

  return { success: true };
}

/**
 * Remove a service from an appointment
 */
export async function removeServiceFromAppointment(input: {
  appointmentId: string;
  beautyPageId: string;
  nickname: string;
  appointmentServiceId: string;
}): Promise<ActionResult> {
  const t = await getTranslations("schedule");

  // Check authorization
  const authorization = await verifyCanManageSchedule(input.beautyPageId);
  if (!authorization.authorized) {
    return { success: false, error: authorization.error };
  }

  const supabase = await createClient();

  // Get the appointment
  const { data: appointment } = await supabase
    .from("appointments")
    .select("id, status, start_time, end_time, service_price_cents")
    .eq("id", input.appointmentId)
    .eq("beauty_page_id", input.beautyPageId)
    .single();

  if (!appointment) {
    return { success: false, error: t("errors.not_found") };
  }

  // Check if appointment can be modified
  if (!["pending", "confirmed"].includes(appointment.status)) {
    return { success: false, error: t("errors.cannot_modify_status") };
  }

  // Count services to prevent removing the last one
  const { count } = await supabase
    .from("appointment_services")
    .select("*", { count: "exact", head: true })
    .eq("appointment_id", input.appointmentId);

  if (count === null || count <= 1) {
    return { success: false, error: t("errors.cannot_remove_last_service") };
  }

  // Get the service being removed (to update duration/price)
  const { data: serviceToRemove } = await supabase
    .from("appointment_services")
    .select("duration_minutes, price_cents")
    .eq("id", input.appointmentServiceId)
    .eq("appointment_id", input.appointmentId)
    .single();

  if (!serviceToRemove) {
    return { success: false, error: t("errors.service_not_found") };
  }

  // Remove the service
  const { error: deleteError } = await supabase
    .from("appointment_services")
    .delete()
    .eq("id", input.appointmentServiceId)
    .eq("appointment_id", input.appointmentId);

  if (deleteError) {
    console.error("Error removing service from appointment:", deleteError);
    return { success: false, error: t("errors.update_failed") };
  }

  // Update appointment end_time and total price
  const currentEndMinutes = timeToMinutes(appointment.end_time);
  const newEndMinutes = currentEndMinutes - serviceToRemove.duration_minutes;
  const newEndTime = minutesToTime(newEndMinutes);

  const { error: updateError } = await supabase
    .from("appointments")
    .update({
      end_time: newEndTime,
      service_price_cents:
        appointment.service_price_cents - serviceToRemove.price_cents,
      service_duration_minutes:
        timeToMinutes(newEndTime) - timeToMinutes(appointment.start_time),
    })
    .eq("id", input.appointmentId);

  if (updateError) {
    console.error(
      "Error updating appointment after service removal:",
      updateError,
    );
    // Service was removed, but update failed - don't roll back
  }

  revalidatePath(`/${input.nickname}/appointments/${input.appointmentId}`);

  return { success: true };
}

// Helper functions for time calculations
function timeToMinutes(time: string): number {
  const parts = time.split(":");
  const hours = Number.parseInt(parts[0], 10);
  const minutes = Number.parseInt(parts[1], 10);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}
