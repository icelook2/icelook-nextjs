/**
 * Pattern generators for creating working days from templates.
 * Used for rotation patterns, weekly templates, and bulk date selection.
 */

import { eachDayOfInterval, format, getDay, parseISO } from "date-fns";
import type {
  BulkPattern,
  DayOfWeek,
  GeneratedWorkingDay,
  RotationPattern,
  SchedulePattern,
  WeeklyPattern,
} from "./types";

// ============================================================================
// Rotation Pattern Generator
// ============================================================================

/**
 * Generate working days from a rotation pattern (e.g., 5 on, 2 off).
 *
 * The pattern starts from the startDate and repeats:
 * - Work for `daysOn` days
 * - Rest for `daysOff` days
 * - Repeat until endDate
 */
export function generateFromRotationPattern(
  pattern: RotationPattern,
): GeneratedWorkingDay[] {
  const { startDate, endDate, daysOn, daysOff, workingHours } = pattern;
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const cycleLength = daysOn + daysOff;

  const workingDays: GeneratedWorkingDay[] = [];
  const allDays = eachDayOfInterval({ start, end });

  for (let i = 0; i < allDays.length; i++) {
    const dayInCycle = i % cycleLength;
    const isWorkDay = dayInCycle < daysOn;

    if (isWorkDay) {
      workingDays.push({
        date: format(allDays[i], "yyyy-MM-dd"),
        startTime: workingHours.start,
        endTime: workingHours.end,
        breaks: [...workingHours.breaks],
      });
    }
  }

  return workingDays;
}

// ============================================================================
// Weekly Pattern Generator
// ============================================================================

/**
 * Generate working days from a weekly template.
 *
 * Generates working days for specified days of the week (0=Sunday, 6=Saturday)
 * between startDate and endDate.
 */
export function generateFromWeeklyPattern(
  pattern: WeeklyPattern,
): GeneratedWorkingDay[] {
  const { startDate, endDate, workingDays: weekDays, workingHours } = pattern;
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  const workingDaysResult: GeneratedWorkingDay[] = [];
  const allDays = eachDayOfInterval({ start, end });

  for (const day of allDays) {
    const dayOfWeek = getDay(day) as DayOfWeek;

    if (weekDays.includes(dayOfWeek)) {
      workingDaysResult.push({
        date: format(day, "yyyy-MM-dd"),
        startTime: workingHours.start,
        endTime: workingHours.end,
        breaks: [...workingHours.breaks],
      });
    }
  }

  return workingDaysResult;
}

// ============================================================================
// Bulk Pattern Generator
// ============================================================================

/**
 * Generate working days from a bulk selection of dates.
 *
 * Simply applies the same working hours to all selected dates.
 */
export function generateFromBulkPattern(
  pattern: BulkPattern,
): GeneratedWorkingDay[] {
  const { dates, workingHours } = pattern;

  return dates.map((date) => ({
    date,
    startTime: workingHours.start,
    endTime: workingHours.end,
    breaks: [...workingHours.breaks],
  }));
}

// ============================================================================
// Unified Generator
// ============================================================================

/**
 * Generate working days from any pattern type.
 */
export function generateFromPattern(
  pattern: SchedulePattern,
): GeneratedWorkingDay[] {
  switch (pattern.type) {
    case "rotation":
      return generateFromRotationPattern(pattern);
    case "weekly":
      return generateFromWeeklyPattern(pattern);
    case "bulk":
      return generateFromBulkPattern(pattern);
    default: {
      const exhaustiveCheck: never = pattern;
      throw new Error(`Unknown pattern type: ${exhaustiveCheck}`);
    }
  }
}

// ============================================================================
// Pattern Preview Helpers
// ============================================================================

/**
 * Get a preview of how many working days will be generated.
 */
export function getPatternPreviewCount(pattern: SchedulePattern): number {
  return generateFromPattern(pattern).length;
}

/**
 * Get the first N days of a pattern for preview.
 */
export function getPatternPreview(
  pattern: SchedulePattern,
  limit = 7,
): GeneratedWorkingDay[] {
  return generateFromPattern(pattern).slice(0, limit);
}

// ============================================================================
// Date Range Utilities
// ============================================================================

/**
 * Get the start and end of a month.
 */
export function getMonthRange(
  year: number,
  month: number,
): { start: Date; end: Date } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { start, end };
}

/**
 * Get formatted date range strings for a month.
 */
export function getMonthDateRange(
  year: number,
  month: number,
): { startDate: string; endDate: string } {
  const { start, end } = getMonthRange(year, month);
  return {
    startDate: format(start, "yyyy-MM-dd"),
    endDate: format(end, "yyyy-MM-dd"),
  };
}

/**
 * Filter out dates that already have working days.
 */
export function filterExistingDates(
  generatedDays: GeneratedWorkingDay[],
  existingDates: string[],
): GeneratedWorkingDay[] {
  const existingSet = new Set(existingDates);
  return generatedDays.filter((day) => !existingSet.has(day.date));
}

/**
 * Count how many days will be added vs updated.
 */
export function countNewAndExisting(
  generatedDays: GeneratedWorkingDay[],
  existingDates: string[],
): { newCount: number; updateCount: number } {
  const existingSet = new Set(existingDates);
  let newCount = 0;
  let updateCount = 0;

  for (const day of generatedDays) {
    if (existingSet.has(day.date)) {
      updateCount++;
    } else {
      newCount++;
    }
  }

  return { newCount, updateCount };
}
