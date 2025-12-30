"use client";

/**
 * Time Slot Grid
 *
 * Displays available time slots grouped by time of day.
 * Extracted from step-time-select.tsx for use in horizontal layout.
 */

import { Clock, Loader2 } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import type { TimeSlot } from "../booking/_lib/booking-types";
import { formatSlotTime } from "../booking/_lib/slot-generation";

// ============================================================================
// Types
// ============================================================================

interface TimeSlotGridProps {
  /** All time slots (will be filtered to available only) */
  slots: TimeSlot[];
  /** Currently selected time (HH:MM format) */
  selectedTime: string | null;
  /** Callback when a time is selected */
  onSelectTime: (time: string) => void;
  /** Whether slots are loading */
  isLoading?: boolean;
  /** Translations */
  translations: {
    morning: string;
    afternoon: string;
    evening: string;
    noSlots: string;
    loading?: string;
  };
}

// ============================================================================
// Component
// ============================================================================

export function TimeSlotGrid({
  slots,
  selectedTime,
  onSelectTime,
  isLoading = false,
  translations,
}: TimeSlotGridProps) {
  // Filter to only available slots and group by time of day
  const slotGroups = useMemo(() => {
    const availableSlots = slots.filter((s) => s.available);

    const morning: TimeSlot[] = [];
    const afternoon: TimeSlot[] = [];
    const evening: TimeSlot[] = [];

    for (const slot of availableSlots) {
      const hour = Number.parseInt(slot.time.split(":")[0], 10);
      if (hour < 12) {
        morning.push(slot);
      } else if (hour < 17) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    }

    return { morning, afternoon, evening };
  }, [slots]);

  // Check if any slots are available
  const hasAvailableSlots = useMemo(
    () => slots.some((s) => s.available),
    [slots],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      )}

      {/* No slots available */}
      {!isLoading && !hasAvailableSlots && (
        <div className="py-8 text-center">
          <Clock className="mx-auto h-10 w-10 text-muted/50" />
          <p className="mt-3 text-sm text-muted">{translations.noSlots}</p>
        </div>
      )}

      {/* Time slots */}
      {!isLoading && hasAvailableSlots && (
        <div className="space-y-4">
          {slotGroups.morning.length > 0 && (
            <SlotGroup
              label={translations.morning}
              slots={slotGroups.morning}
              selectedTime={selectedTime}
              onSelect={onSelectTime}
            />
          )}
          {slotGroups.afternoon.length > 0 && (
            <SlotGroup
              label={translations.afternoon}
              slots={slotGroups.afternoon}
              selectedTime={selectedTime}
              onSelect={onSelectTime}
            />
          )}
          {slotGroups.evening.length > 0 && (
            <SlotGroup
              label={translations.evening}
              slots={slotGroups.evening}
              selectedTime={selectedTime}
              onSelect={onSelectTime}
            />
          )}
        </div>
      )}
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
      <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
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
