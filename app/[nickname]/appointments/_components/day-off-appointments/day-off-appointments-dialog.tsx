"use client";

/**
 * Day Off Appointments Dialog
 *
 * Multi-step dialog for handling appointments when marking a day as day off.
 *
 * Steps:
 * 1. Appointments List - Shows all appointments with reschedule/cancel options
 * 2. Reschedule Date - Date picker for new date
 * 3. Reschedule Time - Time picker for new time
 * 4. Cancel Confirm - Cancel confirmation with optional reason
 *
 * All changes are staged locally and executed atomically when
 * "Mark Day Off" is clicked.
 */

import { format } from "date-fns";
import { enUS, uk } from "date-fns/locale";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button, buttonVariants } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { cn } from "@/lib/utils/cn";
import type { DayOffAppointment } from "../../_actions/working-day.actions";
import {
  DayOffAppointmentsProvider,
  useDayOffAppointments,
  type DayOffStep,
  type WorkingDayOption,
} from "./day-off-appointments-context";
import { StepAppointmentsList } from "./step-appointments-list";
import { StepRescheduleDate } from "./step-reschedule-date";
import { StepRescheduleTime } from "./step-reschedule-time";
import { StepCancelConfirm } from "./step-cancel-confirm";

const localeMap = { en: enUS, uk } as const;

interface DayOffAppointmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workingDayId: string;
  workingDayDate: Date;
  beautyPageId: string;
  nickname: string;
  appointments: DayOffAppointment[];
  /** Working days for rescheduling (excludes the day being marked off) */
  workingDays: WorkingDayOption[];
  onSuccess?: () => void;
}

/**
 * Main dialog for handling appointments when marking a day as day off
 */
export function DayOffAppointmentsDialog({
  open,
  onOpenChange,
  workingDayId,
  workingDayDate,
  beautyPageId,
  nickname,
  appointments,
  workingDays,
  onSuccess,
}: DayOffAppointmentsDialogProps) {
  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess?.();
  };

  const workingDayDateStr = format(workingDayDate, "yyyy-MM-dd");

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal open={open} size="lg">
        <DayOffAppointmentsProvider
          initialAppointments={appointments}
          workingDayId={workingDayId}
          workingDayDate={workingDayDateStr}
          beautyPageId={beautyPageId}
          nickname={nickname}
          workingDays={workingDays}
          onSuccess={handleSuccess}
        >
          <DayOffAppointmentsContent
            workingDayDate={workingDayDate}
            workingDays={workingDays}
          />
        </DayOffAppointmentsProvider>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ============================================================================
// Content Component (uses context)
// ============================================================================

interface DayOffAppointmentsContentProps {
  workingDayDate: Date;
  workingDays: WorkingDayOption[];
}

function DayOffAppointmentsContent({
  workingDayDate,
  workingDays,
}: DayOffAppointmentsContentProps) {
  const locale = useLocale();
  const t = useTranslations("creator_schedule.day_off_dialog");
  const dateFnsLocale = localeMap[locale as keyof typeof localeMap] ?? enUS;

  const {
    step,
    canGoBack,
    goBack,
    submitAllChanges,
    isSubmitting,
    error,
    totalCount,
  } = useDayOffAppointments();

  const formattedDate = format(workingDayDate, "d MMMM", {
    locale: dateFnsLocale,
  });

  const excludeDateStr = format(workingDayDate, "yyyy-MM-dd");

  // Get title based on current step
  const getStepTitle = (currentStep: DayOffStep): string => {
    switch (currentStep) {
      case "appointments":
        return t("title", { date: formattedDate });
      case "reschedule-date":
        return t("reschedule_date_title");
      case "reschedule-time":
        return t("reschedule_time_title");
      case "cancel-confirm":
        return t("cancel_confirm_title");
      default:
        return t("title", { date: formattedDate });
    }
  };

  // Get subtitle based on current step
  const getStepSubtitle = (currentStep: DayOffStep): string | undefined => {
    if (currentStep === "appointments") {
      return t("subtitle", { count: totalCount });
    }
    return undefined;
  };

  return (
    <>
      <Dialog.Header
        subtitle={getStepSubtitle(step)}
        onClose={canGoBack ? undefined : undefined} // Dialog has its own close
      >
        <div className="flex items-center gap-2">
          {canGoBack && (
            <button
              type="button"
              onClick={goBack}
              className="rounded-lg p-1 text-muted transition-colors hover:bg-surface-soft hover:text-foreground"
              disabled={isSubmitting}
            >
              <ArrowLeft className="size-5" />
            </button>
          )}
          <span>{getStepTitle(step)}</span>
        </div>
      </Dialog.Header>

      <Dialog.Body>
        {renderStepContent(step, workingDays, excludeDateStr)}

        {/* Error message */}
        {error && (
          <div className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-800 dark:bg-red-500/20 dark:text-red-300">
            {error}
          </div>
        )}
      </Dialog.Body>

      {/* Footer only on appointments step */}
      {step === "appointments" && (
        <Dialog.Footer className="justify-between">
          <Dialog.Close
            className={cn(buttonVariants({ variant: "soft" }))}
            disabled={isSubmitting}
          >
            {t("close")}
          </Dialog.Close>
          <Button
            variant="danger"
            onClick={submitAllChanges}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("marking")}
              </>
            ) : (
              t("mark_day_off")
            )}
          </Button>
        </Dialog.Footer>
      )}
    </>
  );
}

// ============================================================================
// Step Router
// ============================================================================

function renderStepContent(
  step: DayOffStep,
  workingDays: WorkingDayOption[],
  excludeDate: string,
) {
  switch (step) {
    case "appointments":
      return <StepAppointmentsList />;
    case "reschedule-date":
      return (
        <StepRescheduleDate
          workingDays={workingDays}
          excludeDate={excludeDate}
        />
      );
    case "reschedule-time":
      return <StepRescheduleTime workingDays={workingDays} />;
    case "cancel-confirm":
      return <StepCancelConfirm />;
    default:
      return null;
  }
}
