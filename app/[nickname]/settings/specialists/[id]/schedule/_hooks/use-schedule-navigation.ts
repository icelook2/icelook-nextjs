"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import {
  getNextDate,
  getPreviousDate,
  getToday,
  getViewDates,
  parseDate,
  toDateString,
} from "../_lib/date-utils";
import type { ViewMode } from "../_lib/types";

/**
 * Hook for managing schedule navigation state via URL params
 * Enables shareable links and browser back/forward navigation
 */
export function useScheduleNavigation() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Read current state from URL
  const viewMode = (searchParams.get("view") as ViewMode) ?? "week";
  const dateParam = searchParams.get("date");
  const currentDate = useMemo(
    () => (dateParam ? parseDate(dateParam) : getToday()),
    [dateParam],
  );

  // Get dates to display based on view mode
  const dates = useMemo(
    () => getViewDates(currentDate, viewMode),
    [currentDate, viewMode],
  );

  // Update URL params helper
  const updateParams = useCallback(
    (updates: { view?: ViewMode; date?: Date }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (updates.view !== undefined) {
        params.set("view", updates.view);
      }

      if (updates.date !== undefined) {
        params.set("date", toDateString(updates.date));
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  // Navigation actions
  const setViewMode = useCallback(
    (mode: ViewMode) => {
      updateParams({ view: mode });
    },
    [updateParams],
  );

  const setDate = useCallback(
    (date: Date) => {
      updateParams({ date });
    },
    [updateParams],
  );

  const goToToday = useCallback(() => {
    updateParams({ date: getToday() });
  }, [updateParams]);

  const goToPrevious = useCallback(() => {
    const prevDate = getPreviousDate(currentDate, viewMode);
    updateParams({ date: prevDate });
  }, [currentDate, viewMode, updateParams]);

  const goToNext = useCallback(() => {
    const nextDate = getNextDate(currentDate, viewMode);
    updateParams({ date: nextDate });
  }, [currentDate, viewMode, updateParams]);

  return {
    // State
    viewMode,
    currentDate,
    dates,

    // Actions
    setViewMode,
    setDate,
    goToToday,
    goToPrevious,
    goToNext,
  };
}
