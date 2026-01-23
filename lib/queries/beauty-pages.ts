import { createClient } from "@/lib/supabase/server";

export type BeautyPage = {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  is_active: boolean;
  description?: string | null;
  timezone: string;
  slot_interval_minutes: number;
  created_at: string;
  updated_at: string;
  // Contact info
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country_code: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
};

export type BeautyPageWithType = BeautyPage & {
  beauty_page_types: Array<{
    id: string;
    name: string;
  }>;
};

export type UserBeautyPage = Pick<BeautyPage, "id" | "name" | "slug"> & {
  avatar_url: string | null;
  display_name: string | null;
};

/**
 * Fetches all beauty pages owned by the user
 */
export async function getUserBeautyPages(
  userId: string | undefined,
): Promise<UserBeautyPage[]> {
  if (!userId) {
    return [];
  }
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("beauty_pages")
    .select("id, name, slug, avatar_url, display_name")
    .eq("owner_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching beauty pages:", error);
    return [];
  }

  return data ?? [];
}

/**
 * Fetches a beauty page by its nickname (slug)
 * Returns null if not found or not active
 */
export async function getBeautyPageByNickname(
  nickname: string,
): Promise<BeautyPageWithType | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("beauty_pages")
    .select("*, beauty_page_types(*)")
    .eq("slug", nickname)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return null;
  }

  return data as BeautyPageWithType;
}

/**
 * Checks if a slug is already taken
 */
export async function isSlugTaken(slug: string): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("beauty_pages")
    .select("id")
    .eq("slug", slug)
    .single();

  return data !== null;
}
