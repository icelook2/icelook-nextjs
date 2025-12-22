"use client";

import { Coffee } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { normalizeTime } from "../_lib/time-utils";
import type { GridConfig, WorkingDayBreak } from "../_lib/types";

interface BreakBlockProps {
  breakData: WorkingDayBreak;
  config: GridConfig;
  onClick?: () => void;
  canManage: boolean;
  className?: string;
}

/**
 * Visual block representing a break within working hours
 * Positioned absolutely within the day column
 */
export function BreakBlock({
  breakData,
  config,
  onClick,
  canManage,
  className,
}: BreakBlockProps) {
  const startTime = normalizeTime(breakData.start_time);
  const endTime = normalizeTime(breakData.end_time);

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

  // Don't show label if block is too small
  const showLabel = heightPercent > 5;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: role is conditionally set based on canManage
    <div
      className={cn(
        "absolute inset-x-2 z-10 rounded border transition-colors",
        "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800",
        canManage &&
          "cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30",
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
      {showLabel && (
        <div className="flex items-center gap-1 p-1">
          <Coffee className="h-3 w-3 text-orange-600 dark:text-orange-400" />
          <span className="text-xs text-orange-700 dark:text-orange-300">
            Break
          </span>
        </div>
      )}
    </div>
  );
}
