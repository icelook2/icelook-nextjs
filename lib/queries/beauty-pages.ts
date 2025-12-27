import { createClient } from "@/lib/supabase/server";

export type BeautyPage = {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  is_active: boolean;
  description?: string | null;
  timezone: string;
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
  /** User's relationship to this beauty page */
  relationship: "owner" | "member";
  /** Roles if user is a member (admin, specialist) */
  roles?: ("admin" | "specialist")[];
};

/**
 * Fetches all beauty pages the user has access to (owned or member of)
 */
export async function getUserBeautyPages(
  userId: string | undefined,
): Promise<UserBeautyPage[]> {
  if (!userId) {
    return [];
  }
  const supabase = await createClient();

  // Fetch owned beauty pages
  const { data: ownedPages, error: ownedError } = await supabase
    .from("beauty_pages")
    .select("id, name, slug")
    .eq("owner_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (ownedError) {
    console.error("Error fetching owned beauty pages:", ownedError);
  }

  // Fetch beauty pages where user is a member
  const { data: memberPages, error: memberError } = await supabase
    .from("beauty_page_members")
    .select("roles, beauty_pages (id, name, slug)")
    .eq("user_id", userId);

  if (memberError) {
    console.error("Error fetching member beauty pages:", memberError);
  }

  // Build a map to deduplicate (owner might also be a member)
  const pageMap = new Map<string, UserBeautyPage>();

  // Add owned pages first (they take priority)
  for (const page of ownedPages ?? []) {
    pageMap.set(page.id, {
      ...page,
      relationship: "owner",
    });
  }

  // Add member pages (skip if already added as owner)
  for (const member of memberPages ?? []) {
    const page = member.beauty_pages as unknown as {
      id: string;
      name: string;
      slug: string;
    } | null;
    if (page && !pageMap.has(page.id)) {
      pageMap.set(page.id, {
        ...page,
        relationship: "member",
        roles: member.roles,
      });
    }
  }

  return Array.from(pageMap.values());
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
