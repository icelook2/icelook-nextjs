"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageAdmins, getBeautyPageByNickname } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

const upsertCancellationPolicySchema = z.object({
  beautyPageId: z.string().uuid(),
  nickname: z.string(),
  isEnabled: z.boolean(),
  maxCancellations: z.number().int().min(1).max(100),
  periodDays: z.number().int().min(1).max(365),
  blockDurationDays: z.number().int().min(1).max(365),
  noShowMultiplier: z.number().min(1).max(10),
});

type UpsertCancellationPolicyInput = z.infer<
  typeof upsertCancellationPolicySchema
>;

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function upsertCancellationPolicy(
  input: UpsertCancellationPolicyInput,
): Promise<ActionResult> {
  const profile = await getProfile();

  if (!profile) {
    return { success: false, error: "Not authenticated" };
  }

  const parsed = upsertCancellationPolicySchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const {
    beautyPageId,
    nickname,
    isEnabled,
    maxCancellations,
    periodDays,
    blockDurationDays,
    noShowMultiplier,
  } = parsed.data;

  // Verify user has access to this beauty page
  const beautyPage = await getBeautyPageByNickname(nickname);

  if (!beautyPage || beautyPage.id !== beautyPageId) {
    return { success: false, error: "Beauty page not found" };
  }

  const isOwner = profile.id === beautyPage.owner_id;
  const admins = await getBeautyPageAdmins(beautyPage.id);
  const isAdmin = admins.some((a) => a.user_id === profile.id);

  if (!isOwner && !isAdmin) {
    return { success: false, error: "Not authorized" };
  }

  const supabase = await createClient();

  // Upsert the cancellation policy
  const { error } = await supabase.from("cancellation_policies").upsert(
    {
      beauty_page_id: beautyPageId,
      is_enabled: isEnabled,
      max_cancellations: maxCancellations,
      period_days: periodDays,
      block_duration_days: blockDurationDays,
      no_show_multiplier: noShowMultiplier,
    },
    {
      onConflict: "beauty_page_id",
    },
  );

  if (error) {
    console.error("Error upserting cancellation policy:", error);
    return { success: false, error: "Failed to save cancellation policy" };
  }

  revalidatePath(`/${nickname}/settings/cancellation-policy`);

  return { success: true };
}
