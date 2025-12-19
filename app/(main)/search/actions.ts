"use server";

import { createClient } from "@/lib/supabase/server";

export type Specialty =
  | "barber"
  | "hair_stylist"
  | "colorist"
  | "nail_tech"
  | "makeup_artist"
  | "lash_tech"
  | "brow_artist";

export type SearchResult = {
  id: string;
  username: string;
  display_name: string;
  specialty: Specialty;
  avatar_url: string | null;
};

export async function searchSpecialists(
  query: string,
): Promise<SearchResult[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const supabase = await createClient();

  // Escape SQL wildcard characters to prevent unintended pattern matching
  const escapedQuery = query.trim().replace(/[%_\\]/g, "\\$&");
  const searchTerm = `%${escapedQuery}%`;

  const { data, error } = await supabase
    .from("specialists")
    .select("id, username, display_name, specialty, avatar_url")
    .eq("is_active", true)
    .or(`username.ilike.${searchTerm},display_name.ilike.${searchTerm}`)
    .limit(20);

  if (error) {
    console.error("Search error:", error);
    return [];
  }

  return (data as SearchResult[]) || [];
}
