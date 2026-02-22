"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// ============================================================================
// Types
// ============================================================================

type ActionResult = { success: true } | { success: false; error: string };

export type AppointmentReview = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reply: {
    id: string;
    content: string;
    created_at: string;
  } | null;
};

type GetReviewResult =
  | { success: true; review: AppointmentReview | null }
  | { success: false; error: string };

// ============================================================================
// Validation
// ============================================================================

const submitReviewSchema = z.object({
  appointmentId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

// ============================================================================
// Actions
// ============================================================================

/**
 * Submit a review for a completed appointment.
 * Validates that the user is the client of the appointment and it's completed.
 */
export async function submitReview(
  appointmentId: string,
  rating: number,
  comment?: string,
): Promise<ActionResult> {
  const t = await getTranslations("appointments");
  const supabase = await createClient();

  // Validate input
  const validation = submitReviewSchema.safeParse({
    appointmentId,
    rating,
    comment,
  });
  if (!validation.success) {
    return { success: false, error: t("error_submitting_review") };
  }

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: t("not_authenticated") };
  }

  // Fetch the appointment to verify ownership and status
  const { data: appointment } = await supabase
    .from("appointments")
    .select("id, client_id, status, beauty_page_id")
    .eq("id", appointmentId)
    .single();

  if (!appointment) {
    return { success: false, error: t("error_submitting_review") };
  }

  // Verify the user owns this appointment
  if (appointment.client_id !== user.id) {
    return { success: false, error: t("error_submitting_review") };
  }

  // Only allow reviews for completed appointments
  if (appointment.status !== "completed") {
    return { success: false, error: t("error_submitting_review") };
  }

  // Check if a review already exists for this appointment
  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id")
    .eq("appointment_id", appointmentId)
    .single();

  if (existingReview) {
    // Review already exists - don't allow duplicate
    return { success: false, error: t("already_reviewed") };
  }

  // Insert the review
  const { error } = await supabase.from("reviews").insert({
    beauty_page_id: appointment.beauty_page_id,
    reviewer_id: user.id,
    appointment_id: appointmentId,
    rating,
    comment: comment?.trim() || null,
  });

  if (error) {
    console.error("Error submitting review:", error);
    return { success: false, error: t("error_submitting_review") };
  }

  revalidatePath("/appointments");
  revalidatePath(`/appointments/${appointmentId}`);

  return { success: true };
}

/**
 * Get the review for a specific appointment if it exists.
 */
export async function getAppointmentReview(
  appointmentId: string,
): Promise<GetReviewResult> {
  const t = await getTranslations("appointments");
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: t("not_authenticated") };
  }

  // Fetch the review with any reply
  const { data: review, error } = await supabase
    .from("reviews")
    .select(
      `
      id,
      rating,
      comment,
      created_at,
      review_replies (
        id,
        content,
        created_at
      )
    `,
    )
    .eq("appointment_id", appointmentId)
    .single();

  if (error) {
    // Not found is expected for appointments without reviews
    if (error.code === "PGRST116") {
      return { success: true, review: null };
    }
    console.error("Error fetching review:", error);
    return { success: false, error: t("load_failed") };
  }

  const replies = review.review_replies as Array<{
    id: string;
    content: string;
    created_at: string;
  }> | null;

  return {
    success: true,
    review: {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      reply: replies?.[0] ?? null,
    },
  };
}
