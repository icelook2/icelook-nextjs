"use server";

import {
  searchBeautyPages,
  type BeautyPageSearchResult,
} from "@/lib/queries/search";

type SearchResult =
  | { success: true; results: BeautyPageSearchResult[] }
  | { success: false; error: string };

/**
 * Server action for searching beauty pages.
 * Called from the client-side search component with debouncing.
 *
 * @param query - Search query (minimum 2 characters)
 * @returns Search results or error
 */
export async function searchAction(query: string): Promise<SearchResult> {
  // Minimum query length check
  if (!query || query.trim().length < 2) {
    return { success: true, results: [] };
  }

  try {
    const results = await searchBeautyPages(query);
    return { success: true, results };
  } catch (error) {
    console.error("Search action error:", error);
    return { success: false, error: "Search failed" };
  }
}
