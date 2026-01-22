"use client";

/**
 * Step: Reschedule Date
 *
 * Date picker for selecting a new date when rescheduling an appointment.
 * Only shows available working days (excludes the day being marked off).
 */

import { format } from "date-fns";
import { CalendarDays, Clock, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { SimpleDatePicker } from "../simple-date-picker";
import {
  useDayOffAppointments,
  type WorkingDayOption,
} from "./day-off-appointments-context";

interface StepRescheduleDateProps {
  workingDays: WorkingDayOption[];
  excludeDate: string; // The date being marked as day off
}

/**
 * Date selection step for rescheduling
 */
export function StepRescheduleDate({
  workingDays,
  excludeDate,
}: StepRescheduleDateProps) {
  const t = useTranslations("creator_schedule.reschedule_step");

  const { targetAppointment, rescheduleDate, setRescheduleDate, goToStep } =
    useDayOffAppointments();

  // Filter working days (exclude day being marked off)
  const availableWorkingDays = workingDays.filter(
    (wd) => wd.date !== excludeDate,
  );

  // Create a set of working date strings for the calendar
  const workingDateSet = new Set(availableWorkingDays.map((wd) => wd.date));

  const handleDateSelect = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    // Only allow selection of working days
    if (workingDateSet.has(dateStr)) {
      setRescheduleDate(date);
      goToStep("reschedule-time");
    }
  };

  if (!targetAppointment) {
    return null;
  }

  // Format time display (HH:MM)
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    return `${hours}:${minutes}`;
  };

  return (
    <div className="space-y-6">
      {/* Appointment being rescheduled */}
      <div className="rounded-lg border border-border bg-surface-soft p-4">
        <p className="mb-2 text-sm font-medium text-muted">
          {t("rescheduling")}
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-foreground">
            <User className="size-4 text-muted" />
            <span>{targetAppointment.clientName}</span>
          </div>
          <span className="text-muted">•</span>
          <span className="text-sm text-foreground">
            {targetAppointment.serviceName}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-sm text-muted">
          <Clock className="size-4" />
          <span>
            {formatTime(targetAppointment.startTime)} -{" "}
            {formatTime(targetAppointment.endTime)}
          </span>
        </div>
      </div>

      {/* Date picker */}
      {availableWorkingDays.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CalendarDays className="mb-3 size-12 text-muted" />
          <p className="text-foreground">{t("no_available_days")}</p>
          <p className="mt-1 text-sm text-muted">
            {t("no_available_days_hint")}
          </p>
        </div>
      ) : (
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            {t("select_date")}
          </label>
          <SimpleDatePicker
            selectedDate={rescheduleDate ?? new Date()}
            onSelect={handleDateSelect}
            workingDates={workingDateSet}
            fullWidth
          />
          <p className="mt-2 text-xs text-muted">{t("working_days_only")}</p>
        </div>
      )}
    </div>
  );
}
