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

/** Default page size for search results */
export const SEARCH_PAGE_SIZE = 5;

export type SearchBeautyPagesResult = {
  results: BeautyPageSearchResult[];
  hasMore: boolean;
};

export type SearchBeautyPagesOptions = {
  offset?: number;
  limit?: number;
  /** User ID of the viewer - beauty pages where viewer is banned will be filtered out */
  viewerId?: string | null;
};

/**
 * Searches beauty pages by nickname (slug), name, and display_name
 * using trigram similarity (pg_trgm) for fuzzy matching.
 *
 * Handles typos gracefully - "mariya" will match "Maria" etc.
 * Pagination is handled at the database level for efficiency.
 *
 * If viewerId is provided, beauty pages where the viewer is banned
 * will be automatically filtered out of the results.
 *
 * @param query - Search query string (minimum 2 characters recommended)
 * @param options - Pagination and filtering options
 * @returns Search results with pagination info
 */
export async function searchBeautyPages(
  query: string,
  options: SearchBeautyPagesOptions = {},
): Promise<SearchBeautyPagesResult> {
  const { offset = 0, limit = SEARCH_PAGE_SIZE, viewerId } = options;

  if (!query || query.trim().length === 0) {
    return { results: [], hasMore: false };
  }

  const supabase = await createClient();

  // Request limit + 1 to check if there are more results
  const { data, error } = await supabase.rpc("search_beauty_pages", {
    search_query: query.trim().toLowerCase(),
    result_limit: limit + 1,
    result_offset: offset,
    viewer_id: viewerId ?? null,
  });

  if (error) {
    console.error("Error searching beauty pages:", error);
    return { results: [], hasMore: false };
  }

  const allResults = (data ?? []) as BeautyPageSearchResult[];

  // Check if there are more results beyond this page
  const hasMore = allResults.length > limit;

  // Return only the requested number of results
  const results = hasMore ? allResults.slice(0, limit) : allResults;

  return { results, hasMore };
}
