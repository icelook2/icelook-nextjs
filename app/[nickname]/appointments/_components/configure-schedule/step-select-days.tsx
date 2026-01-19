"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isBefore,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { enUS, uk } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { useConfigureSchedule } from "./configure-schedule-context";

const localeMap = { en: enUS, uk } as const;

/**
 * Convert JS getDay() result (0=Sun, 1=Mon) to our weekday system (0=Mon, 6=Sun)
 */
function jsWeekdayToOurs(jsWeekday: number): number {
  return jsWeekday === 0 ? 6 : jsWeekday - 1;
}

/**
 * Split days array into weeks (chunks of 7)
 */
function getWeeksFromDays(days: Date[]): Date[][] {
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

/**
 * Get selectable dates for a week row
 */
function getSelectableDatesForWeek(
  weekDays: Date[],
  viewDate: Date,
  today: Date,
  existingWorkingDates: Set<string>,
): Date[] {
  return weekDays.filter((day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const isPast = isBefore(day, today);
    const isCurrentMonth = isSameMonth(day, viewDate);
    const isExistingWorkingDay = existingWorkingDates.has(dateStr);
    return isCurrentMonth && !isPast && !isExistingWorkingDay;
  });
}

/**
 * Check if all selectable dates in week are selected
 */
function isWeekFullySelected(
  selectableDates: Date[],
  selectedDates: Set<string>,
): boolean {
  if (selectableDates.length === 0) {
    return false;
  }
  return selectableDates.every((date) =>
    selectedDates.has(format(date, "yyyy-MM-dd")),
  );
}

/**
 * Get selection ratio for week row
 */
function getWeekSelectionRatio(
  selectableDates: Date[],
  selectedDates: Set<string>,
): number {
  if (selectableDates.length === 0) {
    return 0;
  }
  const selectedCount = selectableDates.filter((date) =>
    selectedDates.has(format(date, "yyyy-MM-dd")),
  ).length;
  return selectedCount / selectableDates.length;
}

/**
 * Step 1: Multi-select calendar for choosing working days
 *
 * Features:
 * - Click individual days to toggle selection
 * - Click weekday headers (top) to select/deselect entire column
 * - Click week numbers (left) to select/deselect entire week row
 * - Existing working days are shown but not selectable
 * - Past days are disabled
 */
export function StepSelectDays() {
  const tSchedule = useTranslations("creator_schedule");
  const locale = useLocale();
  const dateFnsLocale = localeMap[locale as keyof typeof localeMap] ?? enUS;

  const {
    selectedDates,
    existingWorkingDates,
    toggleDate,
    toggleWeekdayColumn,
    toggleWeekRow,
  } = useConfigureSchedule();

  const [viewDate, setViewDate] = useState(new Date());
  const today = startOfDay(new Date());

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Weekday headers with our weekday system (0=Mon, 6=Sun)
  const weekDays = [
    { key: "mo", label: tSchedule("weekdays.mo"), weekday: 0 },
    { key: "tu", label: tSchedule("weekdays.tu"), weekday: 1 },
    { key: "we", label: tSchedule("weekdays.we"), weekday: 2 },
    { key: "th", label: tSchedule("weekdays.th"), weekday: 3 },
    { key: "fr", label: tSchedule("weekdays.fr"), weekday: 4 },
    { key: "sa", label: tSchedule("weekdays.sa"), weekday: 5 },
    { key: "su", label: tSchedule("weekdays.su"), weekday: 6 },
  ];

  // Get selectable dates for a weekday column in current view
  const getSelectableDatesForWeekday = (weekday: number): Date[] => {
    return days.filter((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const jsWeekday = getDay(day);
      const ourWeekday = jsWeekdayToOurs(jsWeekday);
      const isPast = isBefore(day, today);
      const isCurrentMonth = isSameMonth(day, viewDate);
      const isExistingWorkingDay = existingWorkingDates.has(dateStr);

      return (
        isCurrentMonth &&
        !isPast &&
        !isExistingWorkingDay &&
        ourWeekday === weekday
      );
    });
  };

  // Check if all selectable dates in a weekday column are selected
  const isWeekdayColumnFullySelected = (weekday: number): boolean => {
    const selectableDates = getSelectableDatesForWeekday(weekday);
    if (selectableDates.length === 0) {
      return false;
    }
    return selectableDates.every((date) =>
      selectedDates.has(format(date, "yyyy-MM-dd")),
    );
  };

  // Calculate selection ratio for each weekday column
  const getColumnSelectionRatio = (weekday: number): number => {
    const selectableDates = getSelectableDatesForWeekday(weekday);
    if (selectableDates.length === 0) {
      return 0;
    }
    const selectedCount = selectableDates.filter((date) =>
      selectedDates.has(format(date, "yyyy-MM-dd")),
    ).length;
    return selectedCount / selectableDates.length;
  };

  return (
    <div className="flex flex-col">
      {/* Header with month navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewDate(subMonths(viewDate, 1))}
          style={{ width: 44, height: 44, minWidth: 44, minHeight: 44 }}
          className="flex shrink-0 items-center justify-center rounded-full border border-border transition-colors hover:bg-surface-hover active:bg-surface-secondary"
        >
          <ChevronLeft style={{ width: 20, height: 20 }} />
        </button>

        <span className="font-medium">
          {format(viewDate, "LLLL yyyy", { locale: dateFnsLocale })}
        </span>

        <button
          type="button"
          onClick={() => setViewDate(addMonths(viewDate, 1))}
          style={{ width: 44, height: 44, minWidth: 44, minHeight: 44 }}
          className="flex shrink-0 items-center justify-center rounded-full border border-border transition-colors hover:bg-surface-hover active:bg-surface-secondary"
        >
          <ChevronRight style={{ width: 20, height: 20 }} />
        </button>
      </div>

      {/* Weekday headers - clickable to select column */}
      <div
        className="mb-2 grid gap-1 md:gap-2"
        style={{ gridTemplateColumns: "2.5rem repeat(7, 1fr)" }}
      >
        {/* Empty cell for week column alignment */}
        <div />
        {weekDays.map(({ key, label, weekday }) => {
          const selectableDates = getSelectableDatesForWeekday(weekday);
          const hasSelectableDates = selectableDates.length > 0;
          const isFullySelected = isWeekdayColumnFullySelected(weekday);
          const ratio = getColumnSelectionRatio(weekday);
          const hasPartialSelection = ratio > 0 && ratio < 1;

          return (
            <button
              key={key}
              type="button"
              onClick={() =>
                hasSelectableDates &&
                toggleWeekdayColumn(weekday, selectableDates)
              }
              disabled={!hasSelectableDates}
              className={cn(
                "flex items-center justify-center py-2 text-xs transition-all",
                hasSelectableDates ? "cursor-pointer" : "cursor-default",
                isFullySelected
                  ? "font-medium text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  : hasPartialSelection
                    ? "text-emerald-400/60"
                    : hasSelectableDates
                      ? "text-muted/50 hover:text-muted"
                      : "text-muted/30",
              )}
            >
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Calendar weeks */}
      <div className="flex flex-col gap-1 md:gap-2">
        {getWeeksFromDays(days).map((weekDays, weekIndex) => {
          const selectableDatesInWeek = getSelectableDatesForWeek(
            weekDays,
            viewDate,
            today,
            existingWorkingDates,
          );
          const hasSelectableDates = selectableDatesInWeek.length > 0;
          const weekIsFullySelected = isWeekFullySelected(
            selectableDatesInWeek,
            selectedDates,
          );
          const ratio = getWeekSelectionRatio(
            selectableDatesInWeek,
            selectedDates,
          );
          const hasPartialSelection = ratio > 0 && ratio < 1;
          // Use the first day of the week as key (stable and unique)
          const weekKey = format(weekDays[0], "yyyy-MM-dd");

          return (
            <div
              key={weekKey}
              className="grid gap-1 md:gap-2"
              style={{ gridTemplateColumns: "2.5rem repeat(7, 1fr)" }}
            >
              {/* Week row selector */}
              <button
                type="button"
                onClick={() =>
                  hasSelectableDates && toggleWeekRow(selectableDatesInWeek)
                }
                disabled={!hasSelectableDates}
                className={cn(
                  "flex items-center justify-center py-2 text-xs transition-all",
                  hasSelectableDates ? "cursor-pointer" : "cursor-default",
                  weekIsFullySelected
                    ? "font-medium text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    : hasPartialSelection
                      ? "text-emerald-400/60"
                      : hasSelectableDates
                        ? "text-muted/50 hover:text-muted"
                        : "text-muted/30",
                )}
                aria-label={tSchedule("week_selector.label", {
                  number: weekIndex + 1,
                })}
              >
                <span>
                  {tSchedule("week_selector.short", { number: weekIndex + 1 })}
                </span>
              </button>

              {/* Day cells for this week */}
              {weekDays.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const isCurrentMonth = isSameMonth(day, viewDate);
                const isPast = isBefore(day, today);
                const isTodayDate = isToday(day);
                const isExistingWorkingDay = existingWorkingDates.has(dateStr);
                const isSelected = selectedDates.has(dateStr);
                const isDisabled = isPast || isExistingWorkingDay;

                // Empty slot for days from other months
                if (!isCurrentMonth) {
                  return <div key={day.toISOString()} />;
                }

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => !isDisabled && toggleDate(dateStr, day)}
                    disabled={isDisabled}
                    style={{
                      backgroundColor: isSelected
                        ? "rgba(16, 185, 129, 0.15)"
                        : "rgba(255, 255, 255, 0.06)",
                    }}
                    className={cn(
                      "relative flex flex-col items-center justify-center rounded-lg px-1.5 py-2 text-sm transition-colors",
                      "hover:bg-white/10",
                      isDisabled && "cursor-not-allowed opacity-50",
                      isTodayDate && "font-semibold text-accent",
                    )}
                  >
                    <span>{format(day, "d")}</span>
                    {/* Capsule indicator */}
                    <span
                      className="mt-0.5 h-1 w-4 rounded-full transition-colors"
                      style={{
                        backgroundColor:
                          isExistingWorkingDay || isSelected
                            ? "rgb(16, 185, 129)"
                            : "transparent",
                      }}
                    />
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
