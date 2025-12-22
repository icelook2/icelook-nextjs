"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const assignmentSchema = z.object({
  serviceId: z.string().uuid(),
  memberId: z.string().uuid(),
  priceCents: z.number().int().min(0),
  durationMinutes: z.number().int().min(15).max(480),
});

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

type OwnershipResult = { isOwner: true } | { isOwner: false; error: string };

async function verifyServiceOwnership(
  serviceId: string,
): Promise<OwnershipResult> {
  const supabase = await createClient();
  const t = await getTranslations("services");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isOwner: false, error: t("errors.not_authenticated") };
  }

  const { data: service } = await supabase
    .from("services")
    .select("service_groups!inner(beauty_pages!inner(owner_id))")
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

  return { isOwner: true };
}

export async function assignSpecialist(input: {
  serviceId: string;
  memberId: string;
  priceCents: number;
  durationMinutes: number;
  nickname: string;
}): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations("services");
  const tValidation = await getTranslations("validation");

  const validation = assignmentSchema.safeParse({
    serviceId: input.serviceId,
    memberId: input.memberId,
    priceCents: input.priceCents,
    durationMinutes: input.durationMinutes,
  });

  if (!validation.success) {
    const issue = validation.error.issues[0];
    const path = issue.path[0] as string;

    if (path === "priceCents") {
      return { success: false, error: tValidation("price_invalid") };
    }
    if (path === "durationMinutes") {
      if (issue.code === "too_small") {
        return { success: false, error: tValidation("duration_too_short") };
      }
      return { success: false, error: tValidation("duration_too_long") };
    }
    return { success: false, error: tValidation("invalid_input") };
  }

  const ownership = await verifyServiceOwnership(input.serviceId);
  if (!ownership.isOwner) {
    return { success: false, error: ownership.error };
  }

  const supabase = await createClient();

  // Check if assignment already exists
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

  revalidatePath(`/${input.nickname}/settings/services`);

  return { success: true, data: { id: data.id } };
}

export async function updateAssignment(input: {
  id: string;
  serviceId: string;
  priceCents: number;
  durationMinutes: number;
  nickname: string;
}): Promise<ActionResult> {
  const t = await getTranslations("services");
  const tValidation = await getTranslations("validation");

  if (input.priceCents < 0) {
    return { success: false, error: tValidation("price_invalid") };
  }

  if (input.durationMinutes < 15) {
    return { success: false, error: tValidation("duration_too_short") };
  }

  if (input.durationMinutes > 480) {
    return { success: false, error: tValidation("duration_too_long") };
  }

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

  revalidatePath(`/${input.nickname}/settings/services`);

  return { success: true };
}

export async function removeAssignment(input: {
  id: string;
  serviceId: string;
  nickname: string;
}): Promise<ActionResult> {
  const t = await getTranslations("services");

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

  revalidatePath(`/${input.nickname}/settings/services`);

  return { success: true };
}
