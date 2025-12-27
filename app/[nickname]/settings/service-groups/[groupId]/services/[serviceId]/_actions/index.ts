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

  const { error } = await supabase
    .from("services")
    .update({ name: nameValidation.data })
    .eq("id", input.id);

  if (error) {
    console.error("Error updating service:", error);
    return { success: false, error: t("errors.update_failed") };
  }

  revalidatePath(
    `/${input.nickname}/settings/service-groups/${input.groupId}/services`,
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
