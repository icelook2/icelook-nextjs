"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isAfter,
  isBefore,
  isToday,
  startOfMonth,
  startOfToday,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Button } from "@/lib/ui/button";
import { cn } from "@/lib/utils/cn";

interface BookingCalendarProps {
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  maxDaysAhead?: number;
}

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function BookingCalendar({
  selectedDate,
  onDateSelect,
  maxDaysAhead = 30,
}: BookingCalendarProps) {
  const t = useTranslations("schedule");
  const today = startOfToday();
  const maxDate = new Date(
    today.getTime() + maxDaysAhead * 24 * 60 * 60 * 1000,
  );

  const [viewDate, setViewDate] = useState(() => {
    if (selectedDate) {
      const [year, month] = selectedDate.split("-").map(Number);
      return new Date(year, month - 1);
    }
    return today;
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

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

    const endPaddingDays: Array<{ date: Date; isCurrentMonth: boolean }> = [];
    for (let i = 1; i <= remainingCells; i++) {
      const paddingDate = new Date(year, month + 1, i);
      endPaddingDays.push({ date: paddingDate, isCurrentMonth: false });
    }

    return [...paddingDays, ...currentMonthDays, ...endPaddingDays];
  }, [year, month]);

  // Navigation handlers
  const handlePrevMonth = () => {
    setViewDate(subMonths(viewDate, 1));
  };

  const handleNextMonth = () => {
    setViewDate(addMonths(viewDate, 1));
  };

  // Check if date is selectable
  const isDateSelectable = (date: Date): boolean => {
    // Must be today or later
    if (isBefore(date, today)) {
      return false;
    }
    // Must be within max days ahead
    if (isAfter(date, maxDate)) {
      return false;
    }
    return true;
  };

  // Format month title
  const monthTitle = format(new Date(year, month), "MMMM yyyy");

  // Check if can navigate to previous month
  const canGoPrev = isAfter(startOfMonth(viewDate), today);
  const canGoNext = isBefore(startOfMonth(addMonths(viewDate, 1)), maxDate);

  return (
    <div className="bg-foreground/5 border border-foreground/10 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrevMonth}
          disabled={!canGoPrev}
          aria-label={t("previous_month")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <h2 className="text-sm font-semibold text-foreground">{monthTitle}</h2>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleNextMonth}
          disabled={!canGoNext}
          aria-label={t("next_month")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-xs font-medium text-foreground/50 py-1"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map(({ date, isCurrentMonth }) => {
          const dateStr = format(date, "yyyy-MM-dd");
          const isSelected = selectedDate === dateStr;
          const isTodayDate = isToday(date);
          const selectable = isCurrentMonth && isDateSelectable(date);

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => selectable && onDateSelect(dateStr)}
              disabled={!selectable}
              className={cn(
                "aspect-square flex items-center justify-center rounded-lg text-sm transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2",
                !isCurrentMonth && "text-foreground/20",
                isCurrentMonth &&
                  !selectable &&
                  "text-foreground/30 cursor-not-allowed",
                isCurrentMonth &&
                  selectable &&
                  "text-foreground hover:bg-foreground/10",
                isSelected && "bg-violet-500 text-white hover:bg-violet-600",
                isTodayDate &&
                  !isSelected &&
                  "ring-1 ring-violet-500 ring-inset",
              )}
            >
              {format(date, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
