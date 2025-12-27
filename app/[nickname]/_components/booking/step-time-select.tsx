"use client";

/**
 * Time Selection Step
 *
 * Displays available time slots for the selected date.
 * Generates slots based on working hours, breaks, and existing appointments.
 */

import { Clock, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { getAvailabilityData } from "./_actions/availability.actions";
import { useBooking } from "./booking-context";
import type { TimeSlot, WorkingDayData } from "./_lib/booking-types";
import { formatSlotTime, generateAvailableSlots } from "./_lib/slot-generation";

interface StepTimeSelectProps {
  translations: {
    title: string;
    subtitle: string;
    loading: string;
    noSlots: string;
    unavailable: string;
  };
}

export function StepTimeSelect({ translations }: StepTimeSelectProps) {
  const { specialist, date, selectTime, timezone } = useBooking();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch availability and generate slots when date changes
  useEffect(() => {
    if (!specialist || !date) return;

    const fetchAndGenerateSlots = async () => {
      setIsLoading(true);
      setError(null);

      const dateStr = formatDateToYYYYMMDD(date);

      const result = await getAvailabilityData({
        specialistId: specialist.specialistId,
        startDate: dateStr,
        endDate: dateStr,
      });

      if (!result.success) {
        setError(result.error);
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
        serviceDurationMinutes: specialist.totalDurationMinutes,
        slotIntervalMinutes: 30, // Default, could come from settings
        minNoticeHours: bookingSettings?.minBookingNoticeHours ?? 0,
        date,
        timezone,
      });

      setSlots(generatedSlots);
      setIsLoading(false);
    };

    fetchAndGenerateSlots();
  }, [specialist, date, timezone]);

  // Split slots into morning, afternoon, evening
  const slotGroups = useMemo(() => {
    const morning: TimeSlot[] = [];
    const afternoon: TimeSlot[] = [];
    const evening: TimeSlot[] = [];

    for (const slot of slots) {
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

  // Format selected date for display
  const formattedDate = useMemo(() => {
    if (!date) return "";
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }, [date]);

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {translations.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {formattedDate}
        </p>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
            {translations.loading}
          </span>
        </div>
      )}

      {/* No slots available */}
      {!isLoading && slots.length === 0 && (
        <div className="py-8 text-center">
          <Clock className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {translations.noSlots}
          </p>
        </div>
      )}

      {/* Time slots grid */}
      {!isLoading && slots.length > 0 && (
        <div className="space-y-4">
          {slotGroups.morning.length > 0 && (
            <SlotGroup
              label="Morning"
              slots={slotGroups.morning}
              onSelect={selectTime}
              unavailableLabel={translations.unavailable}
            />
          )}
          {slotGroups.afternoon.length > 0 && (
            <SlotGroup
              label="Afternoon"
              slots={slotGroups.afternoon}
              onSelect={selectTime}
              unavailableLabel={translations.unavailable}
            />
          )}
          {slotGroups.evening.length > 0 && (
            <SlotGroup
              label="Evening"
              slots={slotGroups.evening}
              onSelect={selectTime}
              unavailableLabel={translations.unavailable}
            />
          )}
        </div>
      )}

      {/* All slots booked message */}
      {!isLoading && slots.length > 0 && !hasAvailableSlots && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          {translations.noSlots}
        </p>
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
  onSelect: (time: string) => void;
  unavailableLabel: string;
}

function SlotGroup({ label, slots, onSelect, unavailableLabel }: SlotGroupProps) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </h4>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
        {slots.map((slot) => (
          <TimeSlotButton
            key={slot.time}
            slot={slot}
            onSelect={onSelect}
            unavailableLabel={unavailableLabel}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Time Slot Button
// ============================================================================

interface TimeSlotButtonProps {
  slot: TimeSlot;
  onSelect: (time: string) => void;
  unavailableLabel: string;
}

function TimeSlotButton({ slot, onSelect, unavailableLabel }: TimeSlotButtonProps) {
  const formattedTime = formatSlotTime(slot.time, false);

  return (
    <button
      type="button"
      disabled={!slot.available}
      onClick={() => onSelect(slot.time)}
      className={cn(
        "rounded-md border px-3 py-2 text-sm transition-colors",
        slot.available &&
          "cursor-pointer border-gray-200 bg-white hover:border-green-500 hover:bg-green-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-green-500 dark:hover:bg-green-900/20",
        !slot.available &&
          "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-600",
      )}
      title={!slot.available ? unavailableLabel : undefined}
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
