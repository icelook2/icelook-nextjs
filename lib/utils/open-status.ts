/**
 * Utility for calculating business open/closed status based on business hours.
 *
 * Uses the beauty page's timezone to determine current local time and compare
 * against configured business hours.
 */

import type { DayHours } from "@/lib/queries/beauty-page-profile";

export interface OpenStatus {
  isOpen: boolean;
  message: string;
  /** Time when status will change (e.g., "18:00" for closing, "09:00" for opening) */
  nextChangeTime: string | null;
}

/**
 * Get current time in a specific timezone as hours and minutes.
 */
function getCurrentTimeInTimezone(timezone: string): {
  hours: number;
  minutes: number;
  dayOfWeek: number;
} {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    weekday: "short",
  });

  const parts = formatter.formatToParts(now);
  const hourPart = parts.find((p) => p.type === "hour");
  const minutePart = parts.find((p) => p.type === "minute");
  const weekdayPart = parts.find((p) => p.type === "weekday");

  const hours = hourPart ? parseInt(hourPart.value, 10) : 0;
  const minutes = minutePart ? parseInt(minutePart.value, 10) : 0;

  // Convert weekday string to number (0 = Sunday, 6 = Saturday)
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const dayOfWeek = weekdayPart ? (weekdayMap[weekdayPart.value] ?? 0) : 0;

  return { hours, minutes, dayOfWeek };
}

/**
 * Parse time string "HH:MM" or "HH:MM:SS" to minutes since midnight.
 */
function parseTimeToMinutes(time: string | null): number | null {
  if (!time) {
    return null;
  }
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Format minutes since midnight to "HH:MM" string.
 */
function formatMinutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

/**
 * Find the next day's opening hours starting from a given day.
 * Returns the day index and opening time, or null if no open days found.
 */
function findNextOpenDay(
  businessHours: DayHours[],
  startDayOfWeek: number,
): { dayOfWeek: number; openTime: string } | null {
  // Check up to 7 days ahead
  for (let i = 0; i < 7; i++) {
    const checkDay = (startDayOfWeek + i) % 7;
    const dayHours = businessHours.find((h) => h.day_of_week === checkDay);

    if (dayHours?.is_open && dayHours.open_time) {
      return { dayOfWeek: checkDay, openTime: dayHours.open_time.slice(0, 5) };
    }
  }

  return null;
}

/**
 * Calculate the current open/closed status for a beauty page.
 *
 * @param businessHours - Array of business hours for all days of the week
 * @param timezone - IANA timezone string (e.g., "Europe/Kyiv")
 * @returns OpenStatus object with isOpen, message, and nextChangeTime
 */
export function calculateOpenStatus(
  businessHours: DayHours[],
  timezone: string,
): OpenStatus {
  // Default timezone if not provided
  const tz = timezone || "Europe/Kyiv";

  // Get current time in the business's timezone
  const { hours, minutes, dayOfWeek } = getCurrentTimeInTimezone(tz);
  const currentMinutes = hours * 60 + minutes;

  // Find today's business hours
  const todayHours = businessHours.find((h) => h.day_of_week === dayOfWeek);

  // If today is marked as closed or no hours configured
  if (!todayHours || !todayHours.is_open) {
    const nextOpen = findNextOpenDay(businessHours, (dayOfWeek + 1) % 7);

    if (nextOpen) {
      return {
        isOpen: false,
        message: "closed",
        nextChangeTime: nextOpen.openTime,
      };
    }

    return {
      isOpen: false,
      message: "closed",
      nextChangeTime: null,
    };
  }

  const openMinutes = parseTimeToMinutes(todayHours.open_time);
  const closeMinutes = parseTimeToMinutes(todayHours.close_time);

  // Check if we're within open hours
  if (openMinutes !== null && closeMinutes !== null) {
    // Before opening time
    if (currentMinutes < openMinutes) {
      return {
        isOpen: false,
        message: "closed",
        nextChangeTime: formatMinutesToTime(openMinutes),
      };
    }

    // After closing time
    if (currentMinutes >= closeMinutes) {
      const nextOpen = findNextOpenDay(businessHours, (dayOfWeek + 1) % 7);

      return {
        isOpen: false,
        message: "closed",
        nextChangeTime: nextOpen?.openTime ?? null,
      };
    }

    // Currently open
    return {
      isOpen: true,
      message: "open",
      nextChangeTime: formatMinutesToTime(closeMinutes),
    };
  }

  // Fallback: if times not configured, consider it closed
  return {
    isOpen: false,
    message: "closed",
    nextChangeTime: null,
  };
}

/**
 * Get a formatted message for the open status suitable for display.
 *
 * @param status - The calculated OpenStatus
 * @param t - Translation function that takes keys like "open_now", "closed", "closes_at", "opens_at"
 * @returns Formatted display string
 */
export function formatOpenStatusMessage(
  status: OpenStatus,
  t: (key: string, params?: Record<string, string>) => string,
): string {
  if (status.isOpen) {
    if (status.nextChangeTime) {
      return t("closes_at", { time: status.nextChangeTime });
    }
    return t("open_now");
  }

  if (status.nextChangeTime) {
    return t("opens_at", { time: status.nextChangeTime });
  }

  return t("closed");
}
