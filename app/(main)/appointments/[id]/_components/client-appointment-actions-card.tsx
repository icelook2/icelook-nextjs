"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ClientAppointment } from "@/lib/queries/appointments";
import type { Enums } from "@/lib/supabase/database.types";
import { Button } from "@/lib/ui/button";
import { Paper } from "@/lib/ui/paper";
import { cancelClientAppointment } from "../../_actions/appointment.actions";
import {
  QuickRescheduleDialog,
  type QuickRescheduleTranslations,
} from "../../_components/quick-reschedule-dialog";
import { CancelAppointmentDialog } from "./cancel-appointment-dialog";

interface ClientAppointmentActionsCardProps {
  appointment: ClientAppointment;
  /** Client's name (for reschedule data) */
  clientName: string;
  /** Translations for reschedule dialog */
  rescheduleTranslations?: QuickRescheduleTranslations;
}

export function ClientAppointmentActionsCard({
  appointment,
  clientName,
  rescheduleTranslations,
}: ClientAppointmentActionsCardProps) {
  const t = useTranslations("appointments");
  const format = useFormatter();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);

  // Only show cancel for pending/confirmed appointments that are upcoming
  const canCancel =
    appointment.status === "pending" || appointment.status === "confirmed";
  const today = new Date().toISOString().split("T")[0];
  const isUpcoming = appointment.date >= today;

  if (!canCancel || !isUpcoming) {
    return null;
  }

  // Can reschedule if appointment is pending/confirmed, upcoming, and has reschedule translations
  const canReschedule = canCancel && isUpcoming && !!rescheduleTranslations;

  function handleConfirmCancel(reason: Enums<"client_cancellation_reason">) {
    setError(null);
    startTransition(async () => {
      const result = await cancelClientAppointment(appointment.id, reason);
      if (result.success) {
        setCancelDialogOpen(false);
      } else {
        setError(result.error);
      }
    });
  }

  function handleRescheduleSuccess() {
    router.refresh();
  }

  // Format the appointment date for the dialog
  const appointmentDate = format.dateTime(new Date(appointment.date), {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <Paper className="p-4">
        <div className="space-y-3">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Reschedule button - primary action */}
          {canReschedule && (
            <Button
              variant="secondary"
              onClick={() => setRescheduleDialogOpen(true)}
              className="w-full"
            >
              {t("reschedule")}
            </Button>
          )}

          {/* Cancel button - destructive action */}
          <Button
            variant="danger"
            onClick={() => setCancelDialogOpen(true)}
            className="w-full"
          >
            {t("cancel")}
          </Button>
        </div>
      </Paper>

      {/* Cancel Dialog */}
      <CancelAppointmentDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleConfirmCancel}
        specialistName={appointment.creator_display_name}
        appointmentDate={appointmentDate}
        isPending={isPending}
      />

      {/* Reschedule Dialog */}
      {rescheduleTranslations && (
        <QuickRescheduleDialog
          appointment={rescheduleDialogOpen ? appointment : null}
          clientName={clientName}
          onClose={() => setRescheduleDialogOpen(false)}
          onSuccess={handleRescheduleSuccess}
          translations={rescheduleTranslations}
        />
      )}
    </>
  );
}
