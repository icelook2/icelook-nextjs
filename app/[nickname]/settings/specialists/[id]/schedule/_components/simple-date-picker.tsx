"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";

interface SimpleDatePickerProps {
  selectedDate: Date;
  onSelect: (date: Date) => void;
}

/**
 * Simple calendar date picker component
 */
export function SimpleDatePicker({
  selectedDate,
  onSelect,
}: SimpleDatePickerProps) {
  const [viewDate, setViewDate] = useState(selectedDate);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="w-64">
      {/* Header with month navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewDate(subMonths(viewDate, 1))}
          className="rounded-lg p-1.5 transition-colors hover:bg-accent/10"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <span className="font-medium">{format(viewDate, "MMMM yyyy")}</span>

        <button
          type="button"
          onClick={() => setViewDate(addMonths(viewDate, 1))}
          className="rounded-lg p-1.5 transition-colors hover:bg-accent/10"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Week day headers */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-1 text-center text-xs font-medium text-muted"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, viewDate);
          const isTodayDate = isToday(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelect(day)}
              className={cn(
                "rounded-lg p-2 text-sm transition-colors",
                "hover:bg-accent/10",
                !isCurrentMonth && "text-muted/50",
                isTodayDate && !isSelected && "font-semibold text-accent",
                isSelected && "bg-accent text-white hover:bg-accent/90",
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
