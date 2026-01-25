/**
 * Query for checking slug history for redirects.
 *
 * When a beauty page changes its slug, the old slug is recorded in slug_history.
 * For 30 days, the old slug redirects to the new one.
 * For 180 days total, the old slug is reserved (cannot be claimed by others).
 */

import { createClient } from "@/lib/supabase/server";

export type SlugRedirect = {
  newSlug: string;
  shouldRedirect: boolean;
};

/**
 * Checks if a slug has a redirect entry in slug_history.
 *
 * @param oldSlug - The slug to check
 * @returns The new slug to redirect to, or null if no redirect
 */
export async function getSlugRedirect(
  oldSlug: string,
): Promise<SlugRedirect | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("slug_history")
    .select("new_slug, redirect_until")
    .eq("old_slug", oldSlug)
    .single();

  if (error || !data) {
    return null;
  }

  const shouldRedirect = new Date(data.redirect_until) > new Date();

  return {
    newSlug: data.new_slug,
    shouldRedirect,
  };
}
