"use server";

/**
 * Special Offers Server Actions (Solo Creator Model)
 *
 * CRUD operations for managing special offers on beauty pages.
 */

import { revalidatePath } from "next/cache";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageByNickname } from "@/lib/queries";
import { getServiceById } from "@/lib/queries/services";
import { checkSpecialOfferExists } from "@/lib/queries/special-offers";
import { createClient } from "@/lib/supabase/server";
import {
  type CreateSpecialOfferSchema,
  createSpecialOfferSchema,
  type DeleteSpecialOfferSchema,
  deleteSpecialOfferSchema,
} from "../_lib/schemas";

interface ActionResult<T = void> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Create a new special offer for a time slot
 */
export async function createSpecialOffer(
  input: CreateSpecialOfferSchema,
): Promise<ActionResult<{ id: string }>> {
  const profile = await getProfile();

  if (!profile) {
    return { success: false, error: "Not authenticated" };
  }

  const parsed = createSpecialOfferSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const {
    beautyPageId,
    nickname,
    serviceId,
    date,
    startTime,
    endTime,
    discountPercentage,
  } = parsed.data;

  // Verify user has access to this beauty page
  const beautyPage = await getBeautyPageByNickname(nickname);

  if (!beautyPage || beautyPage.id !== beautyPageId) {
    return { success: false, error: "Beauty page not found" };
  }

  // Solo creator model: only owner can manage settings
  const isOwner = profile.id === beautyPage.owner_id;

  if (!isOwner) {
    return { success: false, error: "Not authorized" };
  }

  // Get service to calculate prices
  const service = await getServiceById(serviceId);

  if (!service) {
    return { success: false, error: "Service not found" };
  }

  // Check if a special offer already exists for this slot
  const exists = await checkSpecialOfferExists(
    beautyPageId,
    serviceId,
    date,
    startTime,
  );

  if (exists) {
    return {
      success: false,
      error: "A special offer already exists for this slot",
    };
  }

  // Calculate prices
  const originalPriceCents = service.price_cents;
  const discountedPriceCents = Math.round(
    originalPriceCents * (1 - discountPercentage / 100),
  );

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("special_offers")
    .insert({
      beauty_page_id: beautyPageId,
      service_id: serviceId,
      date,
      start_time: startTime,
      end_time: endTime,
      discount_percentage: discountPercentage,
      original_price_cents: originalPriceCents,
      discounted_price_cents: discountedPriceCents,
      status: "active",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating special offer:", error);
    return { success: false, error: "Failed to create special offer" };
  }

  revalidatePath(`/${nickname}/settings/special-offers`);
  revalidatePath(`/${nickname}`);

  return { success: true, data: { id: data.id } };
}

/**
 * Delete an active special offer
 */
export async function deleteSpecialOffer(
  input: DeleteSpecialOfferSchema,
): Promise<ActionResult> {
  const profile = await getProfile();

  if (!profile) {
    return { success: false, error: "Not authenticated" };
  }

  const parsed = deleteSpecialOfferSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const { id, beautyPageId, nickname } = parsed.data;

  // Verify user has access to this beauty page
  const beautyPage = await getBeautyPageByNickname(nickname);

  if (!beautyPage || beautyPage.id !== beautyPageId) {
    return { success: false, error: "Beauty page not found" };
  }

  // Solo creator model: only owner can manage settings
  const isOwner = profile.id === beautyPage.owner_id;

  if (!isOwner) {
    return { success: false, error: "Not authorized" };
  }

  const supabase = await createClient();

  // Only allow deleting active offers
  const { error } = await supabase
    .from("special_offers")
    .delete()
    .eq("id", id)
    .eq("beauty_page_id", beautyPageId)
    .eq("status", "active");

  if (error) {
    console.error("Error deleting special offer:", error);
    return { success: false, error: "Failed to delete special offer" };
  }

  revalidatePath(`/${nickname}/settings/special-offers`);
  revalidatePath(`/${nickname}`);

  return { success: true };
}
