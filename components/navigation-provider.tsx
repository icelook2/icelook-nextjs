"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef } from "react";

interface NavigationContextValue {
  /**
   * Navigate back in history if possible, otherwise go to fallback.
   * Returns true if navigated back in history, false if used fallback.
   */
  smartBack: (fallbackHref: string) => void;
  /**
   * Check if we can go back within the app (not to external site).
   */
  canGoBack: boolean;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

/**
 * NavigationProvider tracks internal navigation history to enable smart back navigation.
 *
 * The problem: Browser's history.length is unreliable for determining if we can go "back"
 * because it includes forward history and external sites. This provider tracks only
 * internal app navigations.
 *
 * How it works:
 * 1. On each pathname change, we push to our internal history stack
 * 2. When smartBack is called, we check if there's a previous internal page
 * 3. If yes, use router.back(); if no, navigate to fallbackHref
 */
export function NavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Track the history stack of pathnames visited within the app
  // We use a ref to avoid re-renders on every navigation
  const historyStackRef = useRef<string[]>([]);

  // Track the previous pathname to detect back navigations
  const previousPathnameRef = useRef<string | null>(null);

  // Track if we're currently going back (to prevent adding to stack)
  const isGoingBackRef = useRef(false);

  // Update history stack on pathname changes
  useEffect(() => {
    if (isGoingBackRef.current) {
      // We're going back, pop from stack instead of pushing
      isGoingBackRef.current = false;
      historyStackRef.current = historyStackRef.current.slice(0, -1);
    } else if (pathname !== previousPathnameRef.current) {
      // Normal forward navigation, push to stack
      historyStackRef.current = [...historyStackRef.current, pathname];
    }
    previousPathnameRef.current = pathname;
  }, [pathname]);

  const canGoBack = historyStackRef.current.length > 1;

  const smartBack = useCallback(
    (fallbackHref: string) => {
      // Check if we have internal history to go back to
      // We need at least 2 entries (current + previous)
      if (historyStackRef.current.length > 1) {
        isGoingBackRef.current = true;
        router.back();
      } else {
        // No internal history, use fallback
        router.push(fallbackHref);
      }
    },
    [router],
  );

  return (
    <NavigationContext.Provider value={{ smartBack, canGoBack }}>
      {children}
    </NavigationContext.Provider>
  );
}

/**
 * Hook to access navigation context.
 * Must be used within a NavigationProvider.
 */
export function useNavigation(): NavigationContextValue {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}

/**
 * Hook for smart back navigation.
 * Returns a function that navigates back in history if possible,
 * otherwise navigates to the fallback URL.
 *
 * @example
 * const handleBack = useSmartBack("/settings");
 * // Later: handleBack() will go back in history or to /settings
 */
export function useSmartBack(fallbackHref: string): () => void {
  const { smartBack } = useNavigation();
  return useCallback(() => smartBack(fallbackHref), [smartBack, fallbackHref]);
}
