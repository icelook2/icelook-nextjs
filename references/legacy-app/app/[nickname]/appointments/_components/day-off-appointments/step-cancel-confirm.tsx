"use client";

/**
 * Step: Cancel Confirm
 *
 * Confirmation step for cancelling an appointment.
 * Shows appointment details and optional reason field.
 */

import { AlertTriangle, Clock, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/lib/ui/button";
import { Textarea } from "@/lib/ui/textarea";
import { useDayOffAppointments } from "./day-off-appointments-context";

/**
 * Cancel confirmation step
 */
export function StepCancelConfirm() {
  const t = useTranslations("creator_schedule.cancel_step");

  const { targetAppointment, cancelReason, setCancelReason, stageCancel } =
    useDayOffAppointments();

  if (!targetAppointment) {
    return null;
  }

  // Format time display (HH:MM)
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    return `${hours}:${minutes}`;
  };

  const handleConfirm = () => {
    stageCancel(targetAppointment.id, cancelReason || undefined);
  };

  return (
    <div className="space-y-6">
      {/* Warning */}
      <div className="flex items-start gap-3 rounded-lg bg-red-100 p-4 text-red-800 dark:bg-red-500/20 dark:text-red-300">
        <AlertTriangle className="mt-0.5 size-5 shrink-0" />
        <p className="text-sm">{t("warning")}</p>
      </div>

      {/* Appointment being cancelled */}
      <div className="rounded-lg border border-border bg-surface-soft p-4">
        <p className="mb-2 text-sm font-medium text-muted">{t("cancelling")}</p>
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

      {/* Reason field */}
      <div>
        <label
          htmlFor="cancel-reason"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          {t("reason_label")}
        </label>
        <Textarea
          id="cancel-reason"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          placeholder={t("reason_placeholder")}
          rows={3}
        />
      </div>

      {/* Confirm button */}
      <div className="flex justify-end">
        <Button variant="danger" onClick={handleConfirm}>
          {t("confirm_cancel")}
        </Button>
      </div>
    </div>
  );
}
