"use client";

/**
 * Time Selection Step (Solo Creator Model)
 *
 * Displays available time slots for the selected date.
 * Uses beautyPageId to fetch availability (not specialist).
 *
 * Performance optimizations:
 * - Uses prefetched time slots from context when available
 * - Falls back to fetching if not prefetched
 * - Typically instant because date selection triggers prefetch
 */

import { Clock, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/lib/ui/button";
import { cn } from "@/lib/utils/cn";
import type { TimeSlot } from "./_lib/booking-types";
import { formatSlotTime } from "./_lib/slot-generation";
import { useBooking } from "./booking-context";

interface StepTimeSelectProps {
  translations: {
    title: string;
    subtitle: string;
    loading: string;
    noSlots: string;
    morning: string;
    afternoon: string;
    evening: string;
    nextButton: string;
  };
}

export function StepTimeSelect({ translations }: StepTimeSelectProps) {
  const {
    date,
    time,
    selectTime,
    getTimeSlotsForDate,
    prefetchTimeSlotsForDate,
  } = useBooking();

  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTime, setSelectedTime] = useState<string | null>(time);

  // Use prefetched data or fetch if not available
  useEffect(() => {
    if (!date) {
      return;
    }

    const dateStr = formatDateToYYYYMMDD(date);
    const cached = getTimeSlotsForDate(dateStr);

    // If we have successful cached data, use it immediately
    if (cached?.status === "success") {
      setSlots(cached.slots);
      setIsLoading(false);
      return;
    }

    // If still loading (prefetch in progress), wait for it
    if (cached?.status === "loading") {
      setIsLoading(true);
      // The prefetch will update the cache, we'll re-run this effect
      return;
    }

    // No cache - need to fetch (fallback for edge cases)
    setIsLoading(true);

    // Trigger prefetch which will populate the cache
    prefetchTimeSlotsForDate(date);
  }, [date, getTimeSlotsForDate, prefetchTimeSlotsForDate]);

  // Watch for cache updates when loading
  useEffect(() => {
    if (!date || !isLoading) {
      return;
    }

    const dateStr = formatDateToYYYYMMDD(date);
    const cached = getTimeSlotsForDate(dateStr);

    if (cached?.status === "success") {
      setSlots(cached.slots);
      setIsLoading(false);
    } else if (cached?.status === "error") {
      setSlots([]);
      setIsLoading(false);
    }
  }, [date, getTimeSlotsForDate, isLoading]);

  // Filter to only available slots and group by time of day
  const availableSlots = slots.filter((s) => s.available);

  const slotGroups = {
    morning: [] as TimeSlot[],
    afternoon: [] as TimeSlot[],
    evening: [] as TimeSlot[],
  };

  for (const slot of availableSlots) {
    const hour = Number.parseInt(slot.time.split(":")[0], 10);
    if (hour < 12) {
      slotGroups.morning.push(slot);
    } else if (hour < 17) {
      slotGroups.afternoon.push(slot);
    } else {
      slotGroups.evening.push(slot);
    }
  }

  const hasAvailableSlots = availableSlots.length > 0;

  // Handle slot click
  const handleSlotClick = (slotTime: string) => {
    setSelectedTime(slotTime);
  };

  // Handle next button
  const handleNext = () => {
    if (selectedTime) {
      selectTime(selectedTime);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Content */}
      <div className="px-4 pb-4">
        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted" />
          </div>
        )}

        {/* No slots available */}
        {!isLoading && !hasAvailableSlots && (
          <div className="py-12 text-center">
            <Clock className="mx-auto h-10 w-10 text-muted/50" />
            <p className="mt-3 text-sm text-muted">{translations.noSlots}</p>
          </div>
        )}

        {/* Time slots */}
        {!isLoading && hasAvailableSlots && (
          <div className="space-y-6">
            {slotGroups.morning.length > 0 && (
              <SlotGroup
                label={translations.morning}
                slots={slotGroups.morning}
                selectedTime={selectedTime}
                onSelect={handleSlotClick}
              />
            )}
            {slotGroups.afternoon.length > 0 && (
              <SlotGroup
                label={translations.afternoon}
                slots={slotGroups.afternoon}
                selectedTime={selectedTime}
                onSelect={handleSlotClick}
              />
            )}
            {slotGroups.evening.length > 0 && (
              <SlotGroup
                label={translations.evening}
                slots={slotGroups.evening}
                selectedTime={selectedTime}
                onSelect={handleSlotClick}
              />
            )}
          </div>
        )}
      </div>

      {/* Footer with actions */}
      <div className="flex justify-end border-t border-border px-4 py-3">
        <Button onClick={handleNext} disabled={!selectedTime}>
          {translations.nextButton}
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Slot Group
// ============================================================================

interface SlotGroupProps {
  label: string;
  slots: TimeSlot[];
  selectedTime: string | null;
  onSelect: (time: string) => void;
}

function SlotGroup({ label, slots, selectedTime, onSelect }: SlotGroupProps) {
  return (
    <div>
      <h4 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </h4>
      <div className="flex flex-wrap gap-2">
        {slots.map((slot) => (
          <TimeSlotCapsule
            key={slot.time}
            slot={slot}
            isSelected={selectedTime === slot.time}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Time Slot Capsule
// ============================================================================

interface TimeSlotCapsuleProps {
  slot: TimeSlot;
  isSelected: boolean;
  onSelect: (time: string) => void;
}

function TimeSlotCapsule({ slot, isSelected, onSelect }: TimeSlotCapsuleProps) {
  const formattedTime = formatSlotTime(slot.time, false);

  return (
    <button
      type="button"
      onClick={() => onSelect(slot.time)}
      className={cn(
        "rounded-2xl px-4 py-2 text-sm font-medium transition-all",
        isSelected
          ? "bg-accent text-white"
          : "bg-foreground/10 text-foreground hover:bg-foreground/20",
      )}
    >
      {formattedTime}
    </button>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
