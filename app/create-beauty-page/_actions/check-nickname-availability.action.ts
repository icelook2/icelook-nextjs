"use server";

import { createClient } from "@/lib/supabase/server";
import { beautyPageSlugSchema, RESERVED_SLUGS } from "@/lib/validation/schemas";

type CheckNicknameResult =
  | { available: true }
  | { available: false; error?: string };

/**
 * Check if a nickname (slug) is available for use
 * Validates format and checks database for existing pages
 */
export async function checkNicknameAvailability(
  nickname: string,
): Promise<CheckNicknameResult> {
  // Validate format
  const formatValidation = beautyPageSlugSchema.safeParse(nickname);
  if (!formatValidation.success) {
    return { available: false, error: "invalid_format" };
  }

  // Check reserved slugs
  if (RESERVED_SLUGS.includes(nickname as (typeof RESERVED_SLUGS)[number])) {
    return { available: false, error: "reserved" };
  }

  // Check database
  const supabase = await createClient();

  const { data: existingPage } = await supabase
    .from("beauty_pages")
    .select("id")
    .eq("slug", nickname)
    .single();

  if (existingPage) {
    return { available: false, error: "taken" };
  }

  return { available: true };
}
