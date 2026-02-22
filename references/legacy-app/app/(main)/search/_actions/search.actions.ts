"use server";

import { getProfile } from "@/lib/auth/session";
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
 * Automatically filters out beauty pages where the current user is banned.
 * Searches start from the first character using prefix matching.
 *
 * @param query - Search query (minimum 1 character)
 * @param offset - Number of results to skip (for pagination)
 * @returns Search results with pagination info or error
 */
export async function searchAction(
  query: string,
  offset = 0,
): Promise<SearchResult> {
  // Minimum query length check
  if (!query || query.trim().length < 1) {
    return { success: true, results: [], hasMore: false };
  }

  try {
    // Get current user for ban filtering
    const currentUser = await getProfile();

    const { results, hasMore } = await searchBeautyPages(query, {
      offset,
      limit: SEARCH_PAGE_SIZE,
      viewerId: currentUser?.id ?? null,
    });
    return { success: true, results, hasMore };
  } catch (error) {
    console.error("Search action error:", error);
    return { success: false, error: "Search failed" };
  }
}
