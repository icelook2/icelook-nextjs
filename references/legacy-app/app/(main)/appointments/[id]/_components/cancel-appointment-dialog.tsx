"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Enums } from "@/lib/supabase/database.types";
import { AlertDialog } from "@/lib/ui/alert-dialog";
import { Button } from "@/lib/ui/button";

type ClientCancellationReason = Enums<"client_cancellation_reason">;

const CANCELLATION_REASONS: ClientCancellationReason[] = [
  "changed_plans",
  "feeling_unwell",
  "other",
];

interface CancelAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: ClientCancellationReason) => void;
  specialistName: string;
  appointmentDate: string;
  isPending?: boolean;
}

export function CancelAppointmentDialog({
  open,
  onOpenChange,
  onConfirm,
  specialistName,
  appointmentDate,
  isPending = false,
}: CancelAppointmentDialogProps) {
  const t = useTranslations("appointments");
  const [selectedReason, setSelectedReason] =
    useState<ClientCancellationReason | null>(null);
  const [showError, setShowError] = useState(false);

  function handleReasonSelect(reason: ClientCancellationReason) {
    setSelectedReason(reason);
    setShowError(false);
  }

  function handleConfirm() {
    if (!selectedReason) {
      setShowError(true);
      return;
    }
    onConfirm(selectedReason);
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      // Reset state when closing
      setSelectedReason(null);
      setShowError(false);
    }
    onOpenChange(newOpen);
  }

  return (
    <AlertDialog.Root open={open} onOpenChange={handleOpenChange}>
      <AlertDialog.Portal open={open}>
        <AlertDialog.Title>{t("cancel_confirm_title")}</AlertDialog.Title>
        <AlertDialog.Description>
          {t("cancel_confirm_message", {
            specialist: specialistName,
            date: appointmentDate,
          })}
        </AlertDialog.Description>

        <div className="mt-4">
          <p className="mb-3 text-sm font-medium">
            {t("cancel_select_reason")}
          </p>

          <div className="flex flex-wrap gap-2">
            {CANCELLATION_REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => handleReasonSelect(reason)}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  selectedReason === reason
                    ? "bg-blue-500 text-white"
                    : "bg-muted/20 text-foreground"
                }`}
              >
                {t(`cancellation_reasons.${reason}`)}
              </button>
            ))}
          </div>

          {showError && (
            <p className="mt-2 text-sm text-danger">
              {t("cancel_reason_required")}
            </p>
          )}
        </div>

        <AlertDialog.Actions className="mt-6 flex-col gap-2 sm:flex-row">
          <Button
            variant="danger"
            onClick={handleConfirm}
            loading={isPending}
            disabled={isPending}
            className="w-full sm:order-2 sm:w-auto"
          >
            {t("cancel")}
          </Button>
          <AlertDialog.Close
            render={
              <Button
                variant="secondary"
                disabled={isPending}
                className="w-full sm:order-1 sm:w-auto"
              >
                {t("keep")}
              </Button>
            }
          />
        </AlertDialog.Actions>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
