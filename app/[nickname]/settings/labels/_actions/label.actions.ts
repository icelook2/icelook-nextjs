"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

type AuthorizationResult =
  | { authorized: true; userId: string }
  | { authorized: false; error: string };

async function verifyCanManageLabels(
  beautyPageId: string,
): Promise<AuthorizationResult> {
  const supabase = await createClient();
  const t = await getTranslations("labels");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false, error: t("errors.not_authenticated") };
  }

  // Check if user is owner
  const { data: beautyPage } = await supabase
    .from("beauty_pages")
    .select("owner_id")
    .eq("id", beautyPageId)
    .single();

  if (beautyPage?.owner_id === user.id) {
    return { authorized: true, userId: user.id };
  }

  // Check if user is admin
  const { data: member } = await supabase
    .from("beauty_page_members")
    .select("roles")
    .eq("beauty_page_id", beautyPageId)
    .eq("user_id", user.id)
    .single();

  if (member?.roles?.includes("admin")) {
    return { authorized: true, userId: user.id };
  }

  return { authorized: false, error: t("errors.not_authorized") };
}

// ============================================================================
// Label CRUD Actions
// ============================================================================

const createLabelSchema = z.object({
  name: z.string().min(1).max(50).trim(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullable()
    .optional(),
});

/**
 * Create a new specialist label
 */
export async function createLabel(input: {
  beautyPageId: string;
  name: string;
  color?: string | null;
  nickname: string;
}): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations("labels");

  const validation = createLabelSchema.safeParse({
    name: input.name,
    color: input.color,
  });

  if (!validation.success) {
    return { success: false, error: t("errors.validation_failed") };
  }

  const authorization = await verifyCanManageLabels(input.beautyPageId);
  if (!authorization.authorized) {
    return { success: false, error: authorization.error };
  }

  const supabase = await createClient();

  // Get the max sort_order to append new label at the end
  const { data: existingLabels } = await supabase
    .from("specialist_labels")
    .select("sort_order")
    .eq("beauty_page_id", input.beautyPageId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextSortOrder = (existingLabels?.[0]?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("specialist_labels")
    .insert({
      beauty_page_id: input.beautyPageId,
      name: validation.data.name,
      color: validation.data.color ?? null,
      sort_order: nextSortOrder,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating label:", error);
    if (error.code === "23505") {
      // Unique constraint violation
      return { success: false, error: t("errors.name_exists") };
    }
    return { success: false, error: t("errors.create_failed") };
  }

  revalidatePath(`/${input.nickname}/settings/labels`);
  revalidatePath(`/${input.nickname}`);

  return { success: true, data: { id: data.id } };
}

const updateLabelSchema = z.object({
  name: z.string().min(1).max(50).trim().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullable()
    .optional(),
});

/**
 * Update a specialist label
 */
export async function updateLabel(input: {
  labelId: string;
  beautyPageId: string;
  name?: string;
  color?: string | null;
  nickname: string;
}): Promise<ActionResult> {
  const t = await getTranslations("labels");

  const validation = updateLabelSchema.safeParse({
    name: input.name,
    color: input.color,
  });

  if (!validation.success) {
    return { success: false, error: t("errors.validation_failed") };
  }

  const authorization = await verifyCanManageLabels(input.beautyPageId);
  if (!authorization.authorized) {
    return { success: false, error: authorization.error };
  }

  const supabase = await createClient();

  const updateData: Record<string, unknown> = {};
  if (validation.data.name !== undefined) {
    updateData.name = validation.data.name;
  }
  if (validation.data.color !== undefined) {
    updateData.color = validation.data.color;
  }

  if (Object.keys(updateData).length === 0) {
    return { success: true };
  }

  const { error } = await supabase
    .from("specialist_labels")
    .update(updateData)
    .eq("id", input.labelId)
    .eq("beauty_page_id", input.beautyPageId);

  if (error) {
    console.error("Error updating label:", error);
    if (error.code === "23505") {
      return { success: false, error: t("errors.name_exists") };
    }
    return { success: false, error: t("errors.update_failed") };
  }

  revalidatePath(`/${input.nickname}/settings/labels`);
  revalidatePath(`/${input.nickname}`);

  return { success: true };
}

/**
 * Delete a specialist label
 */
export async function deleteLabel(input: {
  labelId: string;
  beautyPageId: string;
  nickname: string;
}): Promise<ActionResult> {
  const t = await getTranslations("labels");

  const authorization = await verifyCanManageLabels(input.beautyPageId);
  if (!authorization.authorized) {
    return { success: false, error: authorization.error };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("specialist_labels")
    .delete()
    .eq("id", input.labelId)
    .eq("beauty_page_id", input.beautyPageId);

  if (error) {
    console.error("Error deleting label:", error);
    return { success: false, error: t("errors.delete_failed") };
  }

  revalidatePath(`/${input.nickname}/settings/labels`);
  revalidatePath(`/${input.nickname}`);

  return { success: true };
}

// ============================================================================
// Label Assignment Actions
// ============================================================================

/**
 * Assign a label to a specialist
 */
export async function assignLabelToSpecialist(input: {
  specialistId: string;
  labelId: string;
  beautyPageId: string;
  nickname: string;
}): Promise<ActionResult> {
  const t = await getTranslations("labels");

  const authorization = await verifyCanManageLabels(input.beautyPageId);
  if (!authorization.authorized) {
    return { success: false, error: authorization.error };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("specialist_label_assignments").insert({
    specialist_id: input.specialistId,
    label_id: input.labelId,
  });

  if (error) {
    console.error("Error assigning label:", error);
    if (error.code === "23505") {
      // Already assigned - treat as success
      return { success: true };
    }
    return { success: false, error: t("errors.assign_failed") };
  }

  revalidatePath(`/${input.nickname}/settings/specialists`);
  revalidatePath(`/${input.nickname}/settings/specialists/${input.specialistId}`);
  revalidatePath(`/${input.nickname}`);

  return { success: true };
}

/**
 * Remove a label from a specialist
 */
export async function removeLabelFromSpecialist(input: {
  specialistId: string;
  labelId: string;
  beautyPageId: string;
  nickname: string;
}): Promise<ActionResult> {
  const t = await getTranslations("labels");

  const authorization = await verifyCanManageLabels(input.beautyPageId);
  if (!authorization.authorized) {
    return { success: false, error: authorization.error };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("specialist_label_assignments")
    .delete()
    .eq("specialist_id", input.specialistId)
    .eq("label_id", input.labelId);

  if (error) {
    console.error("Error removing label assignment:", error);
    return { success: false, error: t("errors.remove_failed") };
  }

  revalidatePath(`/${input.nickname}/settings/specialists`);
  revalidatePath(`/${input.nickname}/settings/specialists/${input.specialistId}`);
  revalidatePath(`/${input.nickname}`);

  return { success: true };
}

/**
 * Update all labels for a specialist (replaces existing assignments)
 */
export async function updateSpecialistLabels(input: {
  specialistId: string;
  labelIds: string[];
  beautyPageId: string;
  nickname: string;
}): Promise<ActionResult> {
  const t = await getTranslations("labels");

  const authorization = await verifyCanManageLabels(input.beautyPageId);
  if (!authorization.authorized) {
    return { success: false, error: authorization.error };
  }

  const supabase = await createClient();

  // Delete existing assignments
  const { error: deleteError } = await supabase
    .from("specialist_label_assignments")
    .delete()
    .eq("specialist_id", input.specialistId);

  if (deleteError) {
    console.error("Error clearing label assignments:", deleteError);
    return { success: false, error: t("errors.update_failed") };
  }

  // Insert new assignments
  if (input.labelIds.length > 0) {
    const { error: insertError } = await supabase
      .from("specialist_label_assignments")
      .insert(
        input.labelIds.map((labelId) => ({
          specialist_id: input.specialistId,
          label_id: labelId,
        })),
      );

    if (insertError) {
      console.error("Error creating label assignments:", insertError);
      return { success: false, error: t("errors.update_failed") };
    }
  }

  revalidatePath(`/${input.nickname}/settings/specialists`);
  revalidatePath(`/${input.nickname}/settings/specialists/${input.specialistId}`);
  revalidatePath(`/${input.nickname}`);

  return { success: true };
}
