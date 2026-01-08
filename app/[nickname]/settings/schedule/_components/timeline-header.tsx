"use client";

import { cn } from "@/lib/utils/cn";
import {
  checkIsToday,
  formatDayHeader,
  toDateString,
} from "../_lib/date-utils";
import { findWorkingDayForDate } from "../_lib/schedule-utils";
import type { WorkingDayWithBreaks } from "../_lib/types";

interface TimelineHeaderProps {
  dates: Date[];
  workingDays?: WorkingDayWithBreaks[];
  canManage?: boolean;
  onAddWorkingDay?: (date: string) => void;
  onEditWorkingDay?: (workingDay: WorkingDayWithBreaks) => void;
  className?: string;
}

/**
 * Minimal header row showing day names and numbers
 * Part of the unified grid - no separate backgrounds
 */
export function TimelineHeader({
  dates,
  workingDays = [],
  canManage = false,
  onAddWorkingDay,
  onEditWorkingDay,
  className,
}: TimelineHeaderProps) {
  return (
    <div className={cn("sticky top-0 flex bg-background", className)}>
      {/* Spacer for time column */}
      <div className="w-16 shrink-0" />

      {/* Day headers - unified row, no gaps */}
      <div className="flex flex-1 border-b border-border">
        {dates.map((date, index) => {
          const { dayName, dayNumber } = formatDayHeader(date);
          const isToday = checkIsToday(date);
          const dateStr = toDateString(date);
          const workingDay = findWorkingDayForDate(workingDays, dateStr);
          const isLast = index === dates.length - 1;

          const handleClick = () => {
            if (!canManage) {
              return;
            }
            if (workingDay) {
              onEditWorkingDay?.(workingDay);
            } else {
              onAddWorkingDay?.(dateStr);
            }
          };

          return (
            // biome-ignore lint/a11y/noStaticElementInteractions: role is conditionally set based on canManage
            <div
              key={date.toISOString()}
              className={cn(
                "flex-1 py-3 text-center",
                !isLast && "border-r border-border",
                canManage && "cursor-pointer hover:bg-surface-alt/50 transition-colors",
              )}
              onClick={handleClick}
              onKeyDown={
                canManage
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleClick();
                      }
                    }
                  : undefined
              }
              role={canManage ? "button" : undefined}
              tabIndex={canManage ? 0 : undefined}
            >
              {/* Day name */}
              <p className="text-xs font-medium uppercase text-muted">
                {dayName}
              </p>

              {/* Day number */}
              <p
                className={cn(
                  "mt-1 text-xl font-semibold tabular-nums",
                  isToday
                    ? "inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white shadow-sm"
                    : "text-foreground",
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
