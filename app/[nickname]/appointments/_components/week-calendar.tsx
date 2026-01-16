"use client";

import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subDays,
} from "date-fns";
import { enUS, uk } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/lib/ui/button";
import { cn } from "@/lib/utils/cn";

interface WeekCalendarProps {
  selectedDate: Date;
  workingDates?: Set<string>;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  viewDate?: Date;
  onViewDateChange?: (date: Date) => void;
}

const localeMap = { en: enUS, uk } as const;

export function WeekCalendarNav({ selectedDate, expanded = false }: WeekCalendarProps) {
  const t = useTranslations("creator_schedule");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const navigateToDate = (date: Date) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", format(date, "yyyy-MM-dd"));
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePrev = () => {
    if (expanded) {
      return;
    }
    navigateToDate(subDays(selectedDate, 1));
  };

  const handleNext = () => {
    if (expanded) {
      return;
    }
    navigateToDate(addDays(selectedDate, 1));
  };

  return (
    <div className="flex items-center gap-2">
      {!isToday(selectedDate) && (
        <Button variant="secondary" onClick={() => navigateToDate(new Date())}>
          {t("today")}
        </Button>
      )}

      <Button
        variant="secondary"
        size="icon"
        onClick={handlePrev}
        aria-label="Previous day"
      >
        <ChevronLeft className="size-5" />
      </Button>

      <Button
        variant="secondary"
        size="icon"
        onClick={handleNext}
        aria-label="Next day"
      >
        <ChevronRight className="size-5" />
      </Button>
    </div>
  );
}

export function WeekCalendarDateButton({
  selectedDate,
  expanded = false,
  onExpandedChange,
}: WeekCalendarProps) {
  const t = useTranslations("creator_schedule");
  const locale = useLocale();
  const dateFnsLocale = localeMap[locale as keyof typeof localeMap] ?? enUS;

  const handleToggle = () => {
    onExpandedChange?.(!expanded);
  };

  const formatDateLabel = () => {
    const currentYear = new Date().getFullYear();
    const showYear = selectedDate.getFullYear() !== currentYear;
    const dateFormat = showYear ? "d MMMM yyyy" : "d MMMM";
    const formattedDate = format(selectedDate, dateFormat, { locale: dateFnsLocale });

    if (isToday(selectedDate)) {
      return `${t("today")}, ${formattedDate}`;
    }

    return formattedDate;
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={cn(
        "rounded-full bg-surface px-4 py-2 font-medium text-foreground",
        "border border-border shadow-sm",
        "transition-colors hover:bg-accent hover:text-white",
      )}
    >
      {formatDateLabel()}
    </button>
  );
}

export function WeekCalendarExpanded({
  selectedDate,
  workingDates = new Set(),
  expanded = false,
  onExpandedChange,
  viewDate: controlledViewDate,
  onViewDateChange,
}: WeekCalendarProps) {
  const t = useTranslations("creator_schedule");
  const locale = useLocale();
  const dateFnsLocale = localeMap[locale as keyof typeof localeMap] ?? enUS;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [internalViewDate, setInternalViewDate] = useState(selectedDate);

  const viewDate = controlledViewDate ?? internalViewDate;
  const setViewDate = (date: Date) => {
    if (onViewDateChange) {
      onViewDateChange(date);
    } else {
      setInternalViewDate(date);
    }
  };

  const navigateToDate = (date: Date) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", format(date, "yyyy-MM-dd"));
    router.push(`${pathname}?${params.toString()}`);
  };

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const monthDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handleSelectDay = (day: Date) => {
    navigateToDate(day);
    setViewDate(day);
    onExpandedChange?.(false);
  };

  const formatMonthLabel = () => {
    const currentYear = new Date().getFullYear();
    if (viewDate.getFullYear() === currentYear) {
      return format(viewDate, "LLLL", { locale: dateFnsLocale });
    }
    return format(viewDate, "LLLL yyyy", { locale: dateFnsLocale });
  };

  const weekdayLabels = [
    t("weekdays.mo"),
    t("weekdays.tu"),
    t("weekdays.we"),
    t("weekdays.th"),
    t("weekdays.fr"),
    t("weekdays.sa"),
    t("weekdays.su"),
  ];

  if (!expanded) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="mb-4">
        <span className="font-medium capitalize text-foreground">{formatMonthLabel()}</span>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1">
        {weekdayLabels.map((day) => (
          <div key={day} className="py-1 text-center text-xs font-medium text-muted">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {monthDays.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, viewDate);
          const isWorkingDay = workingDates.has(dateStr) && isCurrentMonth;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => handleSelectDay(day)}
              disabled={!isCurrentMonth}
              className="w-full rounded-xl transition-colors"
              style={{
                backgroundColor: !isCurrentMonth
                  ? "transparent"
                  : isSelected
                    ? "var(--color-accent)"
                    : "rgba(255, 255, 255, 0.04)",
              }}
            >
              <div className="flex flex-col items-center gap-1 py-2">
                <span
                  className="text-sm font-medium"
                  style={{
                    color: !isCurrentMonth
                      ? "rgba(128, 128, 128, 0.3)"
                      : isSelected
                        ? "white"
                        : "var(--color-foreground)",
                  }}
                >
                  {format(day, "d")}
                </span>

                {isCurrentMonth && (
                  <span
                    style={{
                      display: "block",
                      width: "16px",
                      height: "4px",
                      borderRadius: "9999px",
                      backgroundColor: isWorkingDay
                        ? isSelected
                          ? "rgba(255, 255, 255, 0.8)"
                          : "#10b981"
                        : "transparent",
                    }}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
