"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

interface BookingTimeSlotsProps {
  slots: TimeSlot[];
  selectedSlot: { start: string; end: string } | null;
  onSelectSlot: (slot: { start: string; end: string }) => void;
  duration: number;
}

export function BookingTimeSlots({
  slots,
  selectedSlot,
  onSelectSlot,
  duration: _duration,
}: BookingTimeSlotsProps) {
  // Filter only available slots
  const availableSlots = slots.filter((slot) => slot.available);

  if (availableSlots.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map((slot) => {
        const isSelected =
          selectedSlot?.start === slot.start && selectedSlot?.end === slot.end;

        return (
          <button
            key={slot.start}
            type="button"
            onClick={() => slot.available && onSelectSlot(slot)}
            disabled={!slot.available}
            className={cn(
              "flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2",
              !slot.available &&
                "bg-foreground/5 text-foreground/30 cursor-not-allowed line-through",
              slot.available &&
                !isSelected &&
                "bg-foreground/5 text-foreground hover:bg-foreground/10 border border-foreground/10",
              isSelected && "bg-violet-500 text-white border border-violet-500",
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            {slot.start}
          </button>
        );
      })}
    </div>
  );
}
