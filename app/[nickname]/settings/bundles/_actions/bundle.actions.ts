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
    discountPercentage,
    serviceIds,
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

  // Create the bundle
  const { data: bundle, error: bundleError } = await supabase
    .from("service_bundles")
    .insert({
      beauty_page_id: beautyPageId,
      name,
      description: description ?? null,
      discount_percentage: discountPercentage,
      display_order: displayOrder,
      is_active: true,
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
    discountPercentage,
    serviceIds,
    isActive,
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
  if (discountPercentage !== undefined) {
    updateData.discount_percentage = discountPercentage;
  }
  if (isActive !== undefined) {
    updateData.is_active = isActive;
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
): Promise<ActionResult> {
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
