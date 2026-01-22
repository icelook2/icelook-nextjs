import { format, getDay, parseISO } from "date-fns";
import type {
  ConfigureScheduleStep,
  SelectedDateInfo,
} from "./configure-schedule-types";

// ============================================================================
// Constants
// ============================================================================

export const STEP_ORDER: ConfigureScheduleStep[] = [
  "select-days",
  "configure-hours",
  "configure-breaks",
  "confirmation",
];

// ============================================================================
// Helpers
// ============================================================================

/**
 * Simple ID generator (iOS compatible alternative to crypto.randomUUID)
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Convert JS getDay() result (0=Sun, 1=Mon) to our weekday system (0=Mon, 6=Sun)
 */
export function jsWeekdayToOurs(jsWeekday: number): number {
  return jsWeekday === 0 ? 6 : jsWeekday - 1;
}

/**
 * Group selected dates by weekday for display and configuration
 */
export function deriveSelectedDatesByWeekday(
  selectedDates: Set<string>,
): Map<number, SelectedDateInfo[]> {
  const grouped = new Map<number, SelectedDateInfo[]>();

  for (const dateStr of selectedDates) {
    const date = parseISO(dateStr);
    const jsWeekday = getDay(date); // 0=Sun, 1=Mon, ...
    const weekday = jsWeekdayToOurs(jsWeekday); // 0=Mon, ..., 6=Sun

    if (!grouped.has(weekday)) {
      grouped.set(weekday, []);
    }

    grouped.get(weekday)?.push({
      dateStr,
      date,
      weekday,
      weekdayName: format(date, "EEEE"), // Full day name
    });
  }

  // Sort dates within each weekday
  for (const dates of grouped.values()) {
    dates.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  return grouped;
}
