"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

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

  revalidatePath(`/${input.nickname}/settings/service-groups`);

  return { success: true, data: { id: data.id } };
}

export async function updateServiceGroup(input: {
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
    console.error("Error updating service group:", error);
    return { success: false, error: t("errors.update_failed") };
  }

  revalidatePath(`/${input.nickname}/settings/service-groups`);

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

  // Cascade delete will handle services and assignments
  const { error } = await supabase
    .from("service_groups")
    .delete()
    .eq("id", input.id);

  if (error) {
    console.error("Error deleting service group:", error);
    return { success: false, error: t("errors.delete_failed") };
  }

  revalidatePath(`/${input.nickname}/settings/service-groups`);

  return { success: true };
}
