import {
  endOfQuarter,
  endOfYear,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subQuarters,
  subYears,
} from "date-fns";
import type { AnalyticsPeriod } from "./types";

/**
 * Get the date range for a given period type
 */
export function getDateRangeForPeriod(period: AnalyticsPeriod): {
  startDate: Date;
  endDate: Date;
} {
  const now = new Date();
  // Use start of today for cleaner date boundaries
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case "today":
      return {
        startDate: today,
        endDate: now,
      };

    case "yesterday": {
      const yesterday = subDays(today, 1);
      return {
        startDate: yesterday,
        endDate: new Date(
          yesterday.getFullYear(),
          yesterday.getMonth(),
          yesterday.getDate(),
          23,
          59,
          59,
        ),
      };
    }

    case "this_week":
      // Week starts on Monday (locale option)
      return {
        startDate: startOfWeek(today, { weekStartsOn: 1 }),
        endDate: now,
      };

    case "last_7_days":
      return {
        startDate: subDays(today, 6), // Include today = 7 days
        endDate: now,
      };

    case "this_month":
      return {
        startDate: startOfMonth(today),
        endDate: now,
      };

    case "last_30_days":
      return {
        startDate: subDays(today, 29), // Include today = 30 days
        endDate: now,
      };

    case "this_quarter":
      return {
        startDate: startOfQuarter(today),
        endDate: now,
      };

    case "last_quarter": {
      const lastQuarterEnd = subDays(startOfQuarter(today), 1);
      return {
        startDate: startOfQuarter(lastQuarterEnd),
        endDate: endOfQuarter(lastQuarterEnd),
      };
    }

    case "this_year":
      return {
        startDate: startOfYear(today),
        endDate: now,
      };

    case "last_year": {
      const lastYearDate = subYears(today, 1);
      return {
        startDate: startOfYear(lastYearDate),
        endDate: endOfYear(lastYearDate),
      };
    }

    case "all_time":
      // Use a very early date for "all time"
      return {
        startDate: new Date(2020, 0, 1),
        endDate: now,
      };

    default:
      return {
        startDate: subDays(today, 29),
        endDate: now,
      };
  }
}

/**
 * Get the previous period's date range for comparison
 */
export function getPreviousPeriodRange(
  period: AnalyticsPeriod,
  currentStart: Date,
  currentEnd: Date,
): { startDate: Date; endDate: Date } {
  switch (period) {
    case "today":
      // Compare with yesterday
      return {
        startDate: subDays(currentStart, 1),
        endDate: subDays(currentEnd, 1),
      };

    case "yesterday":
      // Compare with day before yesterday
      return {
        startDate: subDays(currentStart, 1),
        endDate: subDays(currentEnd, 1),
      };

    case "this_week":
      // Compare with last week (same weekdays)
      return {
        startDate: subDays(currentStart, 7),
        endDate: subDays(currentEnd, 7),
      };

    case "last_7_days":
      // Compare with previous 7 days
      return {
        startDate: subDays(currentStart, 7),
        endDate: subDays(currentEnd, 7),
      };

    case "this_month":
      // Compare with last month
      return {
        startDate: subMonths(currentStart, 1),
        endDate: subMonths(currentEnd, 1),
      };

    case "last_30_days":
      // Compare with previous 30 days
      return {
        startDate: subDays(currentStart, 30),
        endDate: subDays(currentEnd, 30),
      };

    case "this_quarter":
      // Compare with last quarter
      return {
        startDate: subQuarters(currentStart, 1),
        endDate: subQuarters(currentEnd, 1),
      };

    case "last_quarter":
      // Compare with quarter before that
      return {
        startDate: subQuarters(currentStart, 1),
        endDate: subQuarters(currentEnd, 1),
      };

    case "this_year":
      // Compare with last year
      return {
        startDate: subYears(currentStart, 1),
        endDate: subYears(currentEnd, 1),
      };

    case "last_year":
      // Compare with year before that
      return {
        startDate: subYears(currentStart, 1),
        endDate: subYears(currentEnd, 1),
      };

    case "all_time":
      // No meaningful comparison for all time
      return {
        startDate: currentStart,
        endDate: currentStart, // Empty range = no comparison
      };

    default: {
      const duration = currentEnd.getTime() - currentStart.getTime();
      return {
        startDate: new Date(currentStart.getTime() - duration),
        endDate: new Date(currentStart.getTime() - 1),
      };
    }
  }
}

/**
 * Format currency amount from cents
 */
export function formatCurrency(
  cents: number,
  currency: string,
  locale = "uk-UA",
): string {
  const amount = cents / 100;

  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return formatter.format(amount);
}

/**
 * Format percentage value
 */
export function formatPercentage(value: number | null): string {
  if (value === null) {
    return "—";
  }
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

/**
 * Format trend indicator (positive/negative/neutral)
 */
export function getTrendDirection(
  value: number | null,
): "positive" | "negative" | "neutral" {
  if (value === null || value === 0) {
    return "neutral";
  }
  return value > 0 ? "positive" : "negative";
}

/**
 * Calculate percentage change between two values
 */
export function calculateTrend(
  current: number,
  previous: number,
): number | null {
  if (previous === 0) {
    return current > 0 ? 100 : null;
  }
  return ((current - previous) / previous) * 100;
}

/**
 * Format duration from minutes to human readable
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

/**
 * Convert date to YYYY-MM-DD string
 */
export function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}
