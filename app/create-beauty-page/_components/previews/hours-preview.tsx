"use client";

import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import type { WeekdayHoursData } from "../../_lib/types";

interface HoursPreviewProps {
  weekdayHours: Map<number, WeekdayHoursData>;
  selectedDates: Set<string>;
}

/**
 * Preview component for the Configure Hours step.
 * Shows working hours grouped by weekday type.
 */
export function HoursPreview({
  weekdayHours,
  selectedDates,
}: HoursPreviewProps) {
  const t = useTranslations("create_beauty_page.configure_hours");

  if (weekdayHours.size === 0 || selectedDates.size === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-hover">
          <Clock className="h-6 w-6 text-muted" />
        </div>
        <p className="text-sm text-muted">{t("preview_empty")}</p>
      </div>
    );
  }

  // Count dates per weekday
  const weekdayCounts = new Map<number, number>();
  for (const dateStr of selectedDates) {
    const date = new Date(dateStr);
    const jsWeekday = date.getDay();
    const ourWeekday = jsWeekday === 0 ? 6 : jsWeekday - 1;
    weekdayCounts.set(ourWeekday, (weekdayCounts.get(ourWeekday) || 0) + 1);
  }

  // Group hours by weekdays (Mon-Fri), Saturday, Sunday
  const weekdayIndices = [0, 1, 2, 3, 4]; // Mon-Fri
  const saturdayIndex = 5;
  const sundayIndex = 6;

  const groups: Array<{
    label: string;
    hours: WeekdayHoursData | null;
    dateCount: number;
  }> = [];

  // Check for weekdays
  const weekdaysHours = weekdayIndices
    .map((i) => weekdayHours.get(i))
    .find(Boolean);
  const weekdaysCount = weekdayIndices.reduce(
    (sum, i) => sum + (weekdayCounts.get(i) || 0),
    0,
  );

  if (weekdaysHours && weekdaysCount > 0) {
    groups.push({
      label: t("weekdays_label"),
      hours: weekdaysHours,
      dateCount: weekdaysCount,
    });
  }

  // Check for Saturday
  const saturdayHours = weekdayHours.get(saturdayIndex);
  const saturdayCount = weekdayCounts.get(saturdayIndex) || 0;

  if (saturdayHours && saturdayCount > 0) {
    groups.push({
      label: t("saturday_label"),
      hours: saturdayHours,
      dateCount: saturdayCount,
    });
  }

  // Check for Sunday
  const sundayHours = weekdayHours.get(sundayIndex);
  const sundayCount = weekdayCounts.get(sundayIndex) || 0;

  if (sundayHours && sundayCount > 0) {
    groups.push({
      label: t("sunday_label"),
      hours: sundayHours,
      dateCount: sundayCount,
    });
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="text-center">
        <p className="text-sm text-muted">
          {t("preview_summary", { count: selectedDates.size })}
        </p>
      </div>

      {/* Hours by group */}
      <div className="space-y-3">
        {groups.map((group) => (
          <HoursGroupCard
            key={group.label}
            label={group.label}
            hours={group.hours}
            dateCount={group.dateCount}
          />
        ))}
      </div>
    </div>
  );
}

interface HoursGroupCardProps {
  label: string;
  hours: WeekdayHoursData | null;
  dateCount: number;
}

function HoursGroupCard({ label, hours, dateCount }: HoursGroupCardProps) {
  if (!hours) {
    return null;
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/20">
          <Clock className="h-5 w-5 text-blue-700 dark:text-blue-400" />
        </div>
        <div>
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted">
            {hours.startTime} - {hours.endTime}
          </p>
        </div>
      </div>

      <span className="rounded-full bg-surface-hover px-2 py-0.5 text-xs text-muted">
        {dateCount}
      </span>
    </div>
  );
}
