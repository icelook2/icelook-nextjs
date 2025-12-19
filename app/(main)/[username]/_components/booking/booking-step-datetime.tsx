"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { type TimeSlot, useBooking } from "@/lib/appointments";
import { Button } from "@/lib/ui/button";
import { getAvailableSlots } from "../../_actions/booking.action";
import { BookingCalendar } from "./booking-calendar";
import { BookingTimeSlots } from "./booking-time-slots";

export function BookingStepDateTime() {
  const t = useTranslations("booking");
  const {
    specialist,
    totals,
    formData,
    setDateTime,
    goToStep,
    isAuthenticated,
  } = useBooking();

  const [selectedDate, setSelectedDate] = useState<string | null>(
    formData.date,
  );
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    start: string;
    end: string;
  } | null>(formData.timeSlot);

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isWorkingDay, setIsWorkingDay] = useState(true);

  const handleDateSelect = useCallback(
    async (date: string) => {
      setSelectedDate(date);
      setSelectedTimeSlot(null);
      setIsLoadingSlots(true);

      const result = await getAvailableSlots({
        specialistId: specialist.id,
        date,
        serviceDuration: totals.totalDurationMinutes,
      });

      if (result.success && result.data) {
        setTimeSlots(result.data.slots);
        setIsWorkingDay(result.data.isWorkingDay);
      } else {
        setTimeSlots([]);
        setIsWorkingDay(false);
      }

      setIsLoadingSlots(false);
    },
    [specialist.id, totals.totalDurationMinutes],
  );

  const handleTimeSelect = (slot: { start: string; end: string }) => {
    setSelectedTimeSlot(slot);
  };

  const handleContinue = () => {
    if (!selectedDate || !selectedTimeSlot) {
      return;
    }

    setDateTime(selectedDate, selectedTimeSlot);

    // Skip guest-info step if user is authenticated
    if (isAuthenticated) {
      goToStep("confirmation");
    } else {
      goToStep("guest-info");
    }
  };

  const canContinue = selectedDate && selectedTimeSlot;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Calendar Section */}
        <div>
          <h3 className="text-sm font-medium text-foreground/70 mb-3">
            {t("select_date")}
          </h3>
          <BookingCalendar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
          />
        </div>

        {/* Time Slots Section */}
        {selectedDate && (
          <div>
            <h3 className="text-sm font-medium text-foreground/70 mb-3">
              {t("select_time")}
            </h3>

            {isLoadingSlots ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-foreground/40" />
              </div>
            ) : !isWorkingDay ? (
              <div className="text-center py-8 text-foreground/50">
                {t("no_working_day")}
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="text-center py-8 text-foreground/50">
                {t("no_available_slots")}
              </div>
            ) : (
              <BookingTimeSlots
                slots={timeSlots}
                selectedSlot={selectedTimeSlot}
                onSelectSlot={handleTimeSelect}
                duration={totals.totalDurationMinutes}
              />
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-foreground/10 px-6 py-4 shrink-0">
        <Button
          onClick={handleContinue}
          disabled={!canContinue}
          className="w-full"
        >
          {t("continue")}
        </Button>
      </div>
    </div>
  );
}
