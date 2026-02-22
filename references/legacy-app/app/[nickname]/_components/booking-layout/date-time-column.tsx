"use client";

/**
 * Date Time Column (Solo Creator Model)
 *
 * Combined calendar and time slot selection for horizontal booking layout.
 * Uses BookingLayoutContext for state management.
 *
 * Key change from multi-specialist model:
 * - Shows creator's working days directly (no specialist aggregation)
 * - Time slots for the single creator
 */

import { useBookingLayout } from "./booking-layout-context";
import { CalendarView } from "./calendar-view";
import { TimeSlotGrid } from "./time-slot-grid";

// ============================================================================
// Types
// ============================================================================

interface DateTimeColumnProps {
  title: string;
  translations: {
    selectServiceFirst: string;
    calendar: {
      monthNames: string[];
      weekdayNames: string[];
      today: string;
      noAvailability: string;
    };
    time: {
      morning: string;
      afternoon: string;
      evening: string;
      noSlots: string;
    };
  };
}

// ============================================================================
// Component
// ============================================================================

export function DateTimeColumn({ title, translations }: DateTimeColumnProps) {
  const {
    selectedDate,
    selectedTime,
    workingDays,
    timeSlots,
    currentMonth,
    isLoadingCalendar,
    isLoadingSlots,
    selectDate,
    selectTime,
    setCurrentMonth,
  } = useBookingLayout();

  return (
    <div className="flex flex-col">
      {/* Header */}
      {title && (
        <div className="pb-3">
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
      )}

      {/* Content - always show calendar */}
      <div className="space-y-4 rounded-2xl border border-border bg-surface p-4">
        <CalendarView
          workingDays={workingDays}
          selectedDate={selectedDate}
          onSelectDate={selectDate}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          isLoading={isLoadingCalendar}
          translations={translations.calendar}
        />

        {/* Time slots when date is selected */}
        {selectedDate && (
          <div className="border-t border-border pt-4">
            <TimeSlotGrid
              slots={timeSlots}
              selectedTime={selectedTime}
              onSelectTime={selectTime}
              isLoading={isLoadingSlots}
              translations={translations.time}
            />
          </div>
        )}
      </div>
    </div>
  );
}
