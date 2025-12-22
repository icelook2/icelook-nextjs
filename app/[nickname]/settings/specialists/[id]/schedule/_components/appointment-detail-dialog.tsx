"use client";

import { Calendar, Clock, Mail, Phone, Scissors, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import {
  cancelAppointment,
  completeAppointment,
  confirmAppointment,
  markNoShow,
} from "../_actions";
import { parseDate } from "../_lib/date-utils";
import { getAppointmentStatusColor } from "../_lib/schedule-utils";
import { normalizeTime } from "../_lib/time-utils";
import type { Appointment } from "../_lib/types";

interface AppointmentDetailDialogProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment;
  beautyPageId: string;
  nickname: string;
  canManage: boolean;
}

/**
 * Dialog showing appointment details with status management
 */
export function AppointmentDetailDialog({
  open,
  onClose,
  appointment,
  beautyPageId,
  nickname,
  canManage,
}: AppointmentDetailDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const statusColors = getAppointmentStatusColor(appointment.status);
  const formattedDate = parseDate(appointment.date).toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  function handleStatusChange(
    action: "confirm" | "complete" | "cancel" | "no_show",
  ) {
    setServerError(null);
    startTransition(async () => {
      let result: { success: boolean; error?: string } | undefined;

      switch (action) {
        case "confirm":
          result = await confirmAppointment({
            appointmentId: appointment.id,
            beautyPageId,
            nickname,
          });
          break;
        case "complete":
          result = await completeAppointment({
            appointmentId: appointment.id,
            beautyPageId,
            nickname,
          });
          break;
        case "cancel":
          result = await cancelAppointment({
            appointmentId: appointment.id,
            beautyPageId,
            nickname,
          });
          break;
        case "no_show":
          result = await markNoShow({
            appointmentId: appointment.id,
            beautyPageId,
            nickname,
          });
          break;
      }

      if (result?.success) {
        router.refresh();
        onClose();
      } else {
        setServerError(result?.error ?? "An error occurred");
      }
    });
  }

  // Determine available actions based on current status
  const availableActions = {
    pending: ["confirm", "cancel"] as const,
    confirmed: ["complete", "cancel", "no_show"] as const,
    completed: [] as const,
    cancelled: [] as const,
    no_show: [] as const,
  }[appointment.status];

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal open={open} size="lg">
        <Dialog.Header onClose={onClose}>Appointment Details</Dialog.Header>

        <Dialog.Body className="space-y-6">
          {/* Status badge */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusColors.bg} ${statusColors.text}`}
            >
              {appointment.status.charAt(0).toUpperCase() +
                appointment.status.slice(1).replace("_", " ")}
            </span>
          </div>

          {/* Client info */}
          <div className="rounded-lg bg-surface p-4">
            <h3 className="mb-3 font-medium">Client</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted" />
                <span>{appointment.client_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted" />
                <span>{appointment.client_phone}</span>
              </div>
              {appointment.client_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted" />
                  <span>{appointment.client_email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Service & Time */}
          <div className="rounded-lg bg-surface p-4">
            <h3 className="mb-3 font-medium">Service</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Scissors className="h-4 w-4 text-muted" />
                <span>{appointment.service_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted" />
                <span>
                  {normalizeTime(appointment.start_time)} -{" "}
                  {normalizeTime(appointment.end_time)}
                </span>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between rounded-lg bg-surface p-4">
            <span className="font-medium">Total</span>
            <span className="text-lg font-semibold">
              {appointment.service_currency} {appointment.service_price}
            </span>
          </div>

          {/* Notes */}
          {(appointment.client_notes || appointment.specialist_notes) && (
            <div className="rounded-lg bg-surface p-4">
              <h3 className="mb-3 font-medium">Notes</h3>
              {appointment.client_notes && (
                <div className="mb-2">
                  <p className="text-xs text-muted">Client note:</p>
                  <p className="text-sm">{appointment.client_notes}</p>
                </div>
              )}
              {appointment.specialist_notes && (
                <div>
                  <p className="text-xs text-muted">Specialist note:</p>
                  <p className="text-sm">{appointment.specialist_notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {serverError && <p className="text-sm text-danger">{serverError}</p>}
        </Dialog.Body>

        {canManage && availableActions.length > 0 && (
          <Dialog.Footer>
            <div className="flex flex-wrap gap-2">
              {availableActions.includes("confirm" as never) && (
                <Button
                  onClick={() => handleStatusChange("confirm")}
                  disabled={isPending}
                >
                  Confirm
                </Button>
              )}
              {availableActions.includes("complete" as never) && (
                <Button
                  onClick={() => handleStatusChange("complete")}
                  disabled={isPending}
                >
                  Mark Complete
                </Button>
              )}
              {availableActions.includes("no_show" as never) && (
                <Button
                  variant="secondary"
                  onClick={() => handleStatusChange("no_show")}
                  disabled={isPending}
                >
                  No Show
                </Button>
              )}
              {availableActions.includes("cancel" as never) && (
                <Button
                  variant="danger"
                  onClick={() => handleStatusChange("cancel")}
                  disabled={isPending}
                >
                  Cancel
                </Button>
              )}
            </div>
          </Dialog.Footer>
        )}
      </Dialog.Portal>
    </Dialog.Root>
  );
}
