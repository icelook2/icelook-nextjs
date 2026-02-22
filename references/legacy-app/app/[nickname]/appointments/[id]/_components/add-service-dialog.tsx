"use client";

import { AlertTriangle, Check, Loader2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import {
  addServiceToAppointment,
  checkServiceAdditionOverlap,
  type OverlapCheckResult,
} from "@/app/[nickname]/appointments/_actions";
import type { Appointment } from "@/lib/queries/appointments";
import type { ServiceGroupWithServices } from "@/lib/queries/services";
import { AlertDialog } from "@/lib/ui/alert-dialog";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { formatDuration } from "@/lib/utils/price-range";

interface AddServiceDialogProps {
  appointment: Appointment;
  beautyPageId: string;
  nickname: string;
  serviceGroups: ServiceGroupWithServices[];
}

type DialogStep = "select" | "overlap-warning";

export function AddServiceDialog({
  appointment,
  beautyPageId,
  nickname,
  serviceGroups,
}: AddServiceDialogProps) {
  const t = useTranslations("appointment_details");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<DialogStep>("select");
  const [isChecking, startCheckTransition] = useTransition();
  const [isAdding, startAddTransition] = useTransition();
  const [overlapData, setOverlapData] = useState<OverlapCheckResult | null>(
    null,
  );
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  // Get services already in this appointment to exclude them
  const existingServiceIds = new Set(
    appointment.appointment_services.map((s) => s.service_name),
  );

  const formatPrice = (cents: number) =>
    `${(cents / 100).toFixed(0)} ${appointment.service_currency}`;

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset state when closing
      setStep("select");
      setOverlapData(null);
      setSelectedServiceId(null);
      setError(null);
    }
  }

  function handleServiceSelect(serviceId: string) {
    setSelectedServiceId(serviceId);
    setError(null);

    startCheckTransition(async () => {
      const result = await checkServiceAdditionOverlap({
        appointmentId: appointment.id,
        beautyPageId,
        serviceId,
      });

      if (!result.success || !result.data) {
        setError(result.success ? "Unknown error" : result.error);
        return;
      }

      const data = result.data;

      if (data.wouldOverlap) {
        // Show overlap warning
        setOverlapData(data);
        setStep("overlap-warning");
      } else {
        // No overlap - add service silently with extended duration
        await handleAddService(serviceId, true);
      }
    });
  }

  async function handleAddService(serviceId: string, extendDuration: boolean) {
    startAddTransition(async () => {
      const result = await addServiceToAppointment({
        appointmentId: appointment.id,
        beautyPageId,
        nickname,
        serviceId,
        extendDuration,
      });

      if (result.success) {
        setOpen(false);
      } else {
        setError(result.error);
        // Go back to selection if there's an error
        setStep("select");
        setOverlapData(null);
      }
    });
  }

  function handleAddWithoutExtending() {
    if (selectedServiceId) {
      handleAddService(selectedServiceId, false);
    }
  }

  function handleAllowOverlap() {
    if (selectedServiceId) {
      handleAddService(selectedServiceId, true);
    }
  }

  function handleCancelOverlap() {
    setStep("select");
    setOverlapData(null);
    setSelectedServiceId(null);
  }

  const isPending = isChecking || isAdding;

  // Filter out services already in the appointment
  const availableGroups = serviceGroups
    .map((group) => ({
      ...group,
      services: group.services.filter((s) => !existingServiceIds.has(s.name)),
    }))
    .filter((group) => group.services.length > 0);

  return (
    <>
      <Dialog.Root open={open} onOpenChange={handleOpenChange}>
        {/* Trigger button - styled as a row */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-3 px-4 py-3 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          <Plus className="h-5 w-5" />
          <span className="text-sm font-medium">
            {t("services.add_service")}
          </span>
        </button>

        <Dialog.Portal open={open && step === "select"} size="md">
          <Dialog.Header onClose={() => setOpen(false)}>
            {t("services.add_service_title")}
          </Dialog.Header>
          <Dialog.Body className="max-h-96 overflow-y-auto p-0">
            {error && (
              <div className="border-b border-border bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            {availableGroups.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted">
                {t("services.no_services_available")}
              </div>
            ) : (
              availableGroups.map((group) => (
                <div key={group.id}>
                  {/* Group header */}
                  <div className="sticky top-0 bg-surface-secondary px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted">
                    {group.name}
                  </div>
                  {/* Services in group */}
                  {group.services.map((service) => {
                    const isSelected = selectedServiceId === service.id;
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => handleServiceSelect(service.id)}
                        disabled={isPending}
                        className="flex w-full items-center justify-between border-b border-border px-4 py-3 text-left hover:bg-surface-hover disabled:opacity-50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground">
                            {service.name}
                          </p>
                          <p className="mt-0.5 text-sm text-muted">
                            {formatDuration(service.duration_minutes)} ·{" "}
                            {formatPrice(service.price_cents)}
                          </p>
                        </div>
                        {isPending && isSelected && (
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </Dialog.Body>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Overlap Warning Dialog */}
      <AlertDialog.Root
        open={open && step === "overlap-warning"}
        onOpenChange={(newOpen) => {
          if (!newOpen) {
            handleCancelOverlap();
          }
        }}
      >
        <AlertDialog.Portal open={open && step === "overlap-warning"}>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <AlertDialog.Title>
                {t("overlap_warning.title")}
              </AlertDialog.Title>
              <AlertDialog.Description>
                {t("overlap_warning.message", {
                  serviceName: overlapData?.serviceName ?? "",
                  duration: overlapData?.serviceDuration ?? 0,
                  nextTime:
                    overlapData?.nextAppointment?.start_time.slice(0, 5) ?? "",
                })}
              </AlertDialog.Description>
            </div>
          </div>

          <AlertDialog.Actions className="mt-6 flex-col gap-2 sm:flex-row">
            <Button
              variant="secondary"
              onClick={handleCancelOverlap}
              disabled={isAdding}
              className="w-full sm:w-auto"
            >
              {t("overlap_warning.cancel")}
            </Button>
            <Button
              variant="secondary"
              onClick={handleAddWithoutExtending}
              loading={isAdding}
              className="w-full sm:w-auto"
            >
              <Check className="h-4 w-4" />
              {t("overlap_warning.add_without_extending")}
            </Button>
            <Button
              variant="primary"
              onClick={handleAllowOverlap}
              loading={isAdding}
              className="w-full sm:w-auto"
            >
              <AlertTriangle className="h-4 w-4" />
              {t("overlap_warning.allow_overlap")}
            </Button>
          </AlertDialog.Actions>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}
