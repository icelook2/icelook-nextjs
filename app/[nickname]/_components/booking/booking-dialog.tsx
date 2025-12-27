"use client";

/**
 * Booking Dialog
 *
 * Main container for the multi-step booking flow.
 * Manages step navigation and renders appropriate step components.
 */

import { ChevronLeft, X } from "lucide-react";
import { useCallback } from "react";
import type { ProfileService } from "@/lib/queries/beauty-page-profile";
import { Dialog } from "@/lib/ui/dialog";
import { BookingProvider, useBooking } from "./booking-context";
import { StepConfirmation } from "./step-confirmation";
import { StepDateSelect } from "./step-date-select";
import { StepSpecialistSelect } from "./step-specialist-select";
import { StepSuccess } from "./step-success";
import { StepTimeSelect } from "./step-time-select";
import type { AvailableSpecialist, BookingStep } from "./_lib/booking-types";

// ============================================================================
// Types
// ============================================================================

export interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  beautyPageId: string;
  nickname: string;
  timezone: string;
  currency: string;
  locale: string;
  selectedServices: ProfileService[];
  availableSpecialists: AvailableSpecialist[];
  currentUserId?: string;
  translations: BookingDialogTranslations;
  durationLabels: {
    min: string;
    hour: string;
  };
}

export interface BookingDialogTranslations {
  dialogTitle: string;
  steps: {
    specialist: {
      title: string;
      subtitle: string;
    };
    date: {
      title: string;
      subtitle: string;
      monthNames: string[];
      weekdayNames: string[];
      today: string;
      loading: string;
      noAvailability: string;
    };
    time: {
      title: string;
      subtitle: string;
      loading: string;
      noSlots: string;
      unavailable: string;
    };
    confirm: {
      title: string;
      subtitle: string;
      summary: {
        specialist: string;
        dateTime: string;
        services: string;
        total: string;
      };
      form: {
        name: string;
        namePlaceholder: string;
        phone: string;
        phonePlaceholder: string;
        email: string;
        emailPlaceholder: string;
        notes: string;
        notesPlaceholder: string;
      };
      validation: {
        nameTooShort: string;
        nameTooLong: string;
        phoneTooShort: string;
        phoneTooLong: string;
        phoneInvalidFormat: string;
        emailInvalid: string;
        notesTooLong: string;
      };
      submit: string;
      submitting: string;
    };
    success: {
      title: string;
      confirmedMessage: string;
      pendingMessage: string;
      appointmentId: string;
      summary: {
        specialist: string;
        dateTime: string;
        services: string;
      };
      done: string;
    };
  };
}

// ============================================================================
// Main Component
// ============================================================================

export function BookingDialog({
  open,
  onOpenChange,
  beautyPageId,
  nickname,
  timezone,
  currency,
  locale,
  selectedServices,
  availableSpecialists,
  currentUserId,
  translations,
  durationLabels,
}: BookingDialogProps) {
  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal open={open} size="md">
        <BookingProvider
          beautyPageId={beautyPageId}
          selectedServices={selectedServices}
          availableSpecialists={availableSpecialists}
          timezone={timezone}
          currency={currency}
          locale={locale}
          currentUserId={currentUserId}
          onClose={handleClose}
        >
          <BookingDialogContent
            translations={translations}
            durationLabels={durationLabels}
            onClose={handleClose}
          />
        </BookingProvider>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ============================================================================
// Dialog Content
// ============================================================================

interface BookingDialogContentProps {
  translations: BookingDialogTranslations;
  durationLabels: {
    min: string;
    hour: string;
  };
  onClose: () => void;
}

function BookingDialogContent({
  translations,
  durationLabels,
  onClose,
}: BookingDialogContentProps) {
  const { step, canGoBack, goBack } = useBooking();

  // Get step title for header
  const stepTitle = getStepTitle(step, translations);

  return (
    <div className="flex flex-col max-h-[85vh]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {canGoBack && step !== "success" && (
            <button
              type="button"
              onClick={goBack}
              className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {stepTitle}
          </h2>
        </div>

        {step !== "success" && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Step progress indicator */}
      {step !== "success" && (
        <StepProgressIndicator currentStep={step} />
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <StepContent
          step={step}
          translations={translations}
          durationLabels={durationLabels}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Step Progress Indicator
// ============================================================================

interface StepProgressIndicatorProps {
  currentStep: BookingStep;
}

function StepProgressIndicator({ currentStep }: StepProgressIndicatorProps) {
  const steps: BookingStep[] = ["date", "time", "confirm"];
  const currentIndex = steps.indexOf(currentStep);

  // Don't show for specialist step
  if (currentStep === "specialist") {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2 border-b border-gray-200 px-4 py-2 dark:border-gray-700">
      {steps.map((s, index) => (
        <div
          key={s}
          className={`h-1.5 flex-1 max-w-12 rounded-full transition-colors ${
            index <= currentIndex
              ? "bg-green-500"
              : "bg-gray-200 dark:bg-gray-700"
          }`}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Step Content Router
// ============================================================================

interface StepContentProps {
  step: BookingStep;
  translations: BookingDialogTranslations;
  durationLabels: {
    min: string;
    hour: string;
  };
  onClose: () => void;
}

function StepContent({
  step,
  translations,
  durationLabels,
  onClose,
}: StepContentProps) {
  switch (step) {
    case "specialist":
      return (
        <StepSpecialistSelect
          translations={translations.steps.specialist}
          durationLabels={durationLabels}
        />
      );

    case "date":
      return <StepDateSelect translations={translations.steps.date} />;

    case "time":
      return <StepTimeSelect translations={translations.steps.time} />;

    case "confirm":
      return (
        <StepConfirmation
          translations={translations.steps.confirm}
          durationLabels={durationLabels}
        />
      );

    case "success":
      return (
        <StepSuccess
          translations={translations.steps.success}
          durationLabels={durationLabels}
          onClose={onClose}
        />
      );

    default:
      return null;
  }
}

// ============================================================================
// Helpers
// ============================================================================

function getStepTitle(
  step: BookingStep,
  translations: BookingDialogTranslations,
): string {
  switch (step) {
    case "specialist":
      return translations.steps.specialist.title;
    case "date":
      return translations.steps.date.title;
    case "time":
      return translations.steps.time.title;
    case "confirm":
      return translations.steps.confirm.title;
    case "success":
      return translations.steps.success.title;
    default:
      return translations.dialogTitle;
  }
}
