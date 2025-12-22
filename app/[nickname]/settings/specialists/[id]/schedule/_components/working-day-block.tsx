"use client";

import { cn } from "@/lib/utils/cn";
import { normalizeTime } from "../_lib/time-utils";
import type { GridConfig, WorkingDayWithBreaks } from "../_lib/types";

interface WorkingDayBlockProps {
  workingDay: WorkingDayWithBreaks;
  config: GridConfig;
  onClick?: () => void;
  canManage: boolean;
  className?: string;
}

/**
 * Visual block representing working hours for a day
 * Positioned absolutely within the day column
 */
export function WorkingDayBlock({
  workingDay,
  config,
  onClick,
  canManage,
  className,
}: WorkingDayBlockProps) {
  const startTime = normalizeTime(workingDay.start_time);
  const endTime = normalizeTime(workingDay.end_time);

  // Calculate position as percentage
  const totalMinutes = (config.endHour - config.startHour) * 60;
  const startMinutes =
    Number.parseInt(startTime.split(":")[0], 10) * 60 +
    Number.parseInt(startTime.split(":")[1], 10) -
    config.startHour * 60;
  const endMinutes =
    Number.parseInt(endTime.split(":")[0], 10) * 60 +
    Number.parseInt(endTime.split(":")[1], 10) -
    config.startHour * 60;

  const topPercent = (startMinutes / totalMinutes) * 100;
  const heightPercent = ((endMinutes - startMinutes) / totalMinutes) * 100;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: role is conditionally set based on canManage
    <div
      className={cn(
        "absolute inset-x-1 rounded-lg border transition-colors",
        "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
        canManage &&
          "cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30",
        className,
      )}
      style={{
        top: `${topPercent}%`,
        height: `${heightPercent}%`,
      }}
      onClick={canManage ? onClick : undefined}
      onKeyDown={
        canManage
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                onClick?.();
              }
            }
          : undefined
      }
      role={canManage ? "button" : undefined}
      tabIndex={canManage ? 0 : undefined}
    >
      <div className="p-2">
        <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
          {startTime} - {endTime}
        </p>
      </div>
    </div>
  );
}
