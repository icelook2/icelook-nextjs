"use server";

/**
 * Bundle Server Actions (Solo Creator Model)
 *
 * CRUD operations for managing service bundles on beauty pages.
 */

import { revalidatePath } from "next/cache";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageByNickname } from "@/lib/queries";
import {
  checkBundleNameExists,
  getNextBundleDisplayOrder,
} from "@/lib/queries/bundles";
import { createClient } from "@/lib/supabase/server";
import {
  type CreateBundleSchema,
  createBundleSchema,
  type DeleteBundleSchema,
  deleteBundleSchema,
  type ToggleBundleActiveSchema,
  toggleBundleActiveSchema,
  type UpdateBundleSchema,
  updateBundleSchema,
} from "../_lib/schemas";

interface ActionResult<T = void> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Create a new service bundle
 */
export async function createBundle(
  input: CreateBundleSchema,
): Promise<ActionResult<{ id: string }>> {
  const profile = await getProfile();

  if (!profile) {
    return { success: false, error: "Not authenticated" };
  }

  const parsed = createBundleSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const {
    beautyPageId,
    nickname,
    name,
    description,
    discountType,
    discountValue,
    discountPercentage,
    serviceIds,
    validFrom,
    validUntil,
    maxQuantity,
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

  // Check for duplicate name
  const nameExists = await checkBundleNameExists(beautyPageId, name);

  if (nameExists) {
    return { success: false, error: "A bundle with this name already exists" };
  }

  // Get next display order
  const displayOrder = await getNextBundleDisplayOrder(beautyPageId);

  const supabase = await createClient();

  // Create the bundle with new discount system and optional limits
  const { data: bundle, error: bundleError } = await supabase
    .from("service_bundles")
    .insert({
      beauty_page_id: beautyPageId,
      name,
      description: description ?? null,
      // New discount system
      discount_type: discountType ?? "percentage",
      discount_value: discountValue,
      // Legacy field (for backwards compatibility)
      discount_percentage: discountPercentage ?? discountValue,
      display_order: displayOrder,
      is_active: true,
      // Optional time limits
      valid_from: validFrom ?? null,
      valid_until: validUntil ?? null,
      // Optional quantity limit
      max_quantity: maxQuantity ?? null,
      booked_count: 0,
    })
    .select("id")
    .single();

  if (bundleError) {
    console.error("Error creating bundle:", bundleError);
    return { success: false, error: "Failed to create bundle" };
  }

  // Add services to bundle
  const bundleItems = serviceIds.map((serviceId, index) => ({
    bundle_id: bundle.id,
    service_id: serviceId,
    display_order: index,
  }));

  const { error: itemsError } = await supabase
    .from("service_bundle_items")
    .insert(bundleItems);

  if (itemsError) {
    console.error("Error adding services to bundle:", itemsError);
    // Clean up the bundle we just created
    await supabase.from("service_bundles").delete().eq("id", bundle.id);
    return { success: false, error: "Failed to add services to bundle" };
  }

  revalidatePath(`/${nickname}/settings/bundles`);
  revalidatePath(`/${nickname}`);

  return { success: true, data: { id: bundle.id } };
}

/**
 * Update an existing service bundle
 */
export async function updateBundle(
  input: UpdateBundleSchema,
): Promise<ActionResult> {
  const profile = await getProfile();

  if (!profile) {
    return { success: false, error: "Not authenticated" };
  }

  const parsed = updateBundleSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const {
    bundleId,
    beautyPageId,
    nickname,
    name,
    description,
    discountType,
    discountValue,
    discountPercentage,
    serviceIds,
    isActive,
    validFrom,
    validUntil,
    maxQuantity,
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

  // Check for duplicate name (excluding this bundle)
  if (name) {
    const nameExists = await checkBundleNameExists(
      beautyPageId,
      name,
      bundleId,
    );

    if (nameExists) {
      return {
        success: false,
        error: "A bundle with this name already exists",
      };
    }
  }

  const supabase = await createClient();

  // Build update object
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (name !== undefined) {
    updateData.name = name;
  }
  if (description !== undefined) {
    updateData.description = description;
  }
  // New discount system
  if (discountType !== undefined) {
    updateData.discount_type = discountType;
  }
  if (discountValue !== undefined) {
    updateData.discount_value = discountValue;
    // Also update legacy field for backwards compatibility
    updateData.discount_percentage = discountValue;
  }
  if (discountPercentage !== undefined && discountValue === undefined) {
    // Legacy field update (when discountValue not provided)
    updateData.discount_percentage = discountPercentage;
  }
  if (isActive !== undefined) {
    updateData.is_active = isActive;
  }
  // Time limits (allow null to remove limit)
  if (validFrom !== undefined) {
    updateData.valid_from = validFrom;
  }
  if (validUntil !== undefined) {
    updateData.valid_until = validUntil;
  }
  // Quantity limit (allow null to remove limit)
  if (maxQuantity !== undefined) {
    updateData.max_quantity = maxQuantity;
  }

  // Update bundle
  const { error: updateError } = await supabase
    .from("service_bundles")
    .update(updateData)
    .eq("id", bundleId)
    .eq("beauty_page_id", beautyPageId);

  if (updateError) {
    console.error("Error updating bundle:", updateError);
    return { success: false, error: "Failed to update bundle" };
  }

  // Update services if provided
  if (serviceIds && serviceIds.length >= 2) {
    // Delete existing items
    await supabase
      .from("service_bundle_items")
      .delete()
      .eq("bundle_id", bundleId);

    // Insert new items
    const bundleItems = serviceIds.map((serviceId, index) => ({
      bundle_id: bundleId,
      service_id: serviceId,
      display_order: index,
    }));

    const { error: itemsError } = await supabase
      .from("service_bundle_items")
      .insert(bundleItems);

    if (itemsError) {
      console.error("Error updating bundle services:", itemsError);
      return { success: false, error: "Failed to update bundle services" };
    }
  }

  revalidatePath(`/${nickname}/settings/bundles`);
  revalidatePath(`/${nickname}`);

  return { success: true };
}

/**
 * Delete a service bundle
 */
export async function deleteBundle(
  input: DeleteBundleSchema,
): Promise<ActionResult> {
  const profile = await getProfile();

  if (!profile) {
    return { success: false, error: "Not authenticated" };
  }

  const parsed = deleteBundleSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const { bundleId, beautyPageId, nickname } = parsed.data;

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

  // Delete the bundle (cascade will handle items)
  const { error } = await supabase
    .from("service_bundles")
    .delete()
    .eq("id", bundleId)
    .eq("beauty_page_id", beautyPageId);

  if (error) {
    console.error("Error deleting bundle:", error);
    return { success: false, error: "Failed to delete bundle" };
  }

  revalidatePath(`/${nickname}/settings/bundles`);
  revalidatePath(`/${nickname}`);

  return { success: true };
}

/**
 * Toggle bundle active status
 */
export async function toggleBundleActive(
  input: ToggleBundleActiveSchema,
): Promise<ActionResult<{ hiddenServices?: string[] }>> {
  const profile = await getProfile();

  if (!profile) {
    return { success: false, error: "Not authenticated" };
  }

  const parsed = toggleBundleActiveSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const { bundleId, beautyPageId, nickname, isActive } = parsed.data;

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

  // When activating, check if any services in the bundle are hidden
  if (isActive) {
    const { data: bundleItems } = await supabase
      .from("service_bundle_items")
      .select("services (id, name, is_hidden)")
      .eq("bundle_id", bundleId);

    if (bundleItems) {
      const hiddenServices = bundleItems
        .filter((item) => {
          const service = item.services as unknown as {
            id: string;
            name: string;
            is_hidden: boolean;
          } | null;
          return service?.is_hidden === true;
        })
        .map((item) => {
          const service = item.services as unknown as {
            id: string;
            name: string;
            is_hidden: boolean;
          };
          return service.name;
        });

      if (hiddenServices.length > 0) {
        return {
          success: false,
          error: "HIDDEN_SERVICES",
          data: { hiddenServices },
        };
      }
    }
  }

  const { error } = await supabase
    .from("service_bundles")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bundleId)
    .eq("beauty_page_id", beautyPageId);

  if (error) {
    console.error("Error toggling bundle status:", error);
    return { success: false, error: "Failed to update bundle status" };
  }

  revalidatePath(`/${nickname}/settings/bundles`);
  revalidatePath(`/${nickname}`);

  return { success: true };
}
