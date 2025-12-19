"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import type { ScheduleConfigFormData } from "../schemas";
import { scheduleConfigSchema } from "../schemas";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

/**
 * Get schedule config for a specialist.
 */
export async function getScheduleConfig(
  specialistId: string,
): Promise<
  ActionResult<{ timezone: string; defaultSlotDuration: number } | null>
> {
  const supabase = await createClient();

  const { data: config, error } = await supabase
    .from("specialist_schedule_config")
    .select("timezone, default_slot_duration")
    .eq("specialist_id", specialistId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = not found (which is okay, return null)
    return { success: false, error: error.message };
  }

  if (!config) {
    return { success: true, data: null };
  }

  return {
    success: true,
    data: {
      timezone: config.timezone,
      defaultSlotDuration: config.default_slot_duration,
    },
  };
}

/**
 * Update schedule config for a specialist.
 */
export async function updateScheduleConfig(
  specialistId: string,
  data: ScheduleConfigFormData,
): Promise<ActionResult> {
  const t = await getTranslations("schedule");
  const tValidation = await getTranslations("validation");

  // Validate input
  const validation = scheduleConfigSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: tValidation("invalid_data") };
  }

  const supabase = await createClient();

  // Verify ownership
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: t("not_authenticated") };
  }

  // Check specialist belongs to user
  const { data: specialist } = await supabase
    .from("specialists")
    .select("id, username")
    .eq("id", specialistId)
    .eq("user_id", user.id)
    .single();

  if (!specialist) {
    return { success: false, error: t("not_authorized") };
  }

  // Upsert config
  const { error } = await supabase.from("specialist_schedule_config").upsert(
    {
      specialist_id: specialistId,
      timezone: validation.data.timezone,
      default_slot_duration: validation.data.defaultSlotDuration,
    },
    {
      onConflict: "specialist_id",
    },
  );

  if (error) {
    console.error("Failed to update schedule config:", error);
    return { success: false, error: t("update_failed") };
  }

  revalidatePath(`/@${specialist.username}/settings/schedule`);

  return { success: true };
}
