"use server";

import {
  type BeautyPageSearchResult,
  SEARCH_PAGE_SIZE,
  searchBeautyPages,
} from "@/lib/queries/search";

type SearchResult =
  | {
      success: true;
      results: BeautyPageSearchResult[];
      hasMore: boolean;
    }
  | { success: false; error: string };

/**
 * Server action for searching beauty pages.
 * Called from the client-side search component with debouncing.
 *
 * @param query - Search query (minimum 2 characters)
 * @param offset - Number of results to skip (for pagination)
 * @returns Search results with pagination info or error
 */
export async function searchAction(
  query: string,
  offset = 0,
): Promise<SearchResult> {
  // Minimum query length check
  if (!query || query.trim().length < 2) {
    return { success: true, results: [], hasMore: false };
  }

  try {
    const { results, hasMore } = await searchBeautyPages(query, {
      offset,
      limit: SEARCH_PAGE_SIZE,
    });
    return { success: true, results, hasMore };
  } catch (error) {
    console.error("Search action error:", error);
    return { success: false, error: "Search failed" };
  }
}
