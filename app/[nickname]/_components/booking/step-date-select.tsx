"use client";

/**
 * Date Selection Step
 *
 * Displays a calendar for selecting a booking date.
 * Only days when the specialist works are selectable.
 */

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/lib/ui/button";
import { cn } from "@/lib/utils/cn";
import { getWorkingDaysForRange } from "./_actions/availability.actions";
import { useBooking } from "./booking-context";

interface StepDateSelectProps {
  translations: {
    title: string;
    subtitle: string;
    monthNames: string[];
    weekdayNames: string[];
    today: string;
    loading: string;
    noAvailability: string;
  };
}

export function StepDateSelect({ translations }: StepDateSelectProps) {
  const { specialist, selectDate, timezone } = useBooking();
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [workingDays, setWorkingDays] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch working days when month changes
  useEffect(() => {
    if (!specialist) return;

    const fetchWorkingDays = async () => {
      setIsLoading(true);
      setError(null);

      // Calculate start and end of current month view
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      const startDate = formatDateToYYYYMMDD(firstDay);
      const endDate = formatDateToYYYYMMDD(lastDay);

      const result = await getWorkingDaysForRange(
        specialist.specialistId,
        startDate,
        endDate,
      );

      if (result.success) {
        setWorkingDays(new Set(result.data));
      } else {
        setError(result.error);
      }

      setIsLoading(false);
    };

    fetchWorkingDays();
  }, [specialist, currentMonth]);

  // Navigation handlers
  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  // Check if previous month is allowed (not before today's month)
  const canGoPrevious = useMemo(() => {
    const now = new Date();
    return (
      currentMonth.getFullYear() > now.getFullYear() ||
      (currentMonth.getFullYear() === now.getFullYear() &&
        currentMonth.getMonth() > now.getMonth())
    );
  }, [currentMonth]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Get day of week for first day (0 = Sunday, adjust for Monday start)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Add empty slots for days before first of month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ type: "empty" });
    }

    // Add days of month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateStr = formatDateToYYYYMMDD(date);
      const isPast = date < today;
      const isWorking = workingDays.has(dateStr);
      const isToday =
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate();

      days.push({
        type: "day",
        date,
        dateStr,
        day,
        isPast,
        isWorking,
        isToday,
        isSelectable: !isPast && isWorking,
      });
    }

    return days;
  }, [currentMonth, workingDays]);

  // Handle date selection
  const handleSelectDate = useCallback(
    (date: Date) => {
      selectDate(date);
    },
    [selectDate],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {translations.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {translations.subtitle}
        </p>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPreviousMonth}
          disabled={!canGoPrevious}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="font-medium text-gray-900 dark:text-gray-100">
          {translations.monthNames[currentMonth.getMonth()]}{" "}
          {currentMonth.getFullYear()}
        </span>

        <Button variant="ghost" size="sm" onClick={goToNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
            {translations.loading}
          </span>
        </div>
      )}

      {/* Calendar grid */}
      {!isLoading && (
        <div className="rounded-lg border border-gray-200 p-2 dark:border-gray-700">
          {/* Weekday headers */}
          <div className="mb-2 grid grid-cols-7 gap-1">
            {translations.weekdayNames.map((day) => (
              <div
                key={day}
                className="py-1 text-center text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((item, index) => {
              if (item.type === "empty") {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              return (
                <button
                  key={item.dateStr}
                  type="button"
                  disabled={!item.isSelectable}
                  onClick={() => handleSelectDate(item.date)}
                  className={cn(
                    "aspect-square rounded-md text-sm transition-colors",
                    // Base states
                    item.isSelectable &&
                      "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700",
                    !item.isSelectable &&
                      "cursor-not-allowed text-gray-300 dark:text-gray-600",
                    // Working day indicator
                    item.isWorking &&
                      !item.isPast &&
                      "bg-green-50 font-medium text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30",
                    // Today indicator
                    item.isToday &&
                      "ring-2 ring-inset ring-gray-400 dark:ring-gray-500",
                    // Past days
                    item.isPast && "text-gray-300 dark:text-gray-600",
                  )}
                >
                  {item.day}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded bg-green-50 dark:bg-green-900/20" />
              <span>Available</span>
            </div>
          </div>
        </div>
      )}

      {/* No availability message */}
      {!isLoading && workingDays.size === 0 && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          {translations.noAvailability}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// Types
// ============================================================================

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
      isSelectable: boolean;
    };

// ============================================================================
// Helpers
// ============================================================================

function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
