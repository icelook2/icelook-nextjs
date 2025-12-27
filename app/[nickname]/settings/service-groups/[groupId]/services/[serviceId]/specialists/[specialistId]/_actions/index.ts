"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

type OwnershipResult = { isOwner: true } | { isOwner: false; error: string };

async function verifyServiceOwnership(
  serviceId: string,
): Promise<OwnershipResult> {
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

  return { isOwner: true };
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
    `/${input.nickname}/settings/service-groups/${input.groupId}/services/${input.serviceId}`,
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
    `/${input.nickname}/settings/service-groups/${input.groupId}/services/${input.serviceId}`,
  );

  return { success: true };
}
