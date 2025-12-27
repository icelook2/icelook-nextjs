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
 * Verify user can manage contact info for a beauty page
 * User must be owner or admin
 */
async function verifyCanManageContactInfo(
  beautyPageId: string,
): Promise<AuthorizationResult> {
  const supabase = await createClient();
  const t = await getTranslations("contact_settings");

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
// Address Actions
// ============================================================================

const addressSchema = z.object({
  address: z
    .string()
    .max(200)
    .optional()
    .nullable()
    .transform((v) => v || null),
  city: z
    .string()
    .max(100)
    .optional()
    .nullable()
    .transform((v) => v || null),
  postal_code: z
    .string()
    .max(20)
    .optional()
    .nullable()
    .transform((v) => v || null),
});

/**
 * Update address for a beauty page
 */
export async function updateAddress(input: {
  beautyPageId: string;
  nickname: string;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
}): Promise<ActionResult> {
  const t = await getTranslations("contact_settings");

  // Validate input
  const validation = addressSchema.safeParse({
    address: input.address,
    city: input.city,
    postal_code: input.postal_code,
  });

  if (!validation.success) {
    return { success: false, error: t("errors.validation_failed") };
  }

  // Authorize
  const auth = await verifyCanManageContactInfo(input.beautyPageId);
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("beauty_pages")
    .update({
      address: validation.data.address,
      city: validation.data.city,
      postal_code: validation.data.postal_code,
    })
    .eq("id", input.beautyPageId);

  if (error) {
    console.error("Error updating address:", error);
    return { success: false, error: t("errors.save_failed") };
  }

  revalidatePath(`/${input.nickname}`);
  revalidatePath(`/${input.nickname}/settings/contact`);

  return { success: true };
}

// ============================================================================
// Social Media Actions
// ============================================================================

const socialMediaSchema = z.object({
  instagram_url: z
    .string()
    .max(200)
    .optional()
    .nullable()
    .transform((v) => v || null)
    .refine(
      (url) => {
        if (!url) {
          return true;
        }
        // Allow full URLs or just usernames
        return (
          url.startsWith("https://instagram.com/") ||
          url.startsWith("https://www.instagram.com/") ||
          /^@?[\w.]+$/.test(url)
        );
      },
      { message: "Invalid Instagram URL or username" },
    ),
});

/**
 * Update social media links for a beauty page
 */
export async function updateSocialMedia(input: {
  beautyPageId: string;
  nickname: string;
  instagram_url?: string | null;
}): Promise<ActionResult> {
  const t = await getTranslations("contact_settings");

  // Validate input
  const validation = socialMediaSchema.safeParse({
    instagram_url: input.instagram_url,
  });

  if (!validation.success) {
    return { success: false, error: t("errors.validation_failed") };
  }

  // Authorize
  const auth = await verifyCanManageContactInfo(input.beautyPageId);
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const supabase = await createClient();

  // Normalize Instagram URL - convert username to full URL
  let instagramUrl = validation.data.instagram_url;
  if (instagramUrl && !instagramUrl.startsWith("http")) {
    const username = instagramUrl.replace(/^@/, "");
    instagramUrl = `https://www.instagram.com/${username}`;
  }

  const { error } = await supabase
    .from("beauty_pages")
    .update({
      instagram_url: instagramUrl,
    })
    .eq("id", input.beautyPageId);

  if (error) {
    console.error("Error updating social media:", error);
    return { success: false, error: t("errors.save_failed") };
  }

  revalidatePath(`/${input.nickname}`);
  revalidatePath(`/${input.nickname}/settings/contact`);

  return { success: true };
}
