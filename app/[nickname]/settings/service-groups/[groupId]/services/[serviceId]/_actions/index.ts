"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const serviceNameSchema = z.string().min(1).max(100).trim();

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

type OwnershipResult = { isOwner: true } | { isOwner: false; error: string };

async function verifyServiceOwnership(
  serviceId: string,
): Promise<OwnershipResult & { serviceGroupId?: string }> {
  const supabase = await createClient();
  const t = await getTranslations("service_groups");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isOwner: false, error: t("errors.not_authenticated") };
  }

  const { data: service } = await supabase
    .from("services")
    .select(
      "service_group_id, service_groups!inner(beauty_page_id, beauty_pages!inner(owner_id))",
    )
    .eq("id", serviceId)
    .single();

  if (!service) {
    return { isOwner: false, error: t("errors.not_found") };
  }

  const serviceGroup = service.service_groups as unknown as {
    beauty_page_id: string;
    beauty_pages: { owner_id: string };
  };
  if (serviceGroup.beauty_pages.owner_id !== user.id) {
    return { isOwner: false, error: t("errors.not_authorized") };
  }

  return { isOwner: true, serviceGroupId: service.service_group_id };
}

// Service Actions
export async function updateService(input: {
  id: string;
  name: string;
  description?: string | null;
  nickname: string;
  groupId: string;
}): Promise<ActionResult> {
  const t = await getTranslations("service_groups");
  const tValidation = await getTranslations("validation");

  const nameValidation = serviceNameSchema.safeParse(input.name);
  if (!nameValidation.success) {
    return {
      success: false,
      error: tValidation("service_name_required"),
    };
  }

  const ownership = await verifyServiceOwnership(input.id);
  if (!ownership.isOwner) {
    return { success: false, error: ownership.error };
  }

  const supabase = await createClient();

  // Build update object - only include description if it was explicitly provided
  const updateData: { name: string; description?: string | null } = {
    name: nameValidation.data,
  };

  // Handle description: undefined means don't change, null means clear, string means set
  if (input.description !== undefined) {
    updateData.description = input.description?.trim() || null;
  }

  const { error } = await supabase
    .from("services")
    .update(updateData)
    .eq("id", input.id);

  if (error) {
    console.error("Error updating service:", error);
    return { success: false, error: t("errors.update_failed") };
  }

  revalidatePath(
    `/${input.nickname}/settings/service-groups/${input.groupId}/services`,
  );
  revalidatePath(
    `/${input.nickname}/settings/service-groups/${input.groupId}/services/${input.id}`,
  );

  return { success: true };
}

export async function deleteService(input: {
  id: string;
  nickname: string;
  groupId: string;
}): Promise<ActionResult> {
  const t = await getTranslations("service_groups");

  const ownership = await verifyServiceOwnership(input.id);
  if (!ownership.isOwner) {
    return { success: false, error: ownership.error };
  }

  const supabase = await createClient();

  // Cascade delete will handle assignments
  const { error } = await supabase.from("services").delete().eq("id", input.id);

  if (error) {
    console.error("Error deleting service:", error);
    return { success: false, error: t("errors.delete_failed") };
  }

  revalidatePath(
    `/${input.nickname}/settings/service-groups/${input.groupId}/services`,
  );

  return { success: true };
}

// Assignment Actions
export async function assignSpecialist(input: {
  serviceId: string;
  memberId: string;
  priceCents: number;
  durationMinutes: number;
  groupId: string;
  nickname: string;
}): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations("service_groups");

  const ownership = await verifyServiceOwnership(input.serviceId);
  if (!ownership.isOwner) {
    return { success: false, error: ownership.error };
  }

  const supabase = await createClient();

  // Check if already assigned
  const { data: existing } = await supabase
    .from("specialist_service_assignments")
    .select("id")
    .eq("service_id", input.serviceId)
    .eq("member_id", input.memberId)
    .single();

  if (existing) {
    return { success: false, error: t("errors.already_assigned") };
  }

  const { data, error } = await supabase
    .from("specialist_service_assignments")
    .insert({
      service_id: input.serviceId,
      member_id: input.memberId,
      price_cents: input.priceCents,
      duration_minutes: input.durationMinutes,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error assigning specialist:", error);
    return { success: false, error: t("errors.assign_failed") };
  }

  revalidatePath(
    `/${input.nickname}/settings/service-groups/${input.groupId}/services`,
  );

  return { success: true, data: { id: data.id } };
}

export async function updateAssignment(input: {
  id: string;
  priceCents: number;
  durationMinutes: number;
  serviceId: string;
  groupId: string;
  nickname: string;
}): Promise<ActionResult> {
  const t = await getTranslations("service_groups");

  const ownership = await verifyServiceOwnership(input.serviceId);
  if (!ownership.isOwner) {
    return { success: false, error: ownership.error };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("specialist_service_assignments")
    .update({
      price_cents: input.priceCents,
      duration_minutes: input.durationMinutes,
    })
    .eq("id", input.id);

  if (error) {
    console.error("Error updating assignment:", error);
    return { success: false, error: t("errors.update_failed") };
  }

  revalidatePath(
    `/${input.nickname}/settings/service-groups/${input.groupId}/services`,
  );

  return { success: true };
}

export async function removeAssignment(input: {
  id: string;
  serviceId: string;
  groupId: string;
  nickname: string;
}): Promise<ActionResult> {
  const t = await getTranslations("service_groups");

  const ownership = await verifyServiceOwnership(input.serviceId);
  if (!ownership.isOwner) {
    return { success: false, error: ownership.error };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("specialist_service_assignments")
    .delete()
    .eq("id", input.id);

  if (error) {
    console.error("Error removing assignment:", error);
    return { success: false, error: t("errors.remove_failed") };
  }

  revalidatePath(
    `/${input.nickname}/settings/service-groups/${input.groupId}/services`,
  );

  return { success: true };
}

/**
 * Toggle service visibility (hide/show).
 * Hidden services are not shown on the beauty page but existing appointments are preserved.
 * When hiding a service that's part of active bundles, those bundles are also deactivated.
 */
export async function toggleServiceVisibility(input: {
  id: string;
  isHidden: boolean;
  nickname: string;
  groupId: string;
  /** Bundle IDs to deactivate when hiding (provided by UI after user confirmation) */
  bundleIdsToDeactivate?: string[];
}): Promise<ActionResult> {
  const t = await getTranslations("service_groups");

  const ownership = await verifyServiceOwnership(input.id);
  if (!ownership.isOwner) {
    return { success: false, error: ownership.error };
  }

  const supabase = await createClient();

  // Update service visibility
  const { error } = await supabase
    .from("services")
    .update({ is_hidden: input.isHidden })
    .eq("id", input.id);

  if (error) {
    console.error("Error toggling service visibility:", error);
    return { success: false, error: t("errors.update_failed") };
  }

  // If hiding and there are bundles to deactivate, deactivate them
  if (
    input.isHidden &&
    input.bundleIdsToDeactivate &&
    input.bundleIdsToDeactivate.length > 0
  ) {
    const { error: bundleError } = await supabase
      .from("service_bundles")
      .update({ is_active: false })
      .in("id", input.bundleIdsToDeactivate);

    if (bundleError) {
      console.error("Error deactivating bundles:", bundleError);
      // Service is already hidden, so we don't fail the whole operation
      // but we should log this for debugging
    }

    // Revalidate bundles settings page
    revalidatePath(`/${input.nickname}/settings/bundles`);
  }

  revalidatePath(
    `/${input.nickname}/settings/service-groups/${input.groupId}/services/${input.id}`,
  );
  revalidatePath(`/${input.nickname}`);

  return { success: true };
}

/**
 * Get active bundles that contain a specific service.
 * Used when hiding a service to warn about affected bundles.
 */
export async function getActiveBundlesForServiceAction(
  serviceId: string,
): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();

  // Get bundle IDs that contain this service
  const { data: bundleItems, error: itemsError } = await supabase
    .from("service_bundle_items")
    .select("bundle_id")
    .eq("service_id", serviceId);

  if (itemsError || !bundleItems || bundleItems.length === 0) {
    return [];
  }

  const bundleIds = bundleItems.map((item) => item.bundle_id);

  // Fetch only active bundles
  const { data, error } = await supabase
    .from("service_bundles")
    .select("id, name")
    .in("id", bundleIds)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching active bundles for service:", error);
    return [];
  }

  return data;
}
