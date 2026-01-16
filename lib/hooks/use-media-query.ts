"use client";

import { useSyncExternalStore } from "react";

/**
 * Hook to detect if a media query matches.
 *
 * Uses useSyncExternalStore for proper React 18+ concurrent mode support.
 * Returns false during SSR (mobile-first approach).
 *
 * @param query - Media query string (e.g., "(min-width: 768px)")
 * @returns Whether the media query currently matches
 *
 * @example
 * const isDesktop = useMediaQuery("(min-width: 768px)");
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", callback);
      return () => mql.removeEventListener("change", callback);
    },
    () => window.matchMedia(query).matches,
    () => false, // SSR fallback - assume mobile-first
  );
}
