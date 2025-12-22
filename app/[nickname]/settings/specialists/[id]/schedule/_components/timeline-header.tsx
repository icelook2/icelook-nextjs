"use client";

import { cn } from "@/lib/utils/cn";
import { checkIsToday, formatDayHeader } from "../_lib/date-utils";

interface TimelineHeaderProps {
  dates: Date[];
  className?: string;
}

/**
 * Header row showing day names and numbers
 */
export function TimelineHeader({ dates, className }: TimelineHeaderProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-20 flex border-b border-border bg-background",
        className,
      )}
    >
      {/* Spacer for time column */}
      <div className="w-16 shrink-0" />

      {/* Day headers */}
      <div className="flex flex-1">
        {dates.map((date) => {
          const { dayName, dayNumber } = formatDayHeader(date);
          const isToday = checkIsToday(date);

          return (
            <div
              key={date.toISOString()}
              className={cn(
                "flex-1 border-l border-border py-3 text-center first:border-l-0",
                isToday && "bg-accent/5",
              )}
            >
              <p className="text-xs font-medium uppercase text-muted">
                {dayName}
              </p>
              <p
                className={cn(
                  "mt-0.5 text-lg font-semibold",
                  isToday &&
                    "inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white",
                )}
              >
                {dayNumber}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
