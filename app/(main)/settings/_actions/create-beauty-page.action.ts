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

type CreateBeautyPageInput = {
  name: string;
  slug: string;
  typeId: string;
};

type ActionResult =
  | { success: true; slug: string }
  | { success: false; error: string };

const inputSchema = z.object({
  name: beautyPageNameSchema,
  slug: beautyPageSlugSchema,
  typeId: z.string().uuid(),
});

/**
 * Creates a new beauty page for the authenticated user.
 */
export async function createBeautyPage(
  input: CreateBeautyPageInput,
): Promise<ActionResult> {
  const t = await getTranslations("settings");
  const tValidation = await getTranslations("validation");

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
      // Regex validation failures or custom refinement failures
      return {
        success: false,
        error: tValidation("beauty_page_slug_invalid_format"),
      };
    }

    if (path === "typeId") {
      return {
        success: false,
        error: tValidation("beauty_page_type_required"),
      };
    }

    return { success: false, error: tValidation("invalid_input") };
  }

  const { name, slug, typeId } = validation.data;

  // Check for reserved slugs
  if (RESERVED_SLUGS.includes(slug as (typeof RESERVED_SLUGS)[number])) {
    return { success: false, error: tValidation("beauty_page_slug_reserved") };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: t("not_authenticated") };
  }

  // Check if slug is already taken
  const { data: existingPage } = await supabase
    .from("beauty_pages")
    .select("id")
    .eq("slug", slug)
    .single();

  if (existingPage) {
    return { success: false, error: tValidation("beauty_page_slug_taken") };
  }

  // Create the beauty page
  const { error } = await supabase.from("beauty_pages").insert({
    name,
    slug,
    type_id: typeId,
    owner_id: user.id,
  });

  if (error) {
    console.error("Error creating beauty page:", error);
    return { success: false, error: t("create_beauty_page_failed") };
  }

  revalidatePath("/settings");
  revalidatePath("/beauty-pages");

  return { success: true, slug };
}
