"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { setActiveBeautyPageAction } from "@/app/actions/active-beauty-page";
import type { UserBeautyPage } from "@/lib/queries/beauty-pages";

/** User role based on whether they have beauty pages */
export type UserRole = "client" | "creator";

interface ActiveBeautyPageContextValue {
  /** All beauty pages owned by the user */
  beautyPages: UserBeautyPage[];
  /** Currently active beauty page (null for clients) */
  activeBeautyPage: UserBeautyPage | null;
  /** Switch to a different beauty page */
  switchBeautyPage: (beautyPageId: string) => Promise<void>;
  /** User role based on whether they have beauty pages */
  role: UserRole;
}

const ActiveBeautyPageContext =
  createContext<ActiveBeautyPageContextValue | null>(null);

interface ActiveBeautyPageProviderProps {
  children: ReactNode;
  /** All beauty pages owned by the user */
  beautyPages: UserBeautyPage[];
  /** Initial active beauty page ID from cookie */
  initialActiveId: string | null;
}

export function ActiveBeautyPageProvider({
  children,
  beautyPages,
  initialActiveId,
}: ActiveBeautyPageProviderProps) {
  // Default to first beauty page if no active set, or if saved ID is invalid
  const validInitialId =
    initialActiveId && beautyPages.some((bp) => bp.id === initialActiveId)
      ? initialActiveId
      : (beautyPages[0]?.id ?? null);

  const [activeId, setActiveId] = useState<string | null>(validInitialId);

  const activeBeautyPage = useMemo(
    () => beautyPages.find((bp) => bp.id === activeId) ?? null,
    [beautyPages, activeId],
  );

  const role: UserRole = beautyPages.length > 0 ? "creator" : "client";

  const switchBeautyPage = useCallback(async (beautyPageId: string) => {
    // Optimistically update state
    setActiveId(beautyPageId);
    // Persist to cookie
    await setActiveBeautyPageAction(beautyPageId);
  }, []);

  const value = useMemo(
    () => ({
      beautyPages,
      activeBeautyPage,
      switchBeautyPage,
      role,
    }),
    [beautyPages, activeBeautyPage, switchBeautyPage, role],
  );

  return (
    <ActiveBeautyPageContext.Provider value={value}>
      {children}
    </ActiveBeautyPageContext.Provider>
  );
}

/**
 * Hook to access the active beauty page context.
 * Must be used within an ActiveBeautyPageProvider.
 */
export function useActiveBeautyPage(): ActiveBeautyPageContextValue {
  const context = useContext(ActiveBeautyPageContext);
  if (!context) {
    throw new Error(
      "useActiveBeautyPage must be used within ActiveBeautyPageProvider",
    );
  }
  return context;
}
