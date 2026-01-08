"use client";

import { Ban } from "lucide-react";
import { useTranslations } from "next-intl";
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
 * Visual block representing a break/blocked time within working hours
 * Subtle appearance - hatched pattern with muted styling
 */
export function BreakBlock({
  breakData,
  config,
  onClick,
  canManage,
  className,
}: BreakBlockProps) {
  const t = useTranslations("schedule");
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

  // Show content based on available space
  const isCompact = heightPercent < 6;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: role is conditionally set based on canManage
    <div
      className={cn(
        "absolute inset-x-1 overflow-hidden rounded-lg transition-colors",
        // Hatched pattern to match unavailable areas
        "unavailable-pattern",
        canManage && "cursor-pointer hover:opacity-70",
        className,
      )}
      style={{
        top: `${topPercent}%`,
        height: `${heightPercent}%`,
        minHeight: "16px",
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
      <div
        className={cn(
          "flex h-full items-center gap-1 px-2 bg-background/60 rounded-lg",
          isCompact ? "justify-center" : "py-1",
        )}
      >
        <Ban className="h-3 w-3 shrink-0 text-muted" />
        {!isCompact && (
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-xs text-muted">{t("break")}</span>
            <span className="text-[10px] text-muted/70">
              {startTime} – {endTime}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
