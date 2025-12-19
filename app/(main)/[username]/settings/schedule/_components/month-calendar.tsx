"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isToday,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { WorkingDayWithBreaks } from "@/lib/schedule/types";
import { Button } from "@/lib/ui/button";
import { cn } from "@/lib/utils/cn";

interface MonthCalendarProps {
  year: number;
  month: number;
  workingDaysMap: Map<string, WorkingDayWithBreaks>;
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  onMonthChange: (year: number, month: number) => void;
  isLoading?: boolean;
}

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function MonthCalendar({
  year,
  month,
  workingDaysMap,
  selectedDate,
  onDateSelect,
  onMonthChange,
  isLoading = false,
}: MonthCalendarProps) {
  const t = useTranslations("schedule");

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(new Date(year, month));
    const monthEnd = endOfMonth(monthStart);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Add padding days at the start (previous month)
    const startDayOfWeek = getDay(monthStart);
    const paddingDays: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      const paddingDate = new Date(year, month, -startDayOfWeek + i + 1);
      paddingDays.push({ date: paddingDate, isCurrentMonth: false });
    }

    // Current month days
    const currentMonthDays = days.map((date) => ({
      date,
      isCurrentMonth: true,
    }));

    // Add padding days at the end (next month)
    const totalCells = paddingDays.length + currentMonthDays.length;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);

    for (let i = 1; i <= remainingCells; i++) {
      const paddingDate = new Date(year, month + 1, i);
      paddingDays.push({ date: paddingDate, isCurrentMonth: false });
    }

    return [
      ...paddingDays.slice(0, startDayOfWeek),
      ...currentMonthDays,
      ...paddingDays.slice(startDayOfWeek),
    ];
  }, [year, month]);

  // Navigation handlers
  const handlePrevMonth = () => {
    const prevMonth = subMonths(new Date(year, month), 1);
    onMonthChange(prevMonth.getFullYear(), prevMonth.getMonth());
  };

  const handleNextMonth = () => {
    const nextMonth = addMonths(new Date(year, month), 1);
    onMonthChange(nextMonth.getFullYear(), nextMonth.getMonth());
  };

  const handleToday = () => {
    const today = new Date();
    onMonthChange(today.getFullYear(), today.getMonth());
    onDateSelect(format(today, "yyyy-MM-dd"));
  };

  // Format month title
  const monthTitle = format(new Date(year, month), "MMMM yyyy");

  return (
    <div className="bg-white dark:bg-gray-900 border border-foreground/10 rounded-2xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevMonth}
            aria-label={t("previous_month")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <h2 className="text-lg font-semibold text-foreground min-w-[160px] text-center">
            {monthTitle}
          </h2>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextMonth}
            aria-label={t("next_month")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-foreground/40" />
          )}
        </div>

        <Button variant="secondary" size="sm" onClick={handleToday}>
          {t("today")}
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-xs font-medium text-foreground/50 py-2"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map(({ date, isCurrentMonth }) => {
          const dateStr = format(date, "yyyy-MM-dd");
          const isWorkingDay = workingDaysMap.has(dateStr);
          const isSelected = selectedDate === dateStr;
          const isTodayDate = isToday(date);

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onDateSelect(dateStr)}
              className={cn(
                "relative aspect-square flex items-center justify-center rounded-lg text-sm transition-colors",
                "hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2",
                !isCurrentMonth && "text-foreground/30",
                isCurrentMonth && "text-foreground",
                isWorkingDay && "font-medium",
                isSelected && "bg-violet-500 text-white hover:bg-violet-600",
                isTodayDate &&
                  !isSelected &&
                  "ring-2 ring-violet-500 ring-inset",
              )}
            >
              {format(date, "d")}

              {/* Working day indicator */}
              {isWorkingDay && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-foreground/10">
        <div className="flex items-center gap-2 text-xs text-foreground/60">
          <span className="w-2 h-2 rounded-full bg-violet-500" />
          {t("working_day")}
        </div>
        <div className="flex items-center gap-2 text-xs text-foreground/60">
          <span className="w-4 h-4 rounded border-2 border-violet-500" />
          {t("today")}
        </div>
      </div>
    </div>
  );
}
