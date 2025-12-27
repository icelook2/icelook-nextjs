"use client";

import { MoreVertical, Pencil, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Popover } from "@/lib/ui/popover";
import { cn } from "@/lib/utils/cn";
import {
  checkIsToday,
  formatDayHeader,
  toDateString,
} from "../_lib/date-utils";
import { findWorkingDayForDate } from "../_lib/schedule-utils";
import { normalizeTime } from "../_lib/time-utils";
import type { WorkingDayWithBreaks } from "../_lib/types";

interface TimelineHeaderProps {
  dates: Date[];
  workingDays: WorkingDayWithBreaks[];
  canManage: boolean;
  onEditWorkingDay?: (workingDay: WorkingDayWithBreaks) => void;
  onAddBreak?: (workingDayId: string) => void;
  className?: string;
}

/**
 * Header row showing day names and numbers
 * With menu for managing working hours
 */
export function TimelineHeader({
  dates,
  workingDays,
  canManage,
  onEditWorkingDay,
  onAddBreak,
  className,
}: TimelineHeaderProps) {
  const t = useTranslations("schedule");

  return (
    <div className={cn("flex bg-background pb-2", className)}>
      {/* Spacer for time column */}
      <div className="w-16 shrink-0" />

      {/* Day headers */}
      <div className="flex flex-1">
        {dates.map((date) => {
          const { dayName, dayNumber } = formatDayHeader(date);
          const isToday = checkIsToday(date);
          const dateStr = toDateString(date);
          const workingDay = findWorkingDayForDate(workingDays, dateStr);

          return (
            <div
              key={date.toISOString()}
              className={cn(
                "relative flex-1 border-r border-border/30 py-3 text-center last:border-r-0",
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

              {/* Working hours indicator and menu */}
              {workingDay && canManage && (
                <div className="mt-1 flex items-center justify-center gap-1">
                  <span className="text-xs text-muted">
                    {normalizeTime(workingDay.start_time)} -{" "}
                    {normalizeTime(workingDay.end_time)}
                  </span>
                  <Popover.Root>
                    <Popover.Trigger className="rounded p-0.5 hover:bg-surface">
                      <MoreVertical className="h-3.5 w-3.5 text-muted" />
                    </Popover.Trigger>
                    <Popover.Portal>
                      <Popover.Content align="end" className="min-w-40 p-1">
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text hover:bg-muted/10"
                          onClick={() => onEditWorkingDay?.(workingDay)}
                        >
                          <Pencil className="h-4 w-4" />
                          {t("edit_working_hours")}
                        </button>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text hover:bg-muted/10"
                          onClick={() => onAddBreak?.(workingDay.id)}
                        >
                          <Plus className="h-4 w-4" />
                          {t("add_break")}
                        </button>
                      </Popover.Content>
                    </Popover.Portal>
                  </Popover.Root>
                </div>
              )}

              {/* Non-manager view: just show hours */}
              {workingDay && !canManage && (
                <p className="mt-1 text-xs text-muted">
                  {normalizeTime(workingDay.start_time)} -{" "}
                  {normalizeTime(workingDay.end_time)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
