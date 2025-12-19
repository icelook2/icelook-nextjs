"use client";

import { useTranslations } from "next-intl";
import type { TimeSlot } from "@/lib/schedule/types";
import { cn } from "@/lib/utils/cn";

interface DayTimelineProps {
  slots: TimeSlot[];
}

export function DayTimeline({ slots }: DayTimelineProps) {
  const t = useTranslations("schedule");

  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-foreground/40">{t("no_slots")}</div>
    );
  }

  // Group consecutive slots by availability for visual segments
  const segments: Array<{
    start: string;
    end: string;
    type: "available" | "break" | "booked";
    slots: TimeSlot[];
  }> = [];

  let currentSegment: (typeof segments)[0] | null = null;

  for (const slot of slots) {
    const slotType: "available" | "break" | "booked" = slot.available
      ? "available"
      : slot.blockedReason === "break"
        ? "break"
        : "booked";

    if (!currentSegment || currentSegment.type !== slotType) {
      if (currentSegment) {
        segments.push(currentSegment);
      }
      currentSegment = {
        start: slot.start,
        end: slot.end,
        type: slotType,
        slots: [slot],
      };
    } else {
      currentSegment.end = slot.end;
      currentSegment.slots.push(slot);
    }
  }

  if (currentSegment) {
    segments.push(currentSegment);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs text-foreground/50">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-violet-500/20 border border-violet-500" />
          {t("available")}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500" />
          {t("break")}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-foreground/10 border border-foreground/20" />
          {t("booked")}
        </div>
      </div>

      <div className="relative">
        {/* Timeline bar */}
        <div className="flex gap-0.5 rounded-lg overflow-hidden">
          {segments.map((segment, index) => {
            const durationSlots = segment.slots.length;
            const widthPercent = (durationSlots / slots.length) * 100;

            return (
              <div
                key={`${segment.start}-${index}`}
                className={cn(
                  "h-8 flex items-center justify-center text-xs font-medium transition-all",
                  segment.type === "available" &&
                    "bg-violet-500/20 border border-violet-500/50 text-violet-700 dark:text-violet-300",
                  segment.type === "break" &&
                    "bg-amber-500/20 border border-amber-500/50 text-amber-700 dark:text-amber-300",
                  segment.type === "booked" &&
                    "bg-foreground/10 border border-foreground/20 text-foreground/50",
                )}
                style={{ width: `${widthPercent}%`, minWidth: "20px" }}
                title={`${segment.start} - ${segment.end}`}
              >
                {widthPercent > 15 && (
                  <span className="truncate px-1">
                    {segment.start}-{segment.end}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Time labels */}
        <div className="flex justify-between mt-1 text-xs text-foreground/40">
          <span>{slots[0]?.start}</span>
          <span>{slots[slots.length - 1]?.end}</span>
        </div>
      </div>

      {/* Detailed slot list */}
      <details className="group">
        <summary className="cursor-pointer text-xs text-foreground/50 hover:text-foreground/70 transition-colors">
          {t("show_all_slots")} ({slots.length})
        </summary>

        <div className="mt-2 grid grid-cols-4 sm:grid-cols-6 gap-1 max-h-40 overflow-auto">
          {slots.map((slot) => (
            <div
              key={slot.start}
              className={cn(
                "px-2 py-1 text-xs rounded text-center",
                slot.available &&
                  "bg-violet-500/10 text-violet-700 dark:text-violet-300",
                !slot.available &&
                  slot.blockedReason === "break" &&
                  "bg-amber-500/10 text-amber-700 dark:text-amber-300",
                !slot.available &&
                  slot.blockedReason === "booked" &&
                  "bg-foreground/5 text-foreground/40",
              )}
            >
              {slot.start}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
