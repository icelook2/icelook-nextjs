"use server";

/**
 * Cancellation Policy Server Actions (Solo Creator Model)
 *
 * Simple cancellation policy management for beauty pages.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageByNickname } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

const upsertCancellationPolicySchema = z.object({
  beautyPageId: z.string().uuid(),
  nickname: z.string(),
  allowCancellation: z.boolean(),
  cancellationNoticeHours: z.number().int().min(0).max(168), // Up to 1 week
  cancellationFeePercentage: z.number().min(0).max(100),
  policyText: z.string().max(1000).optional(),
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
    allowCancellation,
    cancellationNoticeHours,
    cancellationFeePercentage,
    policyText,
  } = parsed.data;

  // Verify user has access to this beauty page
  const beautyPage = await getBeautyPageByNickname(nickname);

  if (!beautyPage || beautyPage.id !== beautyPageId) {
    return { success: false, error: "Beauty page not found" };
  }

  // Solo creator model: only owner can manage settings
  const isOwner = profile.id === beautyPage.owner_id;

  if (!isOwner) {
    return { success: false, error: "Not authorized" };
  }

  const supabase = await createClient();

  // Upsert the cancellation policy
  const { error } = await supabase.from("cancellation_policies").upsert(
    {
      beauty_page_id: beautyPageId,
      allow_cancellation: allowCancellation,
      cancellation_notice_hours: cancellationNoticeHours,
      cancellation_fee_percentage: cancellationFeePercentage,
      policy_text: policyText ?? null,
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
