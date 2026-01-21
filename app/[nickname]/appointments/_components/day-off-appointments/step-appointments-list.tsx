"use client";

/**
 * Step: Appointments List
 *
 * Shows all appointments that need handling before marking day as day off.
 * Each appointment can be configured for reschedule or cancel.
 */

import { format, parseISO } from "date-fns";
import { enUS, uk } from "date-fns/locale";
import { AlertTriangle, CalendarClock, Check, Clock, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Avatar } from "@/lib/ui/avatar";
import { Button } from "@/lib/ui/button";
import { cn } from "@/lib/utils/cn";
import {
  useDayOffAppointments,
  type AppointmentWithPending,
} from "./day-off-appointments-context";

const localeMap = { en: enUS, uk } as const;

/**
 * Appointments list step - shows all appointments with pending actions
 */
export function StepAppointmentsList() {
  const locale = useLocale();
  const t = useTranslations("creator_schedule.day_off_dialog");
  const dateFnsLocale = localeMap[locale as keyof typeof localeMap] ?? enUS;

  const {
    appointments,
    isSubmitting,
    pendingCount,
    totalCount,
    setTargetAppointment,
    goToStep,
    clearPendingAction,
  } = useDayOffAppointments();

  const handleReschedule = (apt: AppointmentWithPending) => {
    setTargetAppointment(apt);
    goToStep("reschedule-date");
  };

  const handleCancel = (apt: AppointmentWithPending) => {
    setTargetAppointment(apt);
    goToStep("cancel-confirm");
  };

  return (
    <div className="space-y-4">
      {/* Warning message */}
      <div className="flex items-start gap-3 rounded-lg bg-amber-100 p-4 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
        <AlertTriangle className="mt-0.5 size-5 shrink-0" />
        <p className="text-sm">{t("warning")}</p>
      </div>

      {/* Appointments list */}
      <div className="space-y-3">
        {appointments.map((appointment) => (
          <AppointmentRow
            key={appointment.id}
            appointment={appointment}
            onCancel={() => handleCancel(appointment)}
            onReschedule={() => handleReschedule(appointment)}
            onClearAction={() => clearPendingAction(appointment.id)}
            disabled={isSubmitting}
            dateFnsLocale={dateFnsLocale}
          />
        ))}
      </div>

      {/* Progress indicator */}
      <div className="text-center text-sm text-muted">
        {t("pending_count", { pending: pendingCount, total: totalCount })}
      </div>
    </div>
  );
}

// ============================================================================
// Appointment Row
// ============================================================================

interface AppointmentRowProps {
  appointment: AppointmentWithPending;
  onCancel: () => void;
  onReschedule: () => void;
  onClearAction: () => void;
  disabled?: boolean;
  dateFnsLocale: typeof enUS | typeof uk;
}

function AppointmentRow({
  appointment,
  onCancel,
  onReschedule,
  onClearAction,
  disabled = false,
  dateFnsLocale,
}: AppointmentRowProps) {
  const t = useTranslations("creator_schedule.day_off_dialog");

  const hasPendingAction = appointment.pendingAction !== null;
  const isRescheduled = appointment.pendingAction?.type === "reschedule";
  const isCancelled = appointment.pendingAction?.type === "cancel";

  // Format time display (HH:MM)
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    return `${hours}:${minutes}`;
  };

  // Format rescheduled date for display
  const formatRescheduledInfo = () => {
    if (!isRescheduled || appointment.pendingAction?.type !== "reschedule") {
      return "";
    }
    const { date, startTime } = appointment.pendingAction;
    const dateObj = parseISO(date);
    return `${format(dateObj, "d MMM", { locale: dateFnsLocale })} ${formatTime(startTime)}`;
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface p-4 transition-opacity",
        hasPendingAction && "border-dashed",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Time */}
        <div className="flex w-24 shrink-0 items-center gap-1.5 text-sm text-muted">
          <Clock className="size-4" />
          <span>
            {formatTime(appointment.startTime)} -{" "}
            {formatTime(appointment.endTime)}
          </span>
        </div>

        {/* Client info */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar name={appointment.clientName} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-foreground">
              {appointment.clientName}
            </p>
            <p className="truncate text-sm text-muted">
              {appointment.serviceName}
            </p>
          </div>
        </div>

        {/* Status badge */}
        <div className="shrink-0">
          <StatusBadge status={appointment.status} />
        </div>
      </div>

      {/* Action row */}
      <div className="mt-3 flex items-center justify-end gap-2">
        {isCancelled && (
          <div className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
            <X className="size-4" />
            <span>{t("will_be_cancelled")}</span>
          </div>
        )}

        {isRescheduled && (
          <div className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
            <CalendarClock className="size-4" />
            <span>
              {t("will_be_rescheduled", { date: formatRescheduledInfo() })}
            </span>
          </div>
        )}

        {hasPendingAction && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAction}
            disabled={disabled}
          >
            {t("clear_action")}
          </Button>
        )}

        {!hasPendingAction && (
          <>
            <Button
              variant="soft"
              size="sm"
              onClick={onCancel}
              disabled={disabled}
            >
              {t("cancel_button")}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onReschedule}
              disabled={disabled}
            >
              {t("reschedule_button")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Status Badge
// ============================================================================

interface StatusBadgeProps {
  status: "pending" | "confirmed";
}

function StatusBadge({ status }: StatusBadgeProps) {
  const t = useTranslations("appointments");

  if (status === "confirmed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
        <Check className="size-3" />
        {t("status_confirmed")}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
      <Clock className="size-3" />
      {t("status_pending")}
    </span>
  );
}
