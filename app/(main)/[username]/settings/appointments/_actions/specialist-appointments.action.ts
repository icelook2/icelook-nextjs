"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import type { Appointment, AppointmentStatus } from "@/lib/appointments";
import { createClient } from "@/lib/supabase/server";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

// ============================================================================
// Get Specialist Appointments
// ============================================================================

interface GetSpecialistAppointmentsParams {
  specialistId: string;
}

interface GetSpecialistAppointmentsResult {
  upcoming: Appointment[];
  past: Appointment[];
}

/**
 * Get all appointments for a specialist.
 * Separates into upcoming and past appointments.
 */
export async function getSpecialistAppointments(
  params: GetSpecialistAppointmentsParams,
): Promise<ActionResult<GetSpecialistAppointmentsResult>> {
  const t = await getTranslations("specialist.settings.appointments");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: t("action_failed") };
  }

  // Verify the specialist belongs to this user
  const { data: specialist } = await supabase
    .from("specialists")
    .select("id")
    .eq("id", params.specialistId)
    .eq("user_id", user.id)
    .single();

  if (!specialist) {
    return { success: false, error: t("action_failed") };
  }

  const today = new Date().toISOString().split("T")[0];

  // Fetch all appointments for this specialist
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("specialist_id", params.specialistId)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  // Separate upcoming and past
  const upcoming: Appointment[] = [];
  const past: Appointment[] = [];

  for (const apt of appointments || []) {
    const aptDate = apt.date;
    const isUpcoming = aptDate >= today;
    const isActiveStatus = ["pending", "confirmed"].includes(apt.status);

    if (isUpcoming && isActiveStatus) {
      upcoming.push(apt as Appointment);
    } else {
      past.push(apt as Appointment);
    }
  }

  // Sort past by most recent first
  past.reverse();

  return { success: true, data: { upcoming, past } };
}

// ============================================================================
// Update Appointment Status
// ============================================================================

interface UpdateAppointmentStatusParams {
  appointmentId: string;
  status: AppointmentStatus;
}

/**
 * Update an appointment's status (confirm, complete, cancel, mark as no-show).
 */
export async function updateAppointmentStatus(
  params: UpdateAppointmentStatusParams,
): Promise<ActionResult> {
  const t = await getTranslations("specialist.settings.appointments");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: t("action_failed") };
  }

  // Fetch the appointment and verify ownership
  const { data: appointment, error: fetchError } = await supabase
    .from("appointments")
    .select("*, specialists!inner(user_id)")
    .eq("id", params.appointmentId)
    .single();

  if (fetchError || !appointment) {
    return { success: false, error: t("action_failed") };
  }

  // Verify the specialist belongs to this user
  if (appointment.specialists.user_id !== user.id) {
    return { success: false, error: t("action_failed") };
  }

  // Build update object
  const updateData: Record<string, unknown> = {
    status: params.status,
    updated_at: new Date().toISOString(),
  };

  if (params.status === "cancelled") {
    updateData.cancelled_at = new Date().toISOString();
  }

  // Update appointment status
  const { error: updateError } = await supabase
    .from("appointments")
    .update(updateData)
    .eq("id", params.appointmentId);

  if (updateError) {
    return { success: false, error: t("action_failed") };
  }

  // Revalidate the appointments page
  revalidatePath(`/@${appointment.specialist_username}/settings/appointments`);

  return { success: true };
}
