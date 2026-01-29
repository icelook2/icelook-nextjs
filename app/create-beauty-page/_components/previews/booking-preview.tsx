"use client";

import { format } from "date-fns";
import { enUS, uk } from "date-fns/locale";
import { CalendarOff } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { AvailableSlot } from "@/app/[nickname]/appointments/_components/free-slot-variants";
import { Paper } from "@/lib/ui/paper";
import type { FirstWorkingDayData } from "../../_lib/types";

const localeMap = { en: enUS, uk } as const;

interface BookingPreviewProps {
  /** First working day configuration */
  firstWorkingDay: FirstWorkingDayData | null;
}

/**
 * Booking preview for the create beauty page flow.
 * Shows what the booking calendar will look like for clients.
 */
export function BookingPreview({ firstWorkingDay }: BookingPreviewProps) {
  const t = useTranslations("creator_schedule");
  const locale = useLocale();
  const dateFnsLocale = localeMap[locale as keyof typeof localeMap] ?? enUS;

  // Use the configured working day date, or today as fallback
  const displayDate = firstWorkingDay
    ? new Date(firstWorkingDay.date)
    : new Date();

  // Generate time slots for the working day (excluding break time)
  const getTimeSlots = (): { startTime: string; durationMinutes: number }[] => {
    if (!firstWorkingDay) {
      return [];
    }

    const slots: { startTime: string; durationMinutes: number }[] = [];
    const [startHour, startMin] = firstWorkingDay.startTime.split(":").map(Number);
    const [endHour, endMin] = firstWorkingDay.endTime.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    // Break time (if set)
    let breakStartMins = 0;
    let breakEndMins = 0;
    if (firstWorkingDay.breakTime) {
      const [bsH, bsM] = firstWorkingDay.breakTime.startTime.split(":").map(Number);
      const [beH, beM] = firstWorkingDay.breakTime.endTime.split(":").map(Number);
      breakStartMins = bsH * 60 + bsM;
      breakEndMins = beH * 60 + beM;
    }

    // Generate slots every 30 minutes, skipping break period
    const slotInterval = 30;
    for (let m = startMinutes; m < endMinutes; m += slotInterval) {
      // Skip slots that fall within the break period
      if (breakStartMins && m >= breakStartMins && m < breakEndMins) {
        continue;
      }

      const h = Math.floor(m / 60);
      const min = m % 60;
      const slotTime = `${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;

      // Calculate remaining time until end of day (or until break starts)
      let slotEndMinutes = endMinutes;
      if (breakStartMins && m < breakStartMins) {
        // If before break, available time is until break starts
        slotEndMinutes = breakStartMins;
      }
      const remainingMinutes = slotEndMinutes - m;

      slots.push({
        startTime: slotTime,
        durationMinutes: remainingMinutes,
      });
    }

    return slots;
  };

  const timeSlots = getTimeSlots();

  // Format working hours for display
  const workingHoursDisplay = firstWorkingDay
    ? `${firstWorkingDay.startTime} – ${firstWorkingDay.endTime}`
    : null;

  const dayOfWeek = format(displayDate, "EEEE", { locale: dateFnsLocale });
  const isCurrentYear = displayDate.getFullYear() === new Date().getFullYear();
  const dateFormat = isCurrentYear ? "d MMMM" : "d MMMM yyyy";
  const formattedDate = format(displayDate, dateFormat, {
    locale: dateFnsLocale,
  });

  return (
    <div className="space-y-3">
      {/* Header - static display */}
      <header>
        <p className="text-xs text-muted">{dayOfWeek}</p>
        <h2 className="text-lg font-semibold">{formattedDate}</h2>
        <p className="text-xs text-muted">
          {workingHoursDisplay ?? t("day_off")}
        </p>
      </header>

      {/* Time slots */}
      <div className="space-y-2">
        {firstWorkingDay ? (
          timeSlots.length > 0 ? (
            <>
              {timeSlots.map((slot) => (
                <AvailableSlot
                  key={slot.startTime}
                  startTime={slot.startTime}
                  durationMinutes={slot.durationMinutes}
                />
              ))}
            </>
          ) : (
            <Paper className="flex items-center justify-center gap-3 p-4">
              <CalendarOff className="h-5 w-5 text-muted" />
              <p className="text-sm text-muted">{t("not_configured")}</p>
            </Paper>
          )
        ) : (
          <Paper className="flex items-center justify-center gap-3 p-4">
            <CalendarOff className="h-5 w-5 text-muted" />
            <p className="text-sm text-muted">{t("not_configured")}</p>
          </Paper>
        )}
      </div>
    </div>
  );
}
