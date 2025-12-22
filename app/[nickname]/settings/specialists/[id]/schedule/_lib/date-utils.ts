import {
  addDays,
  format,
  isSameDay,
  isToday,
  startOfWeek,
  subDays,
} from "date-fns";
import type { ViewMode } from "./types";

/**
 * Get start date for a view mode
 */
export function getViewStartDate(referenceDate: Date, mode: ViewMode): Date {
  switch (mode) {
    case "week":
      // Week starts on Monday
      return startOfWeek(referenceDate, { weekStartsOn: 1 });
    case "7days":
    case "3days":
    case "day":
      return referenceDate;
  }
}

/**
 * Get array of dates for a view mode
 */
export function getViewDates(referenceDate: Date, mode: ViewMode): Date[] {
  const startDate = getViewStartDate(referenceDate, mode);
  const daysCount = getViewDaysCount(mode);

  return Array.from({ length: daysCount }, (_, i) => addDays(startDate, i));
}

/**
 * Get number of days for a view mode
 */
export function getViewDaysCount(mode: ViewMode): number {
  switch (mode) {
    case "week":
    case "7days":
      return 7;
    case "3days":
      return 3;
    case "day":
      return 1;
  }
}

/**
 * Navigate to previous period based on view mode
 */
export function getPreviousDate(referenceDate: Date, mode: ViewMode): Date {
  const daysToSubtract = getViewDaysCount(mode);
  return subDays(referenceDate, daysToSubtract);
}

/**
 * Navigate to next period based on view mode
 */
export function getNextDate(referenceDate: Date, mode: ViewMode): Date {
  const daysToAdd = getViewDaysCount(mode);
  return addDays(referenceDate, daysToAdd);
}

/**
 * Format date for display in header (e.g., "Mon 23")
 */
export function formatDayHeader(date: Date): {
  dayName: string;
  dayNumber: string;
} {
  return {
    dayName: format(date, "EEE"),
    dayNumber: format(date, "d"),
  };
}

/**
 * Format date for display in toolbar (e.g., "December 2025")
 */
export function formatMonthYear(date: Date): string {
  return format(date, "MMMM yyyy");
}

/**
 * Format date range for display (e.g., "Dec 23 - 29, 2025")
 */
export function formatDateRange(dates: Date[]): string {
  if (dates.length === 0) {
    return "";
  }

  if (dates.length === 1) {
    return format(dates[0], "MMMM d, yyyy");
  }

  const first = dates[0];
  const last = dates[dates.length - 1];

  // Same month
  if (format(first, "M yyyy") === format(last, "M yyyy")) {
    return `${format(first, "MMM d")} - ${format(last, "d, yyyy")}`;
  }

  // Different months
  return `${format(first, "MMM d")} - ${format(last, "MMM d, yyyy")}`;
}

/**
 * Convert date to ISO date string (YYYY-MM-DD)
 */
export function toDateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * Parse ISO date string to Date object
 */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Check if date is today
 */
export function checkIsToday(date: Date): boolean {
  return isToday(date);
}

/**
 * Check if two dates are the same day
 */
export function areSameDay(date1: Date, date2: Date): boolean {
  return isSameDay(date1, date2);
}

/**
 * Get today's date at midnight
 */
export function getToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
