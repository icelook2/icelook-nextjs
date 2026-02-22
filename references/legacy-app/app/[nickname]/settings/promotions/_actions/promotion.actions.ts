"use server";

/**
 * Promotion Server Actions (Solo Creator Model)
 *
 * CRUD operations for managing promotions on beauty pages.
 * Supports three promotion types: sale, slot, and time.
 */

import { revalidatePath } from "next/cache";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageByNickname } from "@/lib/queries";
import {
  checkSlotPromotionExists,
  checkTimePromotionExists,
} from "@/lib/queries/promotions";
import { getServiceById } from "@/lib/queries/services";
import { createClient } from "@/lib/supabase/server";
import {
  type CreatePromotionSchema,
  createPromotionSchema,
  type DeletePromotionSchema,
  deletePromotionSchema,
} from "../_lib/schemas";

interface ActionResult<T = void> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Create a new promotion
 * Supports: sale (discount until date), slot (specific time slot), time (recurring time)
 */
export async function createPromotion(
  input: CreatePromotionSchema,
): Promise<ActionResult<{ id: string }>> {
  const profile = await getProfile();

  if (!profile) {
    return { success: false, error: "Not authenticated" };
  }

  const parsed = createPromotionSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const {
    beautyPageId,
    nickname,
    serviceId,
    type,
    discountPercentage,
    // Sale fields
    startsAt,
    endsAt,
    // Slot fields
    slotDate,
    slotStartTime,
    slotEndTime,
    // Time fields
    recurringStartTime,
    recurringDays,
    recurringValidUntil,
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

  // Check for duplicate promotions based on type
  if (type === "slot" && slotDate && slotStartTime) {
    const exists = await checkSlotPromotionExists(
      beautyPageId,
      serviceId,
      slotDate,
      slotStartTime,
    );

    if (exists) {
      return {
        success: false,
        error: "A slot promotion already exists for this time",
      };
    }
  }

  if (type === "time" && recurringStartTime) {
    const exists = await checkTimePromotionExists(
      beautyPageId,
      serviceId,
      recurringStartTime,
    );

    if (exists) {
      return {
        success: false,
        error: "A time promotion already exists for this time",
      };
    }
  }

  // Calculate prices
  const originalPriceCents = service.price_cents;
  const discountedPriceCents = Math.round(
    originalPriceCents * (1 - discountPercentage / 100),
  );

  const supabase = await createClient();

  // Build insert data based on type
  const insertData: Record<string, unknown> = {
    beauty_page_id: beautyPageId,
    service_id: serviceId,
    type,
    discount_percentage: discountPercentage,
    original_price_cents: originalPriceCents,
    discounted_price_cents: discountedPriceCents,
    status: "active",
  };

  // Add type-specific fields
  if (type === "sale") {
    insertData.starts_at = startsAt ?? new Date().toISOString().split("T")[0];
    insertData.ends_at = endsAt;
  } else if (type === "slot") {
    insertData.slot_date = slotDate;
    insertData.slot_start_time = slotStartTime;
    insertData.slot_end_time = slotEndTime;
  } else if (type === "time") {
    insertData.recurring_start_time = recurringStartTime;
    insertData.recurring_days = recurringDays ?? null; // null = every day
    insertData.recurring_valid_until = recurringValidUntil ?? null;
  }

  const { data, error } = await supabase
    .from("promotions")
    .insert(insertData)
    .select("id")
    .single();

  if (error) {
    console.error("Error creating promotion:", error);
    return { success: false, error: "Failed to create promotion" };
  }

  revalidatePath(`/${nickname}/settings/promotions`);
  revalidatePath(`/${nickname}`);

  return { success: true, data: { id: data.id } };
}

/**
 * Delete a promotion
 */
export async function deletePromotion(
  input: DeletePromotionSchema,
): Promise<ActionResult> {
  const profile = await getProfile();

  if (!profile) {
    return { success: false, error: "Not authenticated" };
  }

  const parsed = deletePromotionSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const { promotionId, beautyPageId, nickname } = parsed.data;

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

  // Delete the promotion (only active/inactive, not booked)
  const { error } = await supabase
    .from("promotions")
    .delete()
    .eq("id", promotionId)
    .eq("beauty_page_id", beautyPageId)
    .in("status", ["active", "inactive"]);

  if (error) {
    console.error("Error deleting promotion:", error);
    return { success: false, error: "Failed to delete promotion" };
  }

  revalidatePath(`/${nickname}/settings/promotions`);
  revalidatePath(`/${nickname}`);

  return { success: true };
}
