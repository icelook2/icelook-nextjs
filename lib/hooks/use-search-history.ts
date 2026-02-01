"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Represents a recently viewed beauty page stored in localStorage.
 * Snapshot of page data at time of viewing for offline display.
 */
export interface RecentlyViewedPage {
  id: string;
  slug: string;
  name: string;
  displayName: string | null;
  avatarUrl: string | null;
  city: string | null;
  isVerified: boolean;
  viewedAt: string;
}

const STORAGE_KEY = "icelook_recently_viewed";
const MAX_ITEMS = 20;

/**
 * Hook for managing search history in localStorage.
 * Provides recently viewed pages and prefix filtering for Instagram-like search UX.
 *
 * @example
 * ```tsx
 * const { recentlyViewed, addViewedPage, filterByPrefix } = useSearchHistory();
 *
 * // Add a page when user views it
 * addViewedPage({
 *   id: result.id,
 *   slug: result.slug,
 *   name: result.name,
 *   displayName: result.display_name,
 *   avatarUrl: result.avatar_url,
 *   city: result.city,
 *   isVerified: result.is_verified,
 * });
 *
 * // Filter for 1-2 char queries
 * const filtered = filterByPrefix("Au"); // Returns pages starting with "Au"
 * ```
 */
export function useSearchHistory() {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedPage[]>(
    []
  );
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentlyViewedPage[];
        setRecentlyViewed(parsed);
      }
    } catch (error) {
      console.error("Failed to load search history:", error);
    }
    setIsLoaded(true);
  }, []);

  /**
   * Add a viewed page to history.
   * Updates existing entry timestamp if already present, otherwise adds new.
   * Automatically prunes to MAX_ITEMS.
   */
  const addViewedPage = useCallback(
    (
      page: Omit<RecentlyViewedPage, "viewedAt"> & { viewedAt?: string }
    ): void => {
      setRecentlyViewed((prev) => {
        // Remove existing entry if present
        const filtered = prev.filter((p) => p.id !== page.id);

        // Add new entry at the beginning with current timestamp
        const updated: RecentlyViewedPage[] = [
          { ...page, viewedAt: page.viewedAt ?? new Date().toISOString() },
          ...filtered,
        ].slice(0, MAX_ITEMS);

        // Persist to localStorage
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (error) {
          console.error("Failed to save search history:", error);
        }

        return updated;
      });
    },
    []
  );

  /**
   * Remove a page from history.
   */
  const removeViewedPage = useCallback((pageId: string): void => {
    setRecentlyViewed((prev) => {
      const updated = prev.filter((p) => p.id !== pageId);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error("Failed to save search history:", error);
      }

      return updated;
    });
  }, []);

  /**
   * Clear all history.
   */
  const clearHistory = useCallback((): void => {
    setRecentlyViewed([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear search history:", error);
    }
  }, []);

  /**
   * Filter recently viewed pages by prefix match.
   * Matches against slug, name, and displayName.
   * Used for 1-2 character queries (Instagram-like instant results).
   */
  const filterByPrefix = useCallback(
    (query: string): RecentlyViewedPage[] => {
      if (!query) return [];

      const q = query.toLowerCase();
      return recentlyViewed.filter(
        (page) =>
          page.slug.toLowerCase().startsWith(q) ||
          page.name.toLowerCase().startsWith(q) ||
          page.displayName?.toLowerCase().startsWith(q)
      );
    },
    [recentlyViewed]
  );

  return {
    recentlyViewed,
    isLoaded,
    addViewedPage,
    removeViewedPage,
    clearHistory,
    filterByPrefix,
  };
}
