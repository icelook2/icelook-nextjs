"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const serviceNameSchema = z.string().min(1).max(100).trim();

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

type OwnershipResult =
  | { isOwner: true; beautyPageId: string }
  | { isOwner: false; error: string };

async function verifyServiceOwnership(
  serviceGroupId: string,
): Promise<OwnershipResult> {
  const supabase = await createClient();
  const t = await getTranslations("services");

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

export async function createService(input: {
  serviceGroupId: string;
  name: string;
  nickname: string;
}): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations("services");
  const tValidation = await getTranslations("validation");

  const nameValidation = serviceNameSchema.safeParse(input.name);
  if (!nameValidation.success) {
    return { success: false, error: tValidation("service_name_required") };
  }

  const ownership = await verifyServiceOwnership(input.serviceGroupId);
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

export async function updateService(input: {
  id: string;
  name: string;
  serviceGroupId: string;
  nickname: string;
}): Promise<ActionResult> {
  const t = await getTranslations("services");
  const tValidation = await getTranslations("validation");

  const nameValidation = serviceNameSchema.safeParse(input.name);
  if (!nameValidation.success) {
    return { success: false, error: tValidation("service_name_required") };
  }

  const ownership = await verifyServiceOwnership(input.serviceGroupId);
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

  revalidatePath(`/${input.nickname}/settings/services`);

  return { success: true };
}

export async function deleteService(input: {
  id: string;
  serviceGroupId: string;
  nickname: string;
}): Promise<ActionResult> {
  const t = await getTranslations("services");

  const ownership = await verifyServiceOwnership(input.serviceGroupId);
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

  revalidatePath(`/${input.nickname}/settings/services`);

  return { success: true };
}
