"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { VisitPreferences } from "@/lib/types";

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Zod schema for visit preferences validation
 */
const visitPreferencesSchema = z.object({
  communication: z.enum(["quiet", "friendly", "chatty"]).optional(),
  accessibility: z
    .array(
      z.enum([
        "wheelchair",
        "hearing_impaired",
        "vision_impaired",
        "sensory_sensitivity",
      ]),
    )
    .optional(),
  allergies: z.string().max(500).optional(),
});

/**
 * Updates the user's visit preferences in their profile.
 *
 * NOTE: Requires database migration to add visit_preferences column to profiles table.
 * See the plan file for migration SQL.
 */
export async function updateVisitPreferences(
  preferences: VisitPreferences,
): Promise<ActionResult> {
  const t = await getTranslations("settings");

  // Validate input
  const validation = visitPreferencesSchema.safeParse(preferences);
  if (!validation.success) {
    return { success: false, error: t("preferences_save_failed") };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: t("not_authenticated") };
  }

  // Clean up empty values before storing
  const cleanedPreferences: VisitPreferences = {};

  if (validation.data.communication) {
    cleanedPreferences.communication = validation.data.communication;
  }

  if (
    validation.data.accessibility &&
    validation.data.accessibility.length > 0
  ) {
    cleanedPreferences.accessibility = validation.data.accessibility;
  }

  if (validation.data.allergies?.trim()) {
    cleanedPreferences.allergies = validation.data.allergies.trim();
  }

  // Store null if all preferences are empty
  const preferencesToStore =
    Object.keys(cleanedPreferences).length > 0 ? cleanedPreferences : null;

  const { error } = await supabase
    .from("profiles")
    .update({ visit_preferences: preferencesToStore })
    .eq("id", user.id);

  if (error) {
    console.error("Failed to update visit preferences:", error);
    return { success: false, error: t("preferences_save_failed") };
  }

  revalidatePath("/settings");
  return { success: true };
}
