"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Check, UserX, X } from "lucide-react";
import { Button } from "@/lib/ui/button";
import { Paper } from "@/lib/ui/paper";
import type { Appointment } from "@/lib/queries/appointments";
import {
  cancelAppointment,
  completeAppointment,
  confirmAppointment,
  markNoShow,
} from "../../../../settings/schedule/_actions/appointment.actions";

interface AppointmentActionsProps {
  appointment: Appointment;
  nickname: string;
  beautyPageId: string;
}

export function AppointmentActions({
  appointment,
  nickname,
  beautyPageId,
}: AppointmentActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await confirmAppointment({
        appointmentId: appointment.id,
        beautyPageId,
        nickname,
      });
      if (result.success) {
        router.refresh();
      }
    });
  };

  const handleDecline = () => {
    startTransition(async () => {
      const result = await cancelAppointment({
        appointmentId: appointment.id,
        beautyPageId,
        nickname,
        reason: "Declined by creator",
      });
      if (result.success) {
        router.refresh();
      }
    });
  };

  const handleComplete = () => {
    startTransition(async () => {
      const result = await completeAppointment({
        appointmentId: appointment.id,
        beautyPageId,
        nickname,
      });
      if (result.success) {
        router.refresh();
      }
    });
  };

  const handleNoShow = () => {
    startTransition(async () => {
      const result = await markNoShow({
        appointmentId: appointment.id,
        beautyPageId,
        nickname,
      });
      if (result.success) {
        router.refresh();
      }
    });
  };

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelAppointment({
        appointmentId: appointment.id,
        beautyPageId,
        nickname,
      });
      if (result.success) {
        router.refresh();
      }
    });
  };

  // Terminal states - no actions
  if (
    appointment.status === "completed" ||
    appointment.status === "cancelled" ||
    appointment.status === "no_show"
  ) {
    return null;
  }

  return (
    <Paper className="p-4">
      <h3 className="mb-3 text-sm font-medium text-muted">Actions</h3>

      {/* Pending: Confirm or Decline */}
      {appointment.status === "pending" && (
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={isPending}
            className="flex-1"
          >
            <Check className="mr-2 h-4 w-4" />
            {isPending ? "Confirming..." : "Confirm"}
          </Button>
          <Button
            variant="secondary"
            onClick={handleDecline}
            disabled={isPending}
            className="flex-1"
          >
            <X className="mr-2 h-4 w-4" />
            {isPending ? "Declining..." : "Decline"}
          </Button>
        </div>
      )}

      {/* Confirmed: Complete, No-Show, or Cancel */}
      {appointment.status === "confirmed" && (
        <div className="space-y-2">
          <Button
            variant="primary"
            onClick={handleComplete}
            disabled={isPending}
            className="w-full"
          >
            <Check className="mr-2 h-4 w-4" />
            {isPending ? "Completing..." : "Mark Complete"}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleNoShow}
              disabled={isPending}
              className="flex-1"
            >
              <UserX className="mr-2 h-4 w-4" />
              No-Show
            </Button>
            <Button
              variant="secondary"
              onClick={handleCancel}
              disabled={isPending}
              className="flex-1"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Paper>
  );
}
