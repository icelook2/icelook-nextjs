"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const serviceNameSchema = z.string().min(1).max(100).trim();
const serviceGroupNameSchema = z.string().min(1).max(100).trim();

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

type OwnershipResult = { isOwner: true } | { isOwner: false; error: string };

async function verifyBeautyPageOwnership(
  beautyPageId: string,
): Promise<OwnershipResult> {
  const supabase = await createClient();
  const t = await getTranslations("service_groups");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isOwner: false, error: t("errors.not_authenticated") };
  }

  const { data: beautyPage } = await supabase
    .from("beauty_pages")
    .select("owner_id")
    .eq("id", beautyPageId)
    .single();

  if (!beautyPage || beautyPage.owner_id !== user.id) {
    return { isOwner: false, error: t("errors.not_authorized") };
  }

  return { isOwner: true };
}

async function verifyServiceGroupOwnership(
  serviceGroupId: string,
): Promise<OwnershipResult & { beautyPageId?: string }> {
  const supabase = await createClient();
  const t = await getTranslations("service_groups");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isOwner: false, error: t("errors.not_authenticated") };
  }

  const { data: serviceGroup } = await supabase
    .from("service_groups")
    .select("beauty_page_id, beauty_pages!inner(owner_id)")
    .eq("id", serviceGroupId)
    .single();

  if (!serviceGroup) {
    return { isOwner: false, error: t("errors.not_found") };
  }

  const beautyPage = serviceGroup.beauty_pages as unknown as {
    owner_id: string;
  };
  if (beautyPage.owner_id !== user.id) {
    return { isOwner: false, error: t("errors.not_authorized") };
  }

  return { isOwner: true, beautyPageId: serviceGroup.beauty_page_id };
}

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
      "service_group_id, service_groups!inner(beauty_pages!inner(owner_id))",
    )
    .eq("id", serviceId)
    .single();

  if (!service) {
    return { isOwner: false, error: t("errors.not_found") };
  }

  const serviceGroup = service.service_groups as unknown as {
    beauty_pages: { owner_id: string };
  };
  if (serviceGroup.beauty_pages.owner_id !== user.id) {
    return { isOwner: false, error: t("errors.not_authorized") };
  }

  return { isOwner: true, serviceGroupId: service.service_group_id };
}

// ============================================================================
// Service Group Actions
// ============================================================================

export async function createServiceGroup(input: {
  beautyPageId: string;
  name: string;
  nickname: string;
}): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations("service_groups");
  const tValidation = await getTranslations("validation");

  const nameValidation = serviceGroupNameSchema.safeParse(input.name);
  if (!nameValidation.success) {
    return {
      success: false,
      error: tValidation("service_group_name_required"),
    };
  }

  const ownership = await verifyBeautyPageOwnership(input.beautyPageId);
  if (!ownership.isOwner) {
    return { success: false, error: ownership.error };
  }

  const supabase = await createClient();

  // Get max display_order
  const { data: existing } = await supabase
    .from("service_groups")
    .select("display_order")
    .eq("beauty_page_id", input.beautyPageId)
    .order("display_order", { ascending: false })
    .limit(1);

  const displayOrder = existing?.[0]?.display_order
    ? existing[0].display_order + 1
    : 0;

  const { data, error } = await supabase
    .from("service_groups")
    .insert({
      beauty_page_id: input.beautyPageId,
      name: nameValidation.data,
      display_order: displayOrder,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating service group:", error);
    return { success: false, error: t("errors.create_failed") };
  }

  revalidatePath(`/${input.nickname}/settings/services`);

  return { success: true, data: { id: data.id } };
}

export async function renameServiceGroup(input: {
  id: string;
  name: string;
  beautyPageId: string;
  nickname: string;
}): Promise<ActionResult> {
  const t = await getTranslations("service_groups");
  const tValidation = await getTranslations("validation");

  const nameValidation = serviceGroupNameSchema.safeParse(input.name);
  if (!nameValidation.success) {
    return {
      success: false,
      error: tValidation("service_group_name_required"),
    };
  }

  const ownership = await verifyBeautyPageOwnership(input.beautyPageId);
  if (!ownership.isOwner) {
    return { success: false, error: ownership.error };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("service_groups")
    .update({ name: nameValidation.data })
    .eq("id", input.id);

  if (error) {
    console.error("Error renaming service group:", error);
    return { success: false, error: t("errors.update_failed") };
  }

  revalidatePath(`/${input.nickname}/settings/services`);

  return { success: true };
}

export async function deleteServiceGroup(input: {
  id: string;
  beautyPageId: string;
  nickname: string;
}): Promise<ActionResult> {
  const t = await getTranslations("service_groups");

  const ownership = await verifyBeautyPageOwnership(input.beautyPageId);
  if (!ownership.isOwner) {
    return { success: false, error: ownership.error };
  }

  const supabase = await createClient();

  // Cascade delete will handle services
  const { error } = await supabase
    .from("service_groups")
    .delete()
    .eq("id", input.id);

  if (error) {
    console.error("Error deleting service group:", error);
    return { success: false, error: t("errors.delete_failed") };
  }

  revalidatePath(`/${input.nickname}/settings/services`);

  return { success: true };
}

// ============================================================================
// Service Actions
// ============================================================================

export async function createService(input: {
  serviceGroupId: string;
  name: string;
  priceCents: number;
  durationMinutes: number;
  nickname: string;
}): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations("service_groups");
  const tValidation = await getTranslations("validation");

  const nameValidation = serviceNameSchema.safeParse(input.name);
  if (!nameValidation.success) {
    return {
      success: false,
      error: tValidation("service_name_required"),
    };
  }

  if (input.priceCents < 100) {
    return {
      success: false,
      error: tValidation("price_too_low"),
    };
  }

  if (input.priceCents > 100_000_000) {
    return {
      success: false,
      error: tValidation("price_too_high"),
    };
  }

  if (input.durationMinutes < 5) {
    return {
      success: false,
      error: tValidation("duration_too_short"),
    };
  }

  const ownership = await verifyServiceGroupOwnership(input.serviceGroupId);
  if (!ownership.isOwner) {
    return { success: false, error: ownership.error };
  }

  const supabase = await createClient();

  // Get max display_order
  const { data: existing } = await supabase
    .from("services")
    .select("display_order")
    .eq("service_group_id", input.serviceGroupId)
    .order("display_order", { ascending: false })
    .limit(1);

  const displayOrder = existing?.[0]?.display_order
    ? existing[0].display_order + 1
    : 0;

  const { data, error } = await supabase
    .from("services")
    .insert({
      service_group_id: input.serviceGroupId,
      name: nameValidation.data,
      price_cents: input.priceCents,
      duration_minutes: input.durationMinutes,
      display_order: displayOrder,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating service:", error);
    return { success: false, error: t("errors.create_failed") };
  }

  revalidatePath(`/${input.nickname}/settings/services`);

  return { success: true, data: { id: data.id } };
}

export async function renameService(input: {
  id: string;
  name: string;
  nickname: string;
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

  const { error } = await supabase
    .from("services")
    .update({ name: nameValidation.data })
    .eq("id", input.id);

  if (error) {
    console.error("Error renaming service:", error);
    return { success: false, error: t("errors.update_failed") };
  }

  revalidatePath(`/${input.nickname}/settings/services`);

  return { success: true };
}

export async function updateServicePrice(input: {
  id: string;
  priceCents: number;
  nickname: string;
}): Promise<ActionResult> {
  const t = await getTranslations("service_groups");
  const tValidation = await getTranslations("validation");

  if (input.priceCents < 100) {
    return {
      success: false,
      error: tValidation("price_too_low"),
    };
  }

  if (input.priceCents > 100_000_000) {
    return {
      success: false,
      error: tValidation("price_too_high"),
    };
  }

  const ownership = await verifyServiceOwnership(input.id);
  if (!ownership.isOwner) {
    return { success: false, error: ownership.error };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("services")
    .update({ price_cents: input.priceCents })
    .eq("id", input.id);

  if (error) {
    console.error("Error updating service price:", error);
    return { success: false, error: t("errors.update_failed") };
  }

  revalidatePath(`/${input.nickname}/settings/services`);

  return { success: true };
}

export async function updateServiceDuration(input: {
  id: string;
  durationMinutes: number;
  nickname: string;
}): Promise<ActionResult> {
  const t = await getTranslations("service_groups");
  const tValidation = await getTranslations("validation");

  if (input.durationMinutes < 5) {
    return {
      success: false,
      error: tValidation("duration_too_short"),
    };
  }

  if (input.durationMinutes > 480) {
    return {
      success: false,
      error: tValidation("duration_too_long"),
    };
  }

  const ownership = await verifyServiceOwnership(input.id);
  if (!ownership.isOwner) {
    return { success: false, error: ownership.error };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("services")
    .update({ duration_minutes: input.durationMinutes })
    .eq("id", input.id);

  if (error) {
    console.error("Error updating service duration:", error);
    return { success: false, error: t("errors.update_failed") };
  }

  revalidatePath(`/${input.nickname}/settings/services`);

  return { success: true };
}

export async function deleteService(input: {
  id: string;
  nickname: string;
}): Promise<ActionResult> {
  const t = await getTranslations("service_groups");

  const ownership = await verifyServiceOwnership(input.id);
  if (!ownership.isOwner) {
    return { success: false, error: ownership.error };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("services").delete().eq("id", input.id);

  if (error) {
    console.error("Error deleting service:", error);
    return { success: false, error: t("errors.delete_failed") };
  }

  revalidatePath(`/${input.nickname}/settings/services`);

  return { success: true };
}

/**
 * Update service time window.
 * Pass null for both times to clear the restriction.
 */
export async function updateServiceTimeWindow(input: {
  id: string;
  availableFromTime: string | null;
  availableToTime: string | null;
  nickname: string;
}): Promise<ActionResult> {
  const t = await getTranslations("service_groups");

  // Validate time window if provided
  if (input.availableFromTime && input.availableToTime) {
    const fromMinutes = timeToMinutes(input.availableFromTime);
    const toMinutes = timeToMinutes(input.availableToTime);

    if (fromMinutes >= toMinutes) {
      return { success: false, error: t("errors.invalid_time_window") };
    }
  } else if (input.availableFromTime || input.availableToTime) {
    // Both must be provided or both must be null
    return { success: false, error: t("errors.invalid_time_window") };
  }

  const ownership = await verifyServiceOwnership(input.id);
  if (!ownership.isOwner) {
    return { success: false, error: ownership.error };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("services")
    .update({
      available_from_time: input.availableFromTime,
      available_to_time: input.availableToTime,
    })
    .eq("id", input.id);

  if (error) {
    console.error("Error updating service time window:", error);
    return { success: false, error: t("errors.update_failed") };
  }

  revalidatePath(`/${input.nickname}/settings/services`);
  revalidatePath(`/${input.nickname}`); // Revalidate public page for booking

  return { success: true };
}

/**
 * Parse time string "HH:MM" to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const parts = time.split(":");
  const hours = Number.parseInt(parts[0], 10);
  const minutes = Number.parseInt(parts[1], 10);
  return hours * 60 + minutes;
}
