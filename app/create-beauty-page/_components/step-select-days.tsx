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
import { Button } from "@/lib/ui/button";
import { cn } from "@/lib/utils/cn";
import { jsWeekdayToOurs, type StepProps } from "../_lib/types";
import { WorkingDaysPreview } from "./previews";
import { SplitLayout } from "./split-layout";

const localeMap = { en: enUS, uk } as const;

/**
 * Step 3: Select Working Days
 *
 * Calendar interface for selecting which dates the specialist will work.
 * Adapted from the appointments configure-schedule flow.
 */
export function StepSelectDays({
  state,
  onUpdate,
  onNext,
  onBack,
  onSkip,
}: StepProps) {
  const t = useTranslations("create_beauty_page.select_days");
  const locale = useLocale();
  const dateFnsLocale = localeMap[locale as keyof typeof localeMap] ?? enUS;

  const [viewDate, setViewDate] = useState(new Date());
  const today = startOfDay(new Date());

  const selectedDates = state.selectedDates;

  // Calendar calculations
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Weekday headers (0=Mon, 6=Sun)
  const weekDays = [
    { key: "mo", label: t("weekdays.mo"), weekday: 0 },
    { key: "tu", label: t("weekdays.tu"), weekday: 1 },
    { key: "we", label: t("weekdays.we"), weekday: 2 },
    { key: "th", label: t("weekdays.th"), weekday: 3 },
    { key: "fr", label: t("weekdays.fr"), weekday: 4 },
    { key: "sa", label: t("weekdays.sa"), weekday: 5 },
    { key: "su", label: t("weekdays.su"), weekday: 6 },
  ];

  // Toggle a single date
  const toggleDate = (dateStr: string) => {
    const next = new Set(selectedDates);
    if (next.has(dateStr)) {
      next.delete(dateStr);
    } else {
      next.add(dateStr);
    }
    onUpdate({ selectedDates: next });
  };

  // Toggle all dates for a weekday column
  const toggleWeekdayColumn = (_weekday: number, selectableDates: Date[]) => {
    const next = new Set(selectedDates);
    const dateStrs = selectableDates.map((d) => format(d, "yyyy-MM-dd"));

    if (dateStrs.length === 0) {
      return;
    }

    const allSelected = dateStrs.every((str) => next.has(str));
    if (allSelected) {
      for (const str of dateStrs) {
        next.delete(str);
      }
    } else {
      for (const str of dateStrs) {
        next.add(str);
      }
    }
    onUpdate({ selectedDates: next });
  };

  // Toggle all dates in a week row
  const toggleWeekRow = (selectableDates: Date[]) => {
    const next = new Set(selectedDates);
    const dateStrs = selectableDates.map((d) => format(d, "yyyy-MM-dd"));

    if (dateStrs.length === 0) {
      return;
    }

    const allSelected = dateStrs.every((str) => next.has(str));
    if (allSelected) {
      for (const str of dateStrs) {
        next.delete(str);
      }
    } else {
      for (const str of dateStrs) {
        next.add(str);
      }
    }
    onUpdate({ selectedDates: next });
  };

  // Get selectable dates for a weekday column
  const getSelectableDatesForWeekday = (weekday: number): Date[] => {
    return days.filter((day) => {
      const jsWeekday = getDay(day);
      const ourWeekday = jsWeekdayToOurs(jsWeekday);
      const isPast = isBefore(day, today);
      const isCurrentMonth = isSameMonth(day, viewDate);
      return isCurrentMonth && !isPast && ourWeekday === weekday;
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

  // Get selection ratio for weekday column
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

  // Get selectable dates for a week row
  const getSelectableDatesForWeek = (weekDays: Date[]): Date[] => {
    return weekDays.filter((day) => {
      const isPast = isBefore(day, today);
      const isCurrentMonth = isSameMonth(day, viewDate);
      return isCurrentMonth && !isPast;
    });
  };

  // Check if week is fully selected
  const isWeekFullySelected = (selectableDates: Date[]): boolean => {
    if (selectableDates.length === 0) {
      return false;
    }
    return selectableDates.every((date) =>
      selectedDates.has(format(date, "yyyy-MM-dd")),
    );
  };

  // Get week selection ratio
  const getWeekSelectionRatio = (selectableDates: Date[]): number => {
    if (selectableDates.length === 0) {
      return 0;
    }
    const selectedCount = selectableDates.filter((date) =>
      selectedDates.has(format(date, "yyyy-MM-dd")),
    ).length;
    return selectedCount / selectableDates.length;
  };

  // Split days into weeks
  const getWeeksFromDays = (days: Date[]): Date[][] => {
    const weeks: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  };

  const canProceed = selectedDates.size > 0;

  return (
    <>
      <SplitLayout
        title={t("title")}
        subtitle={t("subtitle")}
        form={
          <div className="flex flex-col">
            {/* Header with month navigation */}
            <div className="mb-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewDate(subMonths(viewDate, 1))}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border transition-colors hover:bg-surface-hover active:bg-surface-secondary"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <span className="font-medium">
                {format(viewDate, "LLLL yyyy", { locale: dateFnsLocale })}
              </span>

              <button
                type="button"
                onClick={() => setViewDate(addMonths(viewDate, 1))}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border transition-colors hover:bg-surface-hover active:bg-surface-secondary"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Weekday headers */}
            <div
              className="mb-2 grid gap-1 md:gap-2"
              style={{ gridTemplateColumns: "2.5rem repeat(7, 1fr)" }}
            >
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
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Calendar weeks */}
            <div className="flex flex-col gap-1 md:gap-2">
              {getWeeksFromDays(days).map((weekDaysArray, weekIndex) => {
                const selectableDatesInWeek =
                  getSelectableDatesForWeek(weekDaysArray);
                const hasSelectableDates = selectableDatesInWeek.length > 0;
                const weekIsFullySelected = isWeekFullySelected(
                  selectableDatesInWeek,
                );
                const ratio = getWeekSelectionRatio(selectableDatesInWeek);
                const hasPartialSelection = ratio > 0 && ratio < 1;
                const weekKey = format(weekDaysArray[0], "yyyy-MM-dd");

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
                        hasSelectableDates &&
                        toggleWeekRow(selectableDatesInWeek)
                      }
                      disabled={!hasSelectableDates}
                      className={cn(
                        "flex items-center justify-center py-2 text-xs transition-all",
                        hasSelectableDates
                          ? "cursor-pointer"
                          : "cursor-default",
                        weekIsFullySelected
                          ? "font-medium text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                          : hasPartialSelection
                            ? "text-emerald-400/60"
                            : hasSelectableDates
                              ? "text-muted/50 hover:text-muted"
                              : "text-muted/30",
                      )}
                    >
                      {t("week_short", { number: weekIndex + 1 })}
                    </button>

                    {/* Day cells */}
                    {weekDaysArray.map((day) => {
                      const dateStr = format(day, "yyyy-MM-dd");
                      const isCurrentMonth = isSameMonth(day, viewDate);
                      const isPast = isBefore(day, today);
                      const isTodayDate = isToday(day);
                      const isSelected = selectedDates.has(dateStr);
                      const isDisabled = isPast;

                      if (!isCurrentMonth) {
                        return <div key={day.toISOString()} />;
                      }

                      return (
                        <button
                          key={day.toISOString()}
                          type="button"
                          onClick={() => !isDisabled && toggleDate(dateStr)}
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
                          <span
                            className="mt-0.5 h-1 w-4 rounded-full transition-colors"
                            style={{
                              backgroundColor: isSelected
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
        }
        preview={<WorkingDaysPreview selectedDates={selectedDates} />}
      />

      {/* Fixed bottom actions */}
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-surface px-4 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            {t("back")}
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onSkip}>
              {t("skip")}
            </Button>
            <Button onClick={onNext} disabled={!canProceed}>
              {t("next")}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
