"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { ClientAppointment } from "@/lib/queries/appointments";
import type { Enums } from "@/lib/supabase/database.types";
import { Button } from "@/lib/ui/button";
import { Paper } from "@/lib/ui/paper";
import { cancelClientAppointment } from "../../_actions/appointment.actions";
import { CancelAppointmentDialog } from "./cancel-appointment-dialog";

interface ClientAppointmentActionsCardProps {
  appointment: ClientAppointment;
}

export function ClientAppointmentActionsCard({
  appointment,
}: ClientAppointmentActionsCardProps) {
  const t = useTranslations("appointments");
  const format = useFormatter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Only show cancel for pending/confirmed appointments that are upcoming
  const canCancel =
    appointment.status === "pending" || appointment.status === "confirmed";
  const today = new Date().toISOString().split("T")[0];
  const isUpcoming = appointment.date >= today;

  if (!canCancel || !isUpcoming) {
    return null;
  }

  function handleConfirmCancel(reason: Enums<"client_cancellation_reason">) {
    setError(null);
    startTransition(async () => {
      const result = await cancelClientAppointment(appointment.id, reason);
      if (result.success) {
        setDialogOpen(false);
      } else {
        setError(result.error);
      }
    });
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

          <Button
            variant="danger"
            onClick={() => setDialogOpen(true)}
            className="w-full"
          >
            {t("cancel")}
          </Button>
        </div>
      </Paper>

      <CancelAppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleConfirmCancel}
        specialistName={appointment.creator_display_name}
        appointmentDate={appointmentDate}
        isPending={isPending}
      />
    </>
  );
}
