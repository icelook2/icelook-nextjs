import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type Profile = Pick<
  Tables<"profiles">,
  "id" | "full_name" | "email" | "avatar_url"
>;

export type AdminMember = Tables<"beauty_page_members"> & {
  profiles: Profile | null;
};

/**
 * Fetches all admins for a beauty page
 */
export async function getBeautyPageAdmins(
  beautyPageId: string,
): Promise<AdminMember[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("beauty_page_members")
    .select("*, profiles (id, full_name, email, avatar_url)")
    .eq("beauty_page_id", beautyPageId)
    .contains("roles", ["admin"])
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching admins:", error);
    return [];
  }

  return (data ?? []) as AdminMember[];
}

/**
 * Fetches members who are specialists but not admins (for "promote to admin" feature)
 */
export async function getNonAdminSpecialists(
  beautyPageId: string,
): Promise<AdminMember[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("beauty_page_members")
    .select("*, profiles (id, full_name, email, avatar_url)")
    .eq("beauty_page_id", beautyPageId)
    .contains("roles", ["specialist"])
    .not("roles", "cs", '{"admin"}')
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching non-admin specialists:", error);
    return [];
  }

  return (data ?? []) as AdminMember[];
}

/**
 * Checks if a user is an admin of a beauty page
 */
export async function isUserAdmin(
  beautyPageId: string,
  userId: string,
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("beauty_page_members")
    .select("id")
    .eq("beauty_page_id", beautyPageId)
    .eq("user_id", userId)
    .contains("roles", ["admin"])
    .maybeSingle();

  if (error) {
    console.error("Error checking admin status:", error);
    return false;
  }

  return data !== null;
}
