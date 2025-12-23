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
        "sticky top-0 z-20 flex bg-background pb-2",
        className,
      )}
    >
      {/* Spacer for time column */}
      <div className="w-16 shrink-0" />

      {/* Day headers with gap to match columns */}
      <div className="flex flex-1 gap-2 pr-2">
        {dates.map((date) => {
          const { dayName, dayNumber } = formatDayHeader(date);
          const isToday = checkIsToday(date);

          return (
            <div
              key={date.toISOString()}
              className={cn(
                "flex-1 rounded-lg bg-surface py-3 text-center",
                isToday && "ring-2 ring-accent/30",
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
