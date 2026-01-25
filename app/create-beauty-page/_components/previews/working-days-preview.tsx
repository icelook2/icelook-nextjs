"use client";

import { CalendarDays } from "lucide-react";
import { useTranslations } from "next-intl";

interface WorkingDaysPreviewProps {
  selectedDates: Set<string>;
}

/**
 * Preview component for the Select Working Days step.
 * Shows a count and mini calendar visualization of selected dates.
 */
export function WorkingDaysPreview({ selectedDates }: WorkingDaysPreviewProps) {
  const t = useTranslations("create_beauty_page.select_days");
  const count = selectedDates.size;

  if (count === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-hover">
          <CalendarDays className="h-6 w-6 text-muted" />
        </div>
        <p className="text-sm text-muted">{t("preview_empty")}</p>
      </div>
    );
  }

  // Get sorted dates for display
  const sortedDates = Array.from(selectedDates).sort();
  const firstDate = sortedDates[0];
  const lastDate = sortedDates[sortedDates.length - 1];

  return (
    <div className="space-y-4">
      {/* Count badge */}
      <div className="flex items-center justify-center gap-2">
        <CalendarDays className="h-5 w-5 text-emerald-500" />
        <span className="text-lg font-semibold text-emerald-500">
          {t("preview_count", { count })}
        </span>
      </div>

      {/* Date range */}
      <p className="text-center text-sm text-muted">
        {formatDateRange(firstDate, lastDate)}
      </p>

      {/* Mini calendar grid showing weekdays with selection indicators */}
      <MiniCalendarGrid selectedDates={selectedDates} />
    </div>
  );
}

/**
 * Mini calendar grid showing a week pattern of selected days
 */
function MiniCalendarGrid({ selectedDates }: { selectedDates: Set<string> }) {
  const t = useTranslations("create_beauty_page.select_days");

  // Count selections per weekday (0=Mon, 6=Sun in our system)
  const weekdayCounts = new Map<number, number>();

  for (const dateStr of selectedDates) {
    const date = new Date(dateStr);
    const jsWeekday = date.getDay(); // 0=Sun, 1=Mon
    const ourWeekday = jsWeekday === 0 ? 6 : jsWeekday - 1; // Convert to 0=Mon, 6=Sun
    weekdayCounts.set(ourWeekday, (weekdayCounts.get(ourWeekday) || 0) + 1);
  }

  const weekdays = [
    { label: t("weekdays.mo"), weekday: 0 },
    { label: t("weekdays.tu"), weekday: 1 },
    { label: t("weekdays.we"), weekday: 2 },
    { label: t("weekdays.th"), weekday: 3 },
    { label: t("weekdays.fr"), weekday: 4 },
    { label: t("weekdays.sa"), weekday: 5 },
    { label: t("weekdays.su"), weekday: 6 },
  ];

  return (
    <div className="flex justify-center gap-2">
      {weekdays.map(({ label, weekday }) => {
        const count = weekdayCounts.get(weekday) || 0;
        const hasSelection = count > 0;

        return (
          <div key={weekday} className="flex flex-col items-center gap-1">
            <span className="text-xs text-muted">{label}</span>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                hasSelection
                  ? "bg-emerald-500/20 text-emerald-500"
                  : "bg-surface-hover text-muted"
              }`}
            >
              {hasSelection ? count : "-"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Format date range for display
 */
function formatDateRange(firstDate: string, lastDate: string): string {
  const first = new Date(firstDate);
  const last = new Date(lastDate);

  const formatOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };

  if (firstDate === lastDate) {
    return first.toLocaleDateString(undefined, formatOptions);
  }

  return `${first.toLocaleDateString(undefined, formatOptions)} - ${last.toLocaleDateString(undefined, formatOptions)}`;
}
