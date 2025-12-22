"use client";

import { cn } from "@/lib/utils/cn";
import type { TimeSlot } from "../_lib/types";

interface TimeColumnProps {
  timeSlots: TimeSlot[];
  className?: string;
}

/**
 * Left column showing time labels (8:00, 9:00, etc.)
 */
export function TimeColumn({ timeSlots, className }: TimeColumnProps) {
  return (
    <div
      className={cn(
        "sticky left-0 z-10 w-16 shrink-0 bg-background",
        className,
      )}
    >
      {timeSlots.map((slot) => (
        <div
          key={`${slot.hour}-${slot.minute}`}
          className="absolute right-2 -translate-y-1/2 text-xs text-muted"
          style={{ top: `${slot.topOffset}%` }}
        >
          {slot.label}
        </div>
      ))}
    </div>
  );
}
