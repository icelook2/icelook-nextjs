"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  beautyPageNameSchema,
  beautyPageSlugSchema,
  RESERVED_SLUGS,
} from "@/lib/validation/schemas";

// ============================================================================
// Constants
// ============================================================================

/** Cooldown period for slug changes in days */
const SLUG_CHANGE_COOLDOWN_DAYS = 30;

/** How long old slugs redirect to new slug (days) */
const SLUG_REDIRECT_DAYS = 30;

/** How long old slugs are reserved after redirect expires (days) */
const SLUG_RESERVATION_DAYS = 180;

// ============================================================================
// Types
// ============================================================================

type UpdateBeautyPageProfileInput = {
  beautyPageId: string;
  name?: string;
  slug?: string;
  bio?: string;
  avatarUrl?: string | null;
};

type ActionResult =
  | {
      success: true;
      slugChanged: boolean;
      newSlug: string;
      updatedValues: {
        name?: string;
        slug?: string;
        bio?: string | null;
        avatarUrl?: string | null;
      };
    }
  | { success: false; error: string };

// ============================================================================
// Schema
// ============================================================================

const inputSchema = z.object({
  beautyPageId: z.string().uuid(),
  name: beautyPageNameSchema.optional(),
  slug: beautyPageSlugSchema.optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

// ============================================================================
// Action
// ============================================================================

/**
 * Updates a beauty page profile.
 *
 * Handles:
 * - Name, bio, and type updates
 * - Slug changes with 30-day cooldown
 * - Recording slug history for redirects
 */
export async function updateBeautyPageProfile(
  input: UpdateBeautyPageProfileInput,
): Promise<ActionResult> {
  const t = await getTranslations("beauty_page_settings");
  const tValidation = await getTranslations("validation");

  // Validate input
  const validation = inputSchema.safeParse(input);

  if (!validation.success) {
    const issue = validation.error.issues[0];
    const path = issue.path[0] as string;

    if (path === "name") {
      if (issue.code === "too_small") {
        return {
          success: false,
          error: tValidation("beauty_page_name_too_short"),
        };
      }
      if (issue.code === "too_big") {
        return {
          success: false,
          error: tValidation("beauty_page_name_too_long"),
        };
      }
    }

    if (path === "slug") {
      if (issue.code === "too_small") {
        return {
          success: false,
          error: tValidation("beauty_page_slug_too_short"),
        };
      }
      if (issue.code === "too_big") {
        return {
          success: false,
          error: tValidation("beauty_page_slug_too_long"),
        };
      }
      return {
        success: false,
        error: tValidation("beauty_page_slug_invalid_format"),
      };
    }

    if (path === "bio") {
      return {
        success: false,
        error: tValidation("bio_max"),
      };
    }

    return { success: false, error: tValidation("invalid_input") };
  }

  const { beautyPageId, name, slug, bio, avatarUrl } = validation.data;

  // Check for reserved slugs (only if slug is being updated)
  if (
    slug !== undefined &&
    RESERVED_SLUGS.includes(slug as (typeof RESERVED_SLUGS)[number])
  ) {
    return { success: false, error: tValidation("beauty_page_slug_reserved") };
  }

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: t("not_authenticated") };
  }

  // Fetch the current beauty page to verify ownership and get current slug
  const { data: currentPage, error: fetchError } = await supabase
    .from("beauty_pages")
    .select("slug, owner_id, slug_changed_at")
    .eq("id", beautyPageId)
    .single();

  if (fetchError || !currentPage) {
    return { success: false, error: t("beauty_page_not_found") };
  }

  // Verify the user owns this beauty page
  if (currentPage.owner_id !== user.id) {
    return { success: false, error: t("not_authorized") };
  }

  const currentSlug = currentPage.slug;
  const slugChanged = slug !== undefined && currentSlug !== slug;

  // If slug is changing, check cooldown and availability
  if (slugChanged) {
    // Check cooldown (30 days since last change)
    if (currentPage.slug_changed_at) {
      const lastChange = new Date(currentPage.slug_changed_at);
      const cooldownEnd = new Date(lastChange);
      cooldownEnd.setDate(cooldownEnd.getDate() + SLUG_CHANGE_COOLDOWN_DAYS);

      if (new Date() < cooldownEnd) {
        const daysRemaining = Math.ceil(
          (cooldownEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );
        return {
          success: false,
          error: t("slug_cooldown_active", { days: daysRemaining }),
        };
      }
    }

    // Check if new slug is already taken by another beauty page
    const { data: existingPage } = await supabase
      .from("beauty_pages")
      .select("id")
      .eq("slug", slug)
      .neq("id", beautyPageId)
      .single();

    if (existingPage) {
      return { success: false, error: tValidation("beauty_page_slug_taken") };
    }

    // Check if new slug is reserved in slug_history (still in reservation period)
    const { data: reservedSlug } = await supabase
      .from("slug_history")
      .select("id, reserved_until")
      .eq("old_slug", slug)
      .gt("reserved_until", new Date().toISOString())
      .single();

    if (reservedSlug) {
      return { success: false, error: tValidation("beauty_page_slug_taken") };
    }

    // Record the slug change in history
    const now = new Date();
    const redirectUntil = new Date(now);
    redirectUntil.setDate(redirectUntil.getDate() + SLUG_REDIRECT_DAYS);
    const reservedUntil = new Date(now);
    reservedUntil.setDate(reservedUntil.getDate() + SLUG_RESERVATION_DAYS);

    const { error: historyError } = await supabase.from("slug_history").insert({
      beauty_page_id: beautyPageId,
      old_slug: currentSlug,
      new_slug: slug,
      redirect_until: redirectUntil.toISOString(),
      reserved_until: reservedUntil.toISOString(),
    });

    if (historyError) {
      console.error("Error recording slug history:", historyError);
      // Continue anyway - the slug change is still valid
    }
  }

  // Build update data dynamically based on what's provided
  const updateData: Record<string, unknown> = {};
  const updatedValues: {
    name?: string;
    slug?: string;
    bio?: string | null;
    avatarUrl?: string | null;
  } = {};

  if (name !== undefined) {
    updateData.name = name;
    updatedValues.name = name;
  }

  if (bio !== undefined) {
    updateData.bio = bio || null;
    updatedValues.bio = bio || null;
  }

  if (avatarUrl !== undefined) {
    updateData.avatar_url = avatarUrl;
    updatedValues.avatarUrl = avatarUrl;
  }

  if (slugChanged && slug !== undefined) {
    updateData.slug = slug;
    updateData.slug_changed_at = new Date().toISOString();
    updatedValues.slug = slug;
  }

  // Only update if there's something to update
  if (Object.keys(updateData).length === 0) {
    return {
      success: true,
      slugChanged: false,
      newSlug: currentSlug,
      updatedValues: {},
    };
  }

  const { error: updateError } = await supabase
    .from("beauty_pages")
    .update(updateData)
    .eq("id", beautyPageId);

  if (updateError) {
    console.error("Error updating beauty page:", updateError);
    return { success: false, error: t("update_failed") };
  }

  // Revalidate paths
  const finalSlug = slug ?? currentSlug;
  revalidatePath(`/${finalSlug}`);
  if (slugChanged) {
    revalidatePath(`/${currentSlug}`);
  }

  return {
    success: true,
    slugChanged,
    newSlug: finalSlug,
    updatedValues,
  };
}
