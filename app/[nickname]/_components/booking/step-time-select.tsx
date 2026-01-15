"use client";

/**
 * Time Selection Step (Solo Creator Model)
 *
 * Displays available time slots for the selected date.
 * Uses beautyPageId to fetch availability (not specialist).
 */

import { Clock, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/lib/ui/button";
import { cn } from "@/lib/utils/cn";
import { getAvailabilityData } from "./_actions/availability.actions";
import type { TimeSlot } from "./_lib/booking-types";
import { formatSlotTime, generateAvailableSlots } from "./_lib/slot-generation";
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
    beautyPageId,
    totalDurationMinutes,
    date,
    time,
    selectTime,
    timezone,
  } = useBooking();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTime, setSelectedTime] = useState<string | null>(time);

  // Fetch availability and generate slots when date changes
  useEffect(() => {
    if (!date) {
      return;
    }

    const fetchAndGenerateSlots = async () => {
      setIsLoading(true);

      const dateStr = formatDateToYYYYMMDD(date);

      const result = await getAvailabilityData({
        beautyPageId,
        startDate: dateStr,
        endDate: dateStr,
      });

      if (!result.success) {
        setSlots([]);
        setIsLoading(false);
        return;
      }

      const { workingDays, appointments, bookingSettings } = result.data;

      // Find working day for selected date
      const workingDay = workingDays.find((wd) => wd.date === dateStr) ?? null;

      // Generate slots
      const generatedSlots = generateAvailableSlots({
        workingDay,
        appointments,
        serviceDurationMinutes: totalDurationMinutes,
        slotIntervalMinutes: 30,
        minNoticeHours: bookingSettings?.minBookingNoticeHours ?? 0,
        date,
        timezone,
      });

      setSlots(generatedSlots);
      setIsLoading(false);
    };

    fetchAndGenerateSlots();
  }, [beautyPageId, totalDurationMinutes, date, timezone]);

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

  // Handle slot click
  const handleSlotClick = useCallback((slotTime: string) => {
    setSelectedTime(slotTime);
  }, []);

  // Handle next button
  const handleNext = useCallback(() => {
    if (selectedTime) {
      selectTime(selectedTime);
    }
  }, [selectedTime, selectTime]);

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
