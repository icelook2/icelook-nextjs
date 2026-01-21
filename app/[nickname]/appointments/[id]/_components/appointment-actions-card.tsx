"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  cancelAppointment,
  completeAppointment,
  confirmAppointment,
  markNoShow,
  startAppointmentEarly,
} from "@/app/[nickname]/appointments/_actions";
import type { Appointment } from "@/lib/queries/appointments";
import { Button } from "@/lib/ui/button";
import {
  ActionConfirmationDialog,
  type ActionConfirmationTranslations,
  type ActionType,
} from "./action-confirmation-dialog";
import {
  QuickRescheduleDialog,
  type QuickRescheduleTranslations,
} from "./quick-reschedule-dialog";

// Re-export types for parent components
export type { QuickRescheduleTranslations, ActionConfirmationTranslations };

interface AppointmentActionsCardProps {
  appointment: Appointment;
  beautyPageId: string;
  nickname: string;
  currentTime: Date;
  /** Translations for the reschedule dialog */
  rescheduleTranslations: QuickRescheduleTranslations;
  /** Translations for action confirmation dialogs */
  actionTranslations: ActionConfirmationTranslations;
}

export function AppointmentActionsCard({
  appointment,
  beautyPageId,
  nickname,
  currentTime,
  rescheduleTranslations,
  actionTranslations,
}: AppointmentActionsCardProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [isMarkingNoShow, setIsMarkingNoShow] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [confirmationDialog, setConfirmationDialog] = useState<{
    open: boolean;
    actionType: ActionType;
  }>({ open: false, actionType: "confirm" });

  const isPending = appointment.status === "pending";
  const isConfirmed = appointment.status === "confirmed";

  // Build full datetime strings for accurate comparison (date + time)
  const appointmentDate = appointment.date; // "YYYY-MM-DD"
  const todayStr = `${currentTime.getFullYear()}-${String(currentTime.getMonth() + 1).padStart(2, "0")}-${String(currentTime.getDate()).padStart(2, "0")}`;
  const currentTimeStr = `${currentTime.getHours().toString().padStart(2, "0")}:${currentTime.getMinutes().toString().padStart(2, "0")}`;

  // Determine if confirmed appointment is upcoming or active
  // Compare dates first, then times if same date
  const isFutureDate = appointmentDate > todayStr;
  const isSameDate = appointmentDate === todayStr;
  const isUpcoming =
    isConfirmed &&
    (isFutureDate || (isSameDate && currentTimeStr < appointment.start_time));
  const isActive =
    isConfirmed &&
    isSameDate &&
    currentTimeStr >= appointment.start_time &&
    currentTimeStr < appointment.end_time;

  // Past confirmed appointment - time has passed but not marked as complete/no-show
  // This happens when the appointment slot ended but specialist didn't update status
  const isPastConfirmed =
    isConfirmed &&
    !isUpcoming &&
    !isActive &&
    (appointmentDate < todayStr ||
      (isSameDate && currentTimeStr >= appointment.end_time));

  const isLoading =
    isConfirming ||
    isDeclining ||
    isMarkingNoShow ||
    isStarting ||
    isCompleting;
  const hasActions = isPending || isConfirmed;

  // Don't render if no actions available
  if (!hasActions) {
    return null;
  }

  // Open confirmation dialog for an action
  const openConfirmationDialog = (actionType: ActionType) => {
    setConfirmationDialog({ open: true, actionType });
  };

  const closeConfirmationDialog = () => {
    setConfirmationDialog((prev) => ({ ...prev, open: false }));
  };

  // Execute action after confirmation
  const executeConfirmedAction = async () => {
    const { actionType } = confirmationDialog;

    switch (actionType) {
      case "confirm":
        await handleConfirmAction();
        break;
      case "complete":
        await handleCompleteAction();
        break;
      case "cancel":
        await handleCancelAction();
        break;
      case "no_show":
        await handleNoShowAction();
        break;
    }
    closeConfirmationDialog();
  };

  const handleConfirmAction = async () => {
    setIsConfirming(true);
    try {
      const result = await confirmAppointment({
        appointmentId: appointment.id,
        beautyPageId,
        nickname,
      });
      if (result.success) {
        router.refresh();
      }
    } finally {
      setIsConfirming(false);
    }
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    try {
      const result = await cancelAppointment({
        appointmentId: appointment.id,
        beautyPageId,
        nickname,
      });
      if (result.success) {
        router.refresh();
      }
    } finally {
      setIsDeclining(false);
    }
  };

  const handleReschedule = () => {
    setIsRescheduleDialogOpen(true);
  };

  const handleCancelAction = async () => {
    setIsDeclining(true);
    try {
      const result = await cancelAppointment({
        appointmentId: appointment.id,
        beautyPageId,
        nickname,
      });
      if (result.success) {
        router.refresh();
      }
    } finally {
      setIsDeclining(false);
    }
  };

  const handleNoShowAction = async () => {
    setIsMarkingNoShow(true);
    try {
      const result = await markNoShow({
        appointmentId: appointment.id,
        beautyPageId,
        nickname,
      });
      if (result.success) {
        router.refresh();
      }
    } finally {
      setIsMarkingNoShow(false);
    }
  };

  const handleStart = async () => {
    setIsStarting(true);
    try {
      const result = await startAppointmentEarly({
        appointmentId: appointment.id,
        beautyPageId,
        nickname,
      });
      if (result.success) {
        router.refresh();
      }
    } finally {
      setIsStarting(false);
    }
  };

  const handleCompleteAction = async () => {
    setIsCompleting(true);
    try {
      const result = await completeAppointment({
        appointmentId: appointment.id,
        beautyPageId,
        nickname,
      });
      if (result.success) {
        router.refresh();
      }
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">Actions</h2>
      <div className="flex items-center gap-2">
        {/* Pending actions */}
        {isPending && (
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={() => openConfirmationDialog("confirm")}
              disabled={isLoading}
            >
              {isConfirming ? "Confirming..." : "Confirm"}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDecline}
              disabled={isLoading}
            >
              {isDeclining ? "Declining..." : "Decline"}
            </Button>
          </>
        )}

        {/* Upcoming confirmed - can start early */}
        {isUpcoming && (
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={handleStart}
              disabled={isLoading}
            >
              {isStarting ? "Starting..." : "Start"}
            </Button>
            <Button variant="secondary" size="sm" onClick={handleReschedule}>
              Reschedule
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => openConfirmationDialog("no_show")}
              disabled={isLoading}
            >
              {isMarkingNoShow ? "Marking..." : "No-show"}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => openConfirmationDialog("cancel")}
              disabled={isLoading}
            >
              {isDeclining ? "Cancelling..." : "Cancel"}
            </Button>
          </>
        )}

        {/* Active appointment - can complete early */}
        {isActive && (
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={() => openConfirmationDialog("complete")}
              disabled={isLoading}
            >
              {isCompleting ? "Completing..." : "Complete"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => openConfirmationDialog("no_show")}
              disabled={isLoading}
            >
              {isMarkingNoShow ? "Marking..." : "No-show"}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => openConfirmationDialog("cancel")}
              disabled={isLoading}
            >
              {isDeclining ? "Cancelling..." : "Cancel"}
            </Button>
          </>
        )}

        {/* Past confirmed - need to finalize status */}
        {isPastConfirmed && (
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={() => openConfirmationDialog("complete")}
              disabled={isLoading}
            >
              {isCompleting ? "Completing..." : "Complete"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => openConfirmationDialog("no_show")}
              disabled={isLoading}
            >
              {isMarkingNoShow ? "Marking..." : "No-show"}
            </Button>
          </>
        )}
      </div>

      {/* Action Confirmation Dialog */}
      <ActionConfirmationDialog
        open={confirmationDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            closeConfirmationDialog();
          }
        }}
        onConfirm={executeConfirmedAction}
        actionType={confirmationDialog.actionType}
        clientName={appointment.client_name}
        isPending={isLoading}
        translations={actionTranslations}
      />

      {/* Reschedule Dialog */}
      <QuickRescheduleDialog
        appointment={isRescheduleDialogOpen ? appointment : null}
        beautyPageId={beautyPageId}
        nickname={nickname}
        onClose={() => setIsRescheduleDialogOpen(false)}
        onSuccess={() => router.refresh()}
        translations={rescheduleTranslations}
      />
    </section>
  );
}
