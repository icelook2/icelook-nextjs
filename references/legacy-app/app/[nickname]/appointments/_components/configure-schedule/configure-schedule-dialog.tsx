"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import {
  ConfigureScheduleProvider,
  useConfigureSchedule,
} from "./configure-schedule-context";
import { StepConfigureBreaks } from "./step-configure-breaks";
import { StepConfigureHours } from "./step-configure-hours";
import { StepConfirmation } from "./step-confirmation";
import { StepSelectDays } from "./step-select-days";

// ============================================================================
// Types
// ============================================================================

interface ConfigureScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingWorkingDates: Set<string>;
  beautyPageId: string;
  nickname: string;
}

// ============================================================================
// Main Dialog Component
// ============================================================================

/**
 * Multi-step dialog for configuring multiple working days at once
 *
 * Steps:
 * 1. Select days from calendar
 * 2. Configure hours for each weekday type
 * 3. Configure breaks (optional)
 * 4. Review and confirm
 */
export function ConfigureScheduleDialog({
  open,
  onOpenChange,
  existingWorkingDates,
  beautyPageId,
  nickname,
}: ConfigureScheduleDialogProps) {
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  const handleSuccess = () => {
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <ConfigureScheduleProvider
        beautyPageId={beautyPageId}
        nickname={nickname}
        existingWorkingDates={existingWorkingDates}
        onSuccess={handleSuccess}
      >
        <ConfigureScheduleDialogContent
          open={open}
          onClose={() => onOpenChange(false)}
        />
      </ConfigureScheduleProvider>
    </Dialog.Root>
  );
}

// ============================================================================
// Dialog Content (uses context)
// ============================================================================

interface ConfigureScheduleDialogContentProps {
  open: boolean;
  onClose: () => void;
}

function ConfigureScheduleDialogContent({
  open,
  onClose,
}: ConfigureScheduleDialogContentProps) {
  const t = useTranslations("creator_schedule.configure_schedule_dialog");

  const {
    step,
    goToStep,
    goBack,
    canGoBack,
    canProceed,
    totalSelectedDays,
    isSubmitting,
    submitSchedule,
    reset,
  } = useConfigureSchedule();

  // Step metadata
  const stepIndex = [
    "select-days",
    "configure-hours",
    "configure-breaks",
    "confirmation",
  ].indexOf(step);
  const totalSteps = 4;

  // Subtitle based on current step
  const subtitles: Record<string, string> = {
    "select-days": t("step_select.subtitle"),
    "configure-hours": t("step_hours.subtitle"),
    "configure-breaks": t("step_breaks.subtitle"),
    confirmation: t("step_confirm.subtitle"),
  };

  // Handle dialog close - reset state
  const handleClose = () => {
    reset();
    onClose();
  };

  // Handle continue to next step
  const handleContinue = () => {
    if (step === "select-days") {
      goToStep("configure-hours");
    } else if (step === "configure-hours") {
      goToStep("configure-breaks");
    } else if (step === "configure-breaks") {
      goToStep("confirmation");
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    await submitSchedule();
  };

  return (
    <Dialog.Portal open={open} size="md">
      <Dialog.Header
        subtitle={`${t("step_indicator", { current: stepIndex + 1, total: totalSteps })} · ${subtitles[step]}`}
        onClose={handleClose}
        onBack={canGoBack ? goBack : undefined}
        showBackButton={canGoBack}
      >
        {t("title")}
      </Dialog.Header>

      <Dialog.Body className="p-4">
        {step === "select-days" && <StepSelectDays />}
        {step === "configure-hours" && <StepConfigureHours />}
        {step === "configure-breaks" && <StepConfigureBreaks />}
        {step === "confirmation" && <StepConfirmation />}
      </Dialog.Body>

      <Dialog.Footer className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          variant="ghost"
          onClick={handleClose}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {t("cancel")}
        </Button>

        {step !== "confirmation" ? (
          <Button
            onClick={handleContinue}
            disabled={!canProceed}
            className="w-full sm:w-auto"
          >
            {t("continue")}
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting
              ? t("creating")
              : t("create", { count: totalSelectedDays })}
          </Button>
        )}
      </Dialog.Footer>
    </Dialog.Portal>
  );
}
