/**
 * Utility for calculating working status based on scheduled working days.
 *
 * Uses the beauty page's timezone to determine current local time and compare
 * against scheduled working days (specific dates with times).
 */

export interface WorkingDayForStatus {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM or HH:MM:SS
  endTime: string; // HH:MM or HH:MM:SS
}

export interface OpenStatus {
  isOpen: boolean;
  message: string;
  /** Time when status will change (e.g., "18:00" for closing, "09:00" for opening) */
  nextChangeTime: string | null;
  /** Day of week when business will next open (0-6, Sunday-Saturday) */
  nextOpenDayOfWeek: number | null;
  /** Whether the business opens later today */
  opensToday: boolean;
  /** Whether the business opens tomorrow */
  opensTomorrow: boolean;
  /** The actual date string when business will next open (YYYY-MM-DD) */
  nextOpenDate: string | null;
}

/**
 * Get current time in a specific timezone as hours, minutes, and date string.
 */
function getCurrentTimeInTimezone(timezone: string): {
  hours: number;
  minutes: number;
  dayOfWeek: number;
  dateString: string;
} {
  const now = new Date();

  // Get date string in timezone
  const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dateString = dateFormatter.format(now); // YYYY-MM-DD format

  // Get time components
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    weekday: "short",
  });

  const parts = timeFormatter.formatToParts(now);
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

  return { hours, minutes, dayOfWeek, dateString };
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
 * Normalize time string to HH:MM format
 */
function normalizeTime(time: string): string {
  return time.slice(0, 5);
}

/**
 * Check if a date string is tomorrow relative to today
 */
function isTomorrow(today: string, checkDate: string): boolean {
  const todayDate = new Date(today + "T00:00:00");
  const nextDate = new Date(checkDate + "T00:00:00");
  const diffDays = Math.round(
    (nextDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  return diffDays === 1;
}

/**
 * Get day of week from a date string
 */
function getDayOfWeek(dateString: string): number {
  const date = new Date(dateString + "T00:00:00");
  return date.getDay();
}

/**
 * Calculate the current working status from scheduled working days.
 *
 * @param workingDays - Array of scheduled working days (sorted by date ascending)
 * @param timezone - IANA timezone string (e.g., "Europe/Kyiv")
 * @returns OpenStatus object with isOpen, message, and nextChangeTime
 */
export function calculateOpenStatusFromWorkingDays(
  workingDays: WorkingDayForStatus[],
  timezone: string,
): OpenStatus {
  // Default timezone if not provided
  const tz = timezone || "Europe/Kyiv";

  // Get current time in the business's timezone
  const { hours, minutes, dateString: todayStr } = getCurrentTimeInTimezone(tz);
  const currentMinutes = hours * 60 + minutes;

  // Find today's working day
  const todayWorkingDay = workingDays.find((wd) => wd.date === todayStr);

  if (todayWorkingDay) {
    const openMinutes = parseTimeToMinutes(
      normalizeTime(todayWorkingDay.startTime),
    );
    const closeMinutes = parseTimeToMinutes(
      normalizeTime(todayWorkingDay.endTime),
    );

    if (openMinutes !== null && closeMinutes !== null) {
      // Before opening time (today is a working day, but not open yet)
      if (currentMinutes < openMinutes) {
        return {
          isOpen: false,
          message: "closed",
          nextChangeTime: formatMinutesToTime(openMinutes),
          nextOpenDayOfWeek: getDayOfWeek(todayStr),
          opensToday: true,
          opensTomorrow: false,
          nextOpenDate: todayStr,
        };
      }

      // Currently open
      if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
        return {
          isOpen: true,
          message: "open",
          nextChangeTime: formatMinutesToTime(closeMinutes),
          nextOpenDayOfWeek: null,
          opensToday: false,
          opensTomorrow: false,
          nextOpenDate: null,
        };
      }
    }
  }

  // Today is closed or past closing time - find next working day
  const nextWorkingDay = workingDays.find((wd) => wd.date > todayStr);

  if (nextWorkingDay) {
    const isNextDayTomorrow = isTomorrow(todayStr, nextWorkingDay.date);

    return {
      isOpen: false,
      message: "closed",
      nextChangeTime: normalizeTime(nextWorkingDay.startTime),
      nextOpenDayOfWeek: getDayOfWeek(nextWorkingDay.date),
      opensToday: false,
      opensTomorrow: isNextDayTomorrow,
      nextOpenDate: nextWorkingDay.date,
    };
  }

  // No scheduled working days
  return {
    isOpen: false,
    message: "closed",
    nextChangeTime: null,
    nextOpenDayOfWeek: null,
    opensToday: false,
    opensTomorrow: false,
    nextOpenDate: null,
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

/**
 * Format working status message in a casual/personal tone.
 *
 * Uses the new working_status translation keys with messages like:
 * - "Working until 20:00" (when open)
 * - "Opens at 10:00 today" (closed, opens today)
 * - "Opens tomorrow at 10:00" (closed, opens tomorrow)
 * - "Back on Monday at 9:00" (closed for multiple days)
 * - "No schedule" (no working days configured)
 *
 * @param status - The calculated OpenStatus
 * @param t - Translation function for working_status keys
 * @param dayNames - Array of day names indexed by day of week (0=Sun, 6=Sat)
 * @param formatDate - Optional function to format dates for far-future working days
 * @returns Formatted display string in casual tone
 */
export function formatWorkingStatusMessage(
  status: OpenStatus,
  t: (key: string, params?: Record<string, string>) => string,
  dayNames: string[],
  formatDate?: (dateString: string) => string,
): string {
  // Currently open - show when closing
  if (status.isOpen && status.nextChangeTime) {
    return t("working_until", { time: status.nextChangeTime });
  }

  // No schedule configured
  if (!status.nextChangeTime) {
    return t("no_schedule");
  }

  // Closed but will open later
  if (!status.isOpen && status.nextChangeTime) {
    // Opens today
    if (status.opensToday) {
      return t("opens_today", { time: status.nextChangeTime });
    }

    // Opens tomorrow
    if (status.opensTomorrow) {
      return t("opens_tomorrow", { time: status.nextChangeTime });
    }

    // Opens on another day within the week
    if (status.nextOpenDayOfWeek !== null && dayNames[status.nextOpenDayOfWeek]) {
      // Check if more than 7 days away - use date format instead
      if (status.nextOpenDate && formatDate) {
        const today = new Date();
        const nextDate = new Date(status.nextOpenDate + "T00:00:00");
        const diffDays = Math.round(
          (nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (diffDays > 7) {
          return t("opens_on_date", {
            date: formatDate(status.nextOpenDate),
            time: status.nextChangeTime,
          });
        }
      }

      return t("opens_on_day", {
        day: dayNames[status.nextOpenDayOfWeek],
        time: status.nextChangeTime,
      });
    }
  }

  // Fallback - just closed
  return t("closed");
}

// Legacy export for backwards compatibility during migration
// TODO: Remove after all usages are updated
export { calculateOpenStatusFromWorkingDays as calculateOpenStatus };
