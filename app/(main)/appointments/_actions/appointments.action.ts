"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import type { Appointment } from "@/lib/appointments";
import { canCancelAppointment } from "@/lib/appointments";
import { createClient } from "@/lib/supabase/server";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

// ============================================================================
// Get Client Appointments
// ============================================================================

interface GetClientAppointmentsResult {
  upcoming: Appointment[];
  past: Appointment[];
}

/**
 * Get all appointments for the current user.
 * Separates into upcoming and past appointments.
 */
export async function getClientAppointments(): Promise<
  ActionResult<GetClientAppointmentsResult>
> {
  const t = await getTranslations("appointments");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: t("not_authenticated") };
  }

  const today = new Date().toISOString().split("T")[0];

  // Fetch all appointments for this client
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("client_id", user.id)
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
// Cancel Appointment
// ============================================================================

/**
 * Cancel an appointment (client-side).
 */
export async function cancelAppointment(
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

  // Fetch the appointment
  const { data: appointment, error: fetchError } = await supabase
    .from("appointments")
    .select(
      "*, specialist_booking_settings:specialist_id(cancellation_notice_hours, allow_client_cancellation)",
    )
    .eq("id", appointmentId)
    .eq("client_id", user.id)
    .single();

  if (fetchError || !appointment) {
    return { success: false, error: t("cancel_failed") };
  }

  // Check if cancellation is allowed
  const settings = appointment.specialist_booking_settings;
  const allowCancellation = settings?.allow_client_cancellation ?? true;
  const cancellationNoticeHours = settings?.cancellation_notice_hours ?? 24;

  if (!allowCancellation) {
    return { success: false, error: t("cancel_failed") };
  }

  // Check cancellation notice period
  if (
    !canCancelAppointment(
      appointment.date,
      appointment.start_time,
      cancellationNoticeHours,
    )
  ) {
    return {
      success: false,
      error: t("cannot_cancel", { hours: cancellationNoticeHours }),
    };
  }

  // Update appointment status
  const { error: updateError } = await supabase
    .from("appointments")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", appointmentId);

  if (updateError) {
    return { success: false, error: t("cancel_failed") };
  }

  revalidatePath("/appointments");

  return { success: true };
}
