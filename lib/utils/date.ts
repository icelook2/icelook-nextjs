/**
 * Date formatting utilities.
 */

/**
 * Formats a date as a relative time string (e.g., "2 days ago", "3 weeks ago").
 * Returns the localized string for how long ago the date was.
 *
 * @param date - The date to format
 * @param locale - The locale to use for formatting (default: "en")
 * @returns A human-readable relative time string
 */
export function formatDistanceToNow(date: Date, locale = "en"): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (diffYears > 0) {
    return rtf.format(-diffYears, "year");
  }
  if (diffMonths > 0) {
    return rtf.format(-diffMonths, "month");
  }
  if (diffWeeks > 0) {
    return rtf.format(-diffWeeks, "week");
  }
  if (diffDays > 0) {
    return rtf.format(-diffDays, "day");
  }
  if (diffHours > 0) {
    return rtf.format(-diffHours, "hour");
  }
  if (diffMinutes > 0) {
    return rtf.format(-diffMinutes, "minute");
  }
  return rtf.format(-diffSeconds, "second");
}
