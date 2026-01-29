"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
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

const localeMap = { en: enUS, uk } as const;

interface SimpleDatePickerProps {
  /** Selected date - pass null if no date is selected yet */
  selectedDate: Date | null;
  highlightedDates?: Date[];
  onSelect: (date: Date) => void;
  hideHeader?: boolean;
  showMonthLabel?: boolean;
  fullWidth?: boolean;
  viewDate?: Date;
  /** Minimum selectable date - dates before this will be disabled */
  minDate?: Date;
  /** Dates that are working days (YYYY-MM-DD format) */
  workingDates?: Set<string>;
  /** Dates with confirmed appointments (YYYY-MM-DD format) */
  appointmentDates?: Set<string>;
  /** Dates with pending appointments (YYYY-MM-DD format) */
  pendingDates?: Set<string>;
}

/**
 * Simple calendar date picker component
 * Supports highlighting multiple dates (e.g., the currently displayed date range)
 */
export function SimpleDatePicker({
  selectedDate,
  highlightedDates = [],
  onSelect,
  hideHeader = false,
  showMonthLabel = false,
  fullWidth = false,
  viewDate: controlledViewDate,
  minDate,
  workingDates,
  pendingDates,
}: SimpleDatePickerProps) {
  const t = useTranslations("creator_schedule");
  const locale = useLocale();
  const dateFnsLocale = localeMap[locale as keyof typeof localeMap] ?? enUS;

  const [internalViewDate, setInternalViewDate] = useState(selectedDate ?? new Date());
  const viewDate = controlledViewDate ?? internalViewDate;
  const setViewDate = setInternalViewDate;

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDayKeys = ["mo", "tu", "we", "th", "fr", "sa", "su"] as const;

  // Check if a day is in the highlighted range
  function isHighlighted(day: Date): boolean {
    return highlightedDates.some((d) => isSameDay(d, day));
  }

  return (
    <div className={fullWidth ? "w-full" : "w-64"}>
      {/* Header with month navigation */}
      {!hideHeader && (
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setViewDate(subMonths(viewDate, 1))}
            className="rounded-lg p-1.5 transition-colors hover:bg-accent/10"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <span className="font-medium">
            {format(viewDate, "LLLL yyyy", { locale: dateFnsLocale })}
          </span>

          <button
            type="button"
            onClick={() => setViewDate(addMonths(viewDate, 1))}
            className="rounded-lg p-1.5 transition-colors hover:bg-accent/10"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Month label */}
      {hideHeader && showMonthLabel && (
        <div className="mb-4">
          <span className="font-medium">
            {viewDate.getFullYear() === new Date().getFullYear()
              ? format(viewDate, "LLLL", { locale: dateFnsLocale })
              : format(viewDate, "LLLL yyyy", { locale: dateFnsLocale })}
          </span>
        </div>
      )}

      {/* Week day headers */}
      <div className="mb-2 grid grid-cols-7 gap-1 md:gap-2">
        {weekDayKeys.map((key) => (
          <div
            key={key}
            className="py-1 text-center text-xs font-medium text-muted"
          >
            {t(`weekdays.${key}`)}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const isCurrentMonth = isSameMonth(day, viewDate);
          const isTodayDate = isToday(day);
          const isInRange = isHighlighted(day);
          const isWorkingDay = workingDates?.has(dateStr) ?? false;
          const hasPending = pendingDates?.has(dateStr) ?? false;
          const isDisabled = minDate ? isBefore(startOfDay(day), startOfDay(minDate)) : false;

          // Empty slot for days from other months
          if (!isCurrentMonth) {
            return <div key={day.toISOString()} />;
          }

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => {
                if (!isDisabled) {
                  onSelect(day);
                }
              }}
              disabled={isDisabled}
              aria-disabled={isDisabled}
              style={
                isDisabled
                  ? { backgroundColor: "transparent", opacity: 0.3, cursor: "not-allowed" }
                  : !isSelected && !isInRange
                    ? { backgroundColor: "rgba(255, 255, 255, 0.06)" }
                    : undefined
              }
              className={cn(
                "relative flex flex-col items-center justify-center rounded-lg px-1.5 py-2 text-sm transition-colors",
                !isDisabled && "hover:bg-white/10",
                // Disabled styling
                isDisabled && "pointer-events-none text-muted",
                // Today styling
                isTodayDate && !isSelected && !isDisabled && "font-semibold text-accent",
                // Selected day
                isSelected && "bg-accent text-white hover:bg-accent/90",
                // Highlighted range
                isInRange &&
                  !isSelected &&
                  "bg-accent-soft ring-1 ring-accent/30",
              )}
            >
              {/* Pending indicator - orange dot with border matching day background */}
              {hasPending && (
                <span
                  className="absolute -right-1 -top-1 size-3 rounded-full"
                  style={{
                    backgroundColor: "rgb(245, 158, 11)",
                    border: isSelected
                      ? "2px solid rgb(96, 127, 254)"
                      : "2px solid rgb(45, 45, 50)",
                  }}
                />
              )}
              <span>{format(day, "d")}</span>
              {/* Working day indicator - green capsule (white when selected) */}
              {isWorkingDay && (
                <span
                  className="mt-0.5 h-1 w-4 rounded-full"
                  style={{
                    backgroundColor: isSelected
                      ? "rgba(255, 255, 255, 0.7)"
                      : "rgb(16, 185, 129)",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
