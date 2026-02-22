"use client";

/**
 * Step: Reschedule Time
 *
 * Time picker for selecting a new time slot when rescheduling.
 * Shows available time slots based on the selected working day.
 */

import { format } from "date-fns";
import { enUS, uk } from "date-fns/locale";
import { User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/lib/ui/button";
import { Select } from "@/lib/ui/select";
import {
  calculateEndTime,
  generateTimeOptions,
  useDayOffAppointments,
  type WorkingDayOption,
} from "./day-off-appointments-context";

const localeMap = { en: enUS, uk } as const;

interface StepRescheduleTimeProps {
  workingDays: WorkingDayOption[];
}

/**
 * Time selection step for rescheduling
 */
export function StepRescheduleTime({ workingDays }: StepRescheduleTimeProps) {
  const locale = useLocale();
  const t = useTranslations("creator_schedule.reschedule_step");
  const dateFnsLocale = localeMap[locale as keyof typeof localeMap] ?? enUS;

  const {
    targetAppointment,
    rescheduleDate,
    rescheduleTime,
    setRescheduleTime,
    stageReschedule,
  } = useDayOffAppointments();

  if (!targetAppointment || !rescheduleDate) {
    return null;
  }

  // Find the working day for the selected date
  const dateStr = format(rescheduleDate, "yyyy-MM-dd");
  const selectedWorkingDay = workingDays.find((wd) => wd.date === dateStr);

  if (!selectedWorkingDay) {
    return null;
  }

  // Generate time options based on working day hours and service duration
  const timeOptions = generateTimeOptions(
    selectedWorkingDay.startTime,
    selectedWorkingDay.endTime,
    targetAppointment.serviceDurationMinutes,
  );

  // Calculate end time for preview
  const endTime = rescheduleTime
    ? calculateEndTime(rescheduleTime, targetAppointment.serviceDurationMinutes)
    : null;

  // Format duration for display
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  // Format time display (HH:MM)
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    return `${hours}:${minutes}`;
  };

  const handleConfirm = () => {
    if (!rescheduleTime || !endTime) return;
    stageReschedule(targetAppointment.id, dateStr, rescheduleTime, endTime);
  };

  const canConfirm = rescheduleTime !== null;

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
        <div className="mt-2 text-sm font-medium text-primary">
          {t("new_date")}:{" "}
          {format(rescheduleDate, "d MMMM", { locale: dateFnsLocale })}
        </div>
      </div>

      {/* Time picker */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          {t("select_time")}
        </label>
        <Select.Root
          value={rescheduleTime}
          onValueChange={(value) => setRescheduleTime(value as string)}
        >
          <Select.TriggerWrapper>
            <Select.Trigger
              placeholder={t("select_time_placeholder")}
              items={timeOptions}
            />
          </Select.TriggerWrapper>
          <Select.Content>
            {timeOptions.map((option) => (
              <Select.Item key={option.value} value={option.value}>
                {option.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>

        {/* Duration info */}
        <p className="mt-2 text-xs text-muted">
          {t("duration", {
            duration: formatDuration(targetAppointment.serviceDurationMinutes),
          })}
        </p>
      </div>

      {/* Preview new time slot */}
      {rescheduleTime && endTime && (
        <div className="rounded-lg bg-emerald-100 p-4 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
          <p className="font-medium">
            {t("new_time")}:{" "}
            {format(rescheduleDate, "d MMM", { locale: dateFnsLocale })}{" "}
            {formatTime(rescheduleTime)} - {formatTime(endTime)}
          </p>
        </div>
      )}

      {/* Confirm button */}
      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={handleConfirm}
          disabled={!canConfirm}
        >
          {t("confirm_reschedule")}
        </Button>
      </div>
    </div>
  );
}
