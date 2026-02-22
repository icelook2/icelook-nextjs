"use server";

/**
 * Resource Server Actions (Solo Creator Model)
 *
 * CRUD operations for managing resources (consumables/inventory) on beauty pages.
 */

import { revalidatePath } from "next/cache";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageByNickname } from "@/lib/queries";
import {
  checkResourceNameExists,
  getNextResourceDisplayOrder,
} from "@/lib/queries/resources";
import { createClient } from "@/lib/supabase/server";
import {
  type CreateResourceSchema,
  createResourceSchema,
  type UpdateResourceSchema,
  updateResourceSchema,
  type DeleteResourceSchema,
  deleteResourceSchema,
  type AdjustStockSchema,
  adjustStockSchema,
  type ToggleResourceActiveSchema,
  toggleResourceActiveSchema,
  type LinkServiceResourceSchema,
  linkServiceResourceSchema,
  type UnlinkServiceResourceSchema,
  unlinkServiceResourceSchema,
  type UpdateServiceResourceSchema,
  updateServiceResourceSchema,
} from "../_lib/schemas";

interface ActionResult<T = void> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Create a new resource
 */
export async function createResource(
  input: CreateResourceSchema,
): Promise<ActionResult<{ id: string }>> {
  const profile = await getProfile();

  if (!profile) {
    return { success: false, error: "Not authenticated" };
  }

  const parsed = createResourceSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const {
    beautyPageId,
    nickname,
    name,
    unit,
    costPerUnitCents,
    currentStock,
    lowStockThreshold,
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
  const nameExists = await checkResourceNameExists(beautyPageId, name);

  if (nameExists) {
    return {
      success: false,
      error: "A resource with this name already exists",
    };
  }

  // Get next display order
  const displayOrder = await getNextResourceDisplayOrder(beautyPageId);

  const supabase = await createClient();

  // Create the resource
  const { data: resource, error: resourceError } = await supabase
    .from("resources")
    .insert({
      beauty_page_id: beautyPageId,
      name,
      unit,
      cost_per_unit_cents: costPerUnitCents ?? 0,
      current_stock: currentStock ?? 0,
      low_stock_threshold: lowStockThreshold ?? null,
      display_order: displayOrder,
      is_active: true,
    })
    .select("id")
    .single();

  if (resourceError) {
    console.error("Error creating resource:", resourceError);
    return { success: false, error: "Failed to create resource" };
  }

  revalidatePath(`/${nickname}/settings/resources`);

  return { success: true, data: { id: resource.id } };
}

/**
 * Update an existing resource
 */
export async function updateResource(
  input: UpdateResourceSchema,
): Promise<ActionResult> {
  const profile = await getProfile();

  if (!profile) {
    return { success: false, error: "Not authenticated" };
  }

  const parsed = updateResourceSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const {
    resourceId,
    beautyPageId,
    nickname,
    name,
    unit,
    costPerUnitCents,
    currentStock,
    lowStockThreshold,
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

  // Check for duplicate name (excluding this resource)
  if (name) {
    const nameExists = await checkResourceNameExists(
      beautyPageId,
      name,
      resourceId,
    );

    if (nameExists) {
      return {
        success: false,
        error: "A resource with this name already exists",
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
  if (unit !== undefined) {
    updateData.unit = unit;
  }
  if (costPerUnitCents !== undefined) {
    updateData.cost_per_unit_cents = costPerUnitCents;
  }
  if (currentStock !== undefined) {
    updateData.current_stock = currentStock;
  }
  if (lowStockThreshold !== undefined) {
    updateData.low_stock_threshold = lowStockThreshold;
  }
  if (isActive !== undefined) {
    updateData.is_active = isActive;
  }

  // Update resource
  const { error: updateError } = await supabase
    .from("resources")
    .update(updateData)
    .eq("id", resourceId)
    .eq("beauty_page_id", beautyPageId);

  if (updateError) {
    console.error("Error updating resource:", updateError);
    return { success: false, error: "Failed to update resource" };
  }

  revalidatePath(`/${nickname}/settings/resources`);

  return { success: true };
}

/**
 * Delete a resource
 */
export async function deleteResource(
  input: DeleteResourceSchema,
): Promise<ActionResult> {
  const profile = await getProfile();

  if (!profile) {
    return { success: false, error: "Not authenticated" };
  }

  const parsed = deleteResourceSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const { resourceId, beautyPageId, nickname } = parsed.data;

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

  // Delete the resource (cascade will handle service_resources)
  // Note: resource_usage has ON DELETE RESTRICT, so this will fail
  // if there's usage history. This is intentional to preserve data.
  const { error } = await supabase
    .from("resources")
    .delete()
    .eq("id", resourceId)
    .eq("beauty_page_id", beautyPageId);

  if (error) {
    console.error("Error deleting resource:", error);
    // Check if it's a foreign key violation (usage history exists)
    if (error.code === "23503") {
      return {
        success: false,
        error: "Cannot delete resource with usage history",
      };
    }
    return { success: false, error: "Failed to delete resource" };
  }

  revalidatePath(`/${nickname}/settings/resources`);

  return { success: true };
}

/**
 * Adjust resource stock manually
 */
export async function adjustStock(
  input: AdjustStockSchema,
): Promise<ActionResult<{ newStock: number }>> {
  const profile = await getProfile();

  if (!profile) {
    return { success: false, error: "Not authenticated" };
  }

  const parsed = adjustStockSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const { resourceId, beautyPageId, nickname, adjustment } = parsed.data;

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

  // Get current stock
  const { data: resource, error: fetchError } = await supabase
    .from("resources")
    .select("current_stock")
    .eq("id", resourceId)
    .eq("beauty_page_id", beautyPageId)
    .single();

  if (fetchError || !resource) {
    return { success: false, error: "Resource not found" };
  }

  const newStock = Math.max(0, resource.current_stock + adjustment);

  // Update stock
  const { error: updateError } = await supabase
    .from("resources")
    .update({
      current_stock: newStock,
      updated_at: new Date().toISOString(),
    })
    .eq("id", resourceId)
    .eq("beauty_page_id", beautyPageId);

  if (updateError) {
    console.error("Error adjusting stock:", updateError);
    return { success: false, error: "Failed to adjust stock" };
  }

  revalidatePath(`/${nickname}/settings/resources`);

  return { success: true, data: { newStock } };
}

/**
 * Toggle resource active status
 */
export async function toggleResourceActive(
  input: ToggleResourceActiveSchema,
): Promise<ActionResult> {
  const profile = await getProfile();

  if (!profile) {
    return { success: false, error: "Not authenticated" };
  }

  const parsed = toggleResourceActiveSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const { resourceId, beautyPageId, nickname, isActive } = parsed.data;

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
    .from("resources")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", resourceId)
    .eq("beauty_page_id", beautyPageId);

  if (error) {
    console.error("Error toggling resource status:", error);
    return { success: false, error: "Failed to update resource status" };
  }

  revalidatePath(`/${nickname}/settings/resources`);

  return { success: true };
}

/**
 * Link a resource to a service
 */
export async function linkServiceResource(
  input: LinkServiceResourceSchema,
): Promise<ActionResult<{ id: string }>> {
  const profile = await getProfile();

  if (!profile) {
    return { success: false, error: "Not authenticated" };
  }

  const parsed = linkServiceResourceSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const { serviceId, resourceId, defaultAmount, nickname } = parsed.data;

  // Verify user has access to this beauty page
  const beautyPage = await getBeautyPageByNickname(nickname);

  if (!beautyPage) {
    return { success: false, error: "Beauty page not found" };
  }

  // Solo creator model: only owner can manage settings
  const isOwner = profile.id === beautyPage.owner_id;

  if (!isOwner) {
    return { success: false, error: "Not authorized" };
  }

  const supabase = await createClient();

  // Create the link
  const { data, error } = await supabase
    .from("service_resources")
    .insert({
      service_id: serviceId,
      resource_id: resourceId,
      default_amount: defaultAmount,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error linking service resource:", error);
    // Check for duplicate
    if (error.code === "23505") {
      return {
        success: false,
        error: "This resource is already linked to this service",
      };
    }
    return { success: false, error: "Failed to link resource" };
  }

  revalidatePath(`/${nickname}/settings`);

  return { success: true, data: { id: data.id } };
}

/**
 * Unlink a resource from a service
 */
export async function unlinkServiceResource(
  input: UnlinkServiceResourceSchema,
): Promise<ActionResult> {
  const profile = await getProfile();

  if (!profile) {
    return { success: false, error: "Not authenticated" };
  }

  const parsed = unlinkServiceResourceSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const { serviceResourceId, nickname } = parsed.data;

  // Verify user has access to this beauty page
  const beautyPage = await getBeautyPageByNickname(nickname);

  if (!beautyPage) {
    return { success: false, error: "Beauty page not found" };
  }

  // Solo creator model: only owner can manage settings
  const isOwner = profile.id === beautyPage.owner_id;

  if (!isOwner) {
    return { success: false, error: "Not authorized" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("service_resources")
    .delete()
    .eq("id", serviceResourceId);

  if (error) {
    console.error("Error unlinking service resource:", error);
    return { success: false, error: "Failed to unlink resource" };
  }

  revalidatePath(`/${nickname}/settings`);

  return { success: true };
}

/**
 * Update a service-resource link (change default amount)
 */
export async function updateServiceResource(
  input: UpdateServiceResourceSchema,
): Promise<ActionResult> {
  const profile = await getProfile();

  if (!profile) {
    return { success: false, error: "Not authenticated" };
  }

  const parsed = updateServiceResourceSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const { serviceResourceId, nickname, defaultAmount } = parsed.data;

  // Verify user has access to this beauty page
  const beautyPage = await getBeautyPageByNickname(nickname);

  if (!beautyPage) {
    return { success: false, error: "Beauty page not found" };
  }

  // Solo creator model: only owner can manage settings
  const isOwner = profile.id === beautyPage.owner_id;

  if (!isOwner) {
    return { success: false, error: "Not authorized" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("service_resources")
    .update({ default_amount: defaultAmount })
    .eq("id", serviceResourceId);

  if (error) {
    console.error("Error updating service resource:", error);
    return { success: false, error: "Failed to update resource link" };
  }

  revalidatePath(`/${nickname}/settings`);

  return { success: true };
}
