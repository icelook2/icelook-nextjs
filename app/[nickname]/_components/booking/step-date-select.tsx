"use client";

/**
 * Date Selection Step (Solo Creator Model)
 *
 * Displays a calendar for selecting a booking date.
 * Uses beautyPageId to fetch working days (not specialist).
 */

import { ChevronLeft, ChevronRight } from "lucide-react";
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
    nextButton: string;
  };
}

export function StepDateSelect({ translations }: StepDateSelectProps) {
  const { beautyPageId, date, selectDate } = useBooking();
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [workingDays, setWorkingDays] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(date);

  // Fetch working days when month changes
  useEffect(() => {
    const fetchWorkingDays = async () => {
      setIsLoading(true);

      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      const startDate = formatDateToYYYYMMDD(firstDay);
      const endDate = formatDateToYYYYMMDD(lastDay);

      const result = await getWorkingDaysForRange(
        beautyPageId,
        startDate,
        endDate,
      );

      if (result.success) {
        const newWorkingDays = new Set(result.data);
        setWorkingDays(newWorkingDays);
      }

      setIsLoading(false);
    };

    fetchWorkingDays();
  }, [beautyPageId, currentMonth]);

  // Navigation handlers
  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    );
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
    if (startDayOfWeek === -1) {
      startDayOfWeek = 6;
    }

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Add empty slots for days before first of month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ type: "empty" });
    }

    // Add days of month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dateObj = new Date(year, month, day);
      const dateStr = formatDateToYYYYMMDD(dateObj);
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

      days.push({
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

    return days;
  }, [currentMonth, workingDays, selectedDate]);

  // Handle date click (just select, don't advance)
  const handleDateClick = useCallback((dateObj: Date) => {
    setSelectedDate(dateObj);
  }, []);

  // Handle next button click
  const handleNext = useCallback(() => {
    if (selectedDate) {
      selectDate(selectedDate);
    }
  }, [selectedDate, selectDate]);

  return (
    <div className="flex flex-col">
      {/* Content */}
      <div className="px-4 pb-4">
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

        {/* Calendar grid - fixed height to prevent jumping */}
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
                    onClick={() => handleDateClick(item.date)}
                    className={cn(
                      "flex items-center justify-center rounded-2xl px-2 py-3 text-sm",
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

      {/* Footer with actions */}
      <div className="flex justify-end border-t border-border px-4 py-3">
        <Button onClick={handleNext} disabled={!selectedDate}>
          {translations.nextButton}
        </Button>
      </div>
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
      isSelected: boolean;
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
