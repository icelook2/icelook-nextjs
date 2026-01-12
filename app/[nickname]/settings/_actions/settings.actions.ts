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

/**
 * Verify user can manage settings for a beauty page
 * User must be owner
 */
async function verifyCanManageSettings(
  beautyPageId: string,
): Promise<AuthorizationResult> {
  const supabase = await createClient();
  const t = await getTranslations("time_settings");

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

  return { authorized: false, error: t("errors.not_authorized") };
}

// ============================================================================
// Timezone Actions
// ============================================================================

const timezoneSchema = z.object({
  timezone: z.string().min(1),
});

/**
 * Update timezone for a beauty page
 */
export async function updateTimezone(input: {
  beautyPageId: string;
  nickname: string;
  timezone: string;
}): Promise<ActionResult> {
  const t = await getTranslations("time_settings");

  // Validate input
  const validation = timezoneSchema.safeParse({
    timezone: input.timezone,
  });

  if (!validation.success) {
    return { success: false, error: t("errors.validation_failed") };
  }

  // Authorize
  const auth = await verifyCanManageSettings(input.beautyPageId);
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("beauty_pages")
    .update({ timezone: validation.data.timezone })
    .eq("id", input.beautyPageId);

  if (error) {
    console.error("Error updating timezone:", error);
    return { success: false, error: t("errors.save_failed") };
  }

  revalidatePath(`/${input.nickname}`);
  revalidatePath(`/${input.nickname}/settings`);
  revalidatePath(`/${input.nickname}/schedule`);

  return { success: true };
}
