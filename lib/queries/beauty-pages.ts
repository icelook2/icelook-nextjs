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
};

export type BeautyPageWithType = BeautyPage & {
 beauty_page_types: Array<{
 id: string;
 name: string;
 }>;
};

export type UserBeautyPage = Pick<BeautyPage, "id" | "name" | "slug">;

/**
 * Fetches all beauty pages owned by a user
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
 .select("id, name, slug")
 .eq("owner_id", userId)
 .order("created_at", { ascending: false });

 if (error) {
 console.error("Error fetching user beauty pages:", error);
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
