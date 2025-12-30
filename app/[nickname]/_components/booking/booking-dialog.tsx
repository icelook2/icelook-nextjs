"use client";

/**
 * Booking Dialog
 *
 * Main container for the multi-step booking flow.
 * Manages step navigation and renders appropriate step components.
 */

import { X } from "lucide-react";
import { useCallback } from "react";
import type { ProfileService } from "@/lib/queries/beauty-page-profile";
import { Dialog } from "@/lib/ui/dialog";
import {
  BookingProvider,
  useBooking,
  type BookingInitialState,
} from "./booking-context";
import { StepConfirmation } from "./step-confirmation";
import { StepDateSelect } from "./step-date-select";
import { StepSpecialistSelect } from "./step-specialist-select";
import { StepSuccess } from "./step-success";
import { StepTimeSelect } from "./step-time-select";
import type {
  AvailableSpecialist,
  BookingStep,
  CurrentUserProfile,
} from "./_lib/booking-types";

// ============================================================================
// Types
// ============================================================================

export interface BeautyPageInfo {
  name: string;
  avatarUrl: string | null;
  address: string | null;
}

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
  /** Profile info of authenticated user (name, email) */
  currentUserProfile?: CurrentUserProfile;
  translations: BookingDialogTranslations;
  beautyPageInfo: BeautyPageInfo;
  durationLabels: {
    min: string;
    hour: string;
  };
  /** Optional initial state for skipping to a specific step */
  initialState?: BookingInitialState;
}

export interface BookingDialogTranslations {
  dialogTitle: string;
  cancel: string;
  steps: {
    specialist: {
      title: string;
      subtitle: string;
      nextButton: string;
    };
    date: {
      title: string;
      subtitle: string;
      monthNames: string[];
      weekdayNames: string[];
      today: string;
      loading: string;
      noAvailability: string;
      nextButton: string;
    };
    time: {
      title: string;
      subtitle: string;
      loading: string;
      noSlots: string;
      morning: string;
      afternoon: string;
      evening: string;
      nextButton: string;
    };
    confirm: {
      title: string;
      subtitle: string;
      summary: {
        who: string;
        when: string;
        where: string;
        what: string;
        price: string;
        duration: string;
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
      viewAppointment: string;
      close: string;
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
  currentUserProfile,
  translations,
  beautyPageInfo,
  durationLabels,
  initialState,
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
          currentUserProfile={currentUserProfile}
          onClose={handleClose}
          initialState={initialState}
        >
          <BookingDialogContent
            translations={translations}
            beautyPageInfo={beautyPageInfo}
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
  beautyPageInfo: BeautyPageInfo;
  durationLabels: {
    min: string;
    hour: string;
  };
  onClose: () => void;
}

function BookingDialogContent({
  translations,
  beautyPageInfo,
  durationLabels,
  onClose,
}: BookingDialogContentProps) {
  const { step } = useBooking();

  return (
    <div className="flex max-h-[85vh] flex-col">
      {/* Header - only show for non-success steps */}
      {step !== "success" && (
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-lg font-semibold text-foreground">
            {translations.dialogTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <StepContent
          step={step}
          translations={translations}
          beautyPageInfo={beautyPageInfo}
          durationLabels={durationLabels}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Step Content Router
// ============================================================================

interface StepContentProps {
  step: BookingStep;
  translations: BookingDialogTranslations;
  beautyPageInfo: BeautyPageInfo;
  durationLabels: {
    min: string;
    hour: string;
  };
  onClose: () => void;
}

function StepContent({
  step,
  translations,
  beautyPageInfo,
  durationLabels,
  onClose,
}: StepContentProps) {
  switch (step) {
    case "specialist":
      return (
        <StepSpecialistSelect
          translations={translations.steps.specialist}
          cancelLabel={translations.cancel}
          durationLabels={durationLabels}
          onCancel={onClose}
        />
      );

    case "date":
      return (
        <StepDateSelect
          translations={translations.steps.date}
          cancelLabel={translations.cancel}
          onCancel={onClose}
        />
      );

    case "time":
      return (
        <StepTimeSelect
          translations={translations.steps.time}
          cancelLabel={translations.cancel}
          onCancel={onClose}
        />
      );

    case "confirm":
      return (
        <StepConfirmation
          translations={translations.steps.confirm}
          cancelLabel={translations.cancel}
          beautyPageInfo={beautyPageInfo}
          durationLabels={durationLabels}
          onCancel={onClose}
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
