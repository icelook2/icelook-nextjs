import { createClient } from "@/lib/supabase/server";

/**
 * Result from the search_beauty_pages RPC function.
 * Includes similarity score for ranking results by relevance.
 */
export type BeautyPageSearchResult = {
  id: string;
  slug: string;
  name: string;
  display_name: string | null;
  logo_url: string | null;
  city: string | null;
  is_verified: boolean;
  type_name: string | null;
  similarity_score: number;
};

/**
 * Searches beauty pages by nickname (slug), name, and display_name
 * using trigram similarity (pg_trgm) for fuzzy matching.
 *
 * Handles typos gracefully - "mariya" will match "Maria" etc.
 *
 * @param query - Search query string (minimum 2 characters recommended)
 * @param limit - Maximum number of results (default 20)
 * @returns Array of search results sorted by similarity score (highest first)
 */
export async function searchBeautyPages(
  query: string,
  limit = 20,
): Promise<BeautyPageSearchResult[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("search_beauty_pages", {
    search_query: query.trim().toLowerCase(),
    result_limit: limit,
  });

  if (error) {
    console.error("Error searching beauty pages:", error);
    return [];
  }

  return (data ?? []) as BeautyPageSearchResult[];
}
