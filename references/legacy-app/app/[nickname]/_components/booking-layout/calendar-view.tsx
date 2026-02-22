"use client";

/**
 * Calendar View
 *
 * Reusable calendar component for selecting dates.
 * Shows working days with distinctive styling.
 * Extracted from step-date-select.tsx for use in horizontal layout.
 */

import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ============================================================================
// Types
// ============================================================================

interface CalendarViewProps {
  /** Set of dates (YYYY-MM-DD) when the specialist works */
  workingDays: Set<string>;
  /** Currently selected date */
  selectedDate: Date | null;
  /** Callback when a date is selected */
  onSelectDate: (date: Date) => void;
  /** Current month being displayed */
  currentMonth: Date;
  /** Callback to change the displayed month */
  onMonthChange: (month: Date) => void;
  /** Whether calendar data is loading */
  isLoading?: boolean;
  /** Translations for the calendar */
  translations: {
    monthNames: string[];
    weekdayNames: string[];
    today: string;
    noAvailability: string;
  };
}

type CalendarDay =
  | { type: "empty" }
  | {
      type: "day";
      date: Date;
      dateStr: string;
      day: number;
      isPast: boolean;
      isWorking: boolean;
      isToday: boolean;
      isSelected: boolean;
      isSelectable: boolean;
    };

// ============================================================================
// Component
// ============================================================================

export function CalendarView({
  workingDays,
  selectedDate,
  onSelectDate,
  currentMonth,
  onMonthChange,
  isLoading = false,
  translations,
}: CalendarViewProps) {
  // Navigation (React Compiler handles optimization)
  function goToPreviousMonth() {
    onMonthChange(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  }

  function goToNextMonth() {
    onMonthChange(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  }

  // Check if previous month is allowed (not before today's month)
  const now = new Date();
  const canGoPrevious =
    currentMonth.getFullYear() > now.getFullYear() ||
    (currentMonth.getFullYear() === now.getFullYear() &&
      currentMonth.getMonth() > now.getMonth());

  // Generate Calendar Days (React Compiler handles optimization)
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Get day of week for first day (0 = Sunday, adjust for Monday start)
  let startDayOfWeek = firstDay.getDay() - 1;
  if (startDayOfWeek === -1) {
    startDayOfWeek = 6;
  }

  const calendarDays: CalendarDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Add empty slots for days before first of month
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push({ type: "empty" });
  }

  // Add days of month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dateObj = new Date(year, month, day);
    const dateStr = format(dateObj, "yyyy-MM-dd");
    const isPast = dateObj < today;
    const isWorking = workingDays.has(dateStr);
    const isToday =
      dateObj.getFullYear() === today.getFullYear() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getDate() === today.getDate();
    const isSelected =
      selectedDate &&
      dateObj.getFullYear() === selectedDate.getFullYear() &&
      dateObj.getMonth() === selectedDate.getMonth() &&
      dateObj.getDate() === selectedDate.getDate();

    calendarDays.push({
      type: "day",
      date: dateObj,
      dateStr,
      day,
      isPast,
      isWorking,
      isToday,
      isSelected: !!isSelected,
      isSelectable: !isPast && isWorking,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Month navigation */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-base font-semibold text-foreground">
          {translations.monthNames[currentMonth.getMonth()]}{" "}
          {currentMonth.getFullYear()}
        </span>

        <div className="flex items-center">
          <button
            type="button"
            onClick={goToPreviousMonth}
            disabled={!canGoPrevious}
            className={cn(
              "rounded-full p-2.5 transition-colors",
              canGoPrevious
                ? "text-foreground hover:bg-accent-soft/50"
                : "cursor-not-allowed text-muted/40",
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goToNextMonth}
            className="rounded-full p-2.5 text-foreground transition-colors hover:bg-accent-soft/50"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="min-h-[280px]">
        {/* Weekday headers */}
        <div className="mb-2 grid grid-cols-7">
          {translations.weekdayNames.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-medium text-muted"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days grid with loading overlay */}
        <div className="relative">
          <div
            className={cn(
              "grid grid-cols-7 gap-x-1 transition-opacity duration-150",
              isLoading && "opacity-50",
            )}
          >
            {calendarDays.map((item, index) => {
              if (item.type === "empty") {
                return <div key={`empty-${index}`} />;
              }

              return (
                <button
                  key={item.dateStr}
                  type="button"
                  disabled={!item.isSelectable || isLoading}
                  onClick={() => onSelectDate(item.date)}
                  className={cn(
                    "flex items-center justify-center rounded-2xl px-2 py-3 text-sm transition-all",
                    // Selected state - highest priority
                    item.isSelected
                      ? "bg-accent font-semibold text-white"
                      : [
                          // Default: non-working days - subtle text
                          "text-muted/50",
                          // Working days - visible and clickable
                          item.isWorking &&
                            !item.isPast &&
                            "cursor-pointer bg-foreground/10 text-foreground hover:bg-foreground/20",
                          // Past days - very subtle
                          item.isPast && "cursor-not-allowed text-muted/30",
                          // Today indicator
                          item.isToday && "font-semibold text-accent",
                        ],
                  )}
                >
                  {item.day}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* No availability message */}
      {!isLoading && workingDays.size === 0 && (
        <p className="mt-2 text-center text-sm text-muted">
          {translations.noAvailability}
        </p>
      )}
    </div>
  );
}
