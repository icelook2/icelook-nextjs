"use client";

import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/lib/ui/button";
import { Paper } from "@/lib/ui/paper";
import { cn } from "@/lib/utils/cn";

interface YearCalendarProps {
  workingDates: Set<string>;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function YearCalendar({ workingDates }: YearCalendarProps) {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  // Generate all 12 months for the selected year
  const months: Date[] = [];
  for (let month = 0; month <= 11; month++) {
    months.push(new Date(selectedYear, month, 1));
  }

  return (
    <div className="space-y-4">
      {/* Year navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Previous year"
          onClick={() => setSelectedYear((y) => y - 1)}
        >
          <ChevronLeft className="size-5" />
        </Button>
        <span className="min-w-20 text-center text-lg font-semibold">
          {selectedYear}
        </span>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Next year"
          onClick={() => setSelectedYear((y) => y + 1)}
        >
          <ChevronRight className="size-5" />
        </Button>
      </div>

      {/* Months grid */}
      <div className="space-y-4">
        {months.map((monthDate) => (
          <MonthCalendar
            key={monthDate.toISOString()}
            monthDate={monthDate}
            workingDates={workingDates}
          />
        ))}
      </div>
    </div>
  );
}

interface MonthCalendarProps {
  monthDate: Date;
  workingDates: Set<string>;
}

function MonthCalendar({ monthDate, workingDates }: MonthCalendarProps) {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <Paper className="p-4">
      {/* Month title */}
      <h3 className="mb-4 text-base font-semibold">
        {format(monthDate, "MMMM")}
      </h3>

      {/* Weekday headers */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-1 text-center text-xs font-medium text-muted"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const isCurrentMonth = isSameMonth(day, monthDate);
          const isWorkingDay = workingDates.has(dateStr) && isCurrentMonth;
          const isTodayDate = isToday(day);

          return (
            <div
              key={dateStr}
              className="flex items-center justify-center py-1"
            >
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-sm",
                  !isCurrentMonth && "text-muted/30",
                  isCurrentMonth && !isWorkingDay && "text-foreground",
                  isWorkingDay && "bg-emerald-500 font-medium text-white",
                  isTodayDate && !isWorkingDay && "ring-2 ring-accent",
                )}
              >
                {format(day, "d")}
              </span>
            </div>
          );
        })}
      </div>
    </Paper>
  );
}
