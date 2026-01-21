"use client";

/**
 * Booking Dialog (Solo Creator Model)
 *
 * Main container for the multi-step booking flow.
 * Simplified - no specialist selection step.
 *
 * Flow: date → time → confirm → success
 */

import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import type { ProfileService } from "@/lib/queries/beauty-page-profile";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import type { BookingStep, CurrentUserProfile } from "./_lib/booking-types";
import {
  BookingProvider,
  type CreatorInfo,
  type RescheduleData,
  useBooking,
} from "./booking-context";
import { StepConfirmation } from "./step-confirmation";
import { StepDateSelect } from "./step-date-select";
import { StepSuccess } from "./step-success";
import { StepTimeSelect } from "./step-time-select";

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
  totalPriceCents: number;
  totalDurationMinutes: number;
  currentUserId?: string;
  currentUserProfile?: CurrentUserProfile;
  translations: BookingDialogTranslations;
  beautyPageInfo: BeautyPageInfo;
  creatorInfo: CreatorInfo;
  durationLabels: {
    min: string;
    hour: string;
  };
  /** Called when booking is successfully completed */
  onBookingSuccess?: () => void;
  /** Original price from a previous booking (for rebooking flow when price changed) */
  originalPriceCents?: number;
  /** Reschedule mode data - when set, we're rescheduling an existing appointment */
  rescheduleData?: RescheduleData;
}

export interface BookingDialogTranslations {
  dialogTitle: string;
  /** Title shown when in reschedule mode */
  rescheduleDialogTitle?: string;
  cancel: string;
  steps: {
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
      visitPreferences: {
        title: string;
        subtitle: string;
        communicationLabel: string;
        communicationQuiet: string;
        communicationFriendly: string;
        communicationChatty: string;
        accessibilityLabel: string;
        accessibilityWheelchair: string;
        accessibilityHearing: string;
        accessibilityVision: string;
        accessibilitySensory: string;
        allergiesLabel: string;
        allergiesPlaceholder: string;
      };
      submit: string;
      submitting: string;
      /** Notice shown when price differs from original booking (rebooking flow) */
      priceChangedNotice: string;
    };
    success: {
      title: string;
      confirmedMessage: string;
      pendingMessage: string;
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
  timezone,
  currency,
  locale,
  selectedServices,
  totalPriceCents,
  totalDurationMinutes,
  currentUserId,
  currentUserProfile,
  translations,
  beautyPageInfo,
  creatorInfo,
  durationLabels,
  onBookingSuccess,
  originalPriceCents,
  rescheduleData,
}: BookingDialogProps) {
  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal open={open} size="md">
        <BookingProvider
          beautyPageId={beautyPageId}
          selectedServices={selectedServices}
          totalPriceCents={totalPriceCents}
          totalDurationMinutes={totalDurationMinutes}
          timezone={timezone}
          currency={currency}
          locale={locale}
          currentUserId={currentUserId}
          currentUserProfile={currentUserProfile}
          creatorInfo={creatorInfo}
          onBookingSuccess={onBookingSuccess}
          originalPriceCents={originalPriceCents}
          rescheduleData={rescheduleData}
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
  const {
    step,
    canGoBack,
    goBack,
    date,
    isSubmitting,
    isConfirmFormReady,
    isRescheduleMode,
  } = useBooking();

  // Determine dialog title based on mode
  const dialogTitle = isRescheduleMode
    ? (translations.rescheduleDialogTitle ?? translations.dialogTitle)
    : translations.dialogTitle;

  // Format date for subtitle (shown on time and confirm steps)
  const formattedDate = useMemo(() => {
    if (!date) {
      return "";
    }
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }, [date]);

  // Show subtitle on time and confirm steps
  const showSubtitle = step === "time" || step === "confirm";

  return (
    <>
      {/* Header - only show for non-success steps */}
      {step !== "success" && (
        <Dialog.Header
          subtitle={showSubtitle ? formattedDate : undefined}
          onClose={onClose}
          onBack={canGoBack ? goBack : undefined}
          showBackButton={canGoBack}
          showCloseButton
          className="border-b-0"
        >
          {dialogTitle}
        </Dialog.Header>
      )}

      {/* Content */}
      <Dialog.Body className="p-0">
        <StepContent
          step={step}
          translations={translations}
          beautyPageInfo={beautyPageInfo}
          durationLabels={durationLabels}
          onClose={onClose}
        />
      </Dialog.Body>

      {/* Sticky Footer - only show for confirm step */}
      {step === "confirm" && (
        <Dialog.Footer className="justify-end">
          <Button
            type="submit"
            form="booking-form"
            disabled={!isConfirmFormReady || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {translations.steps.confirm.submitting}
              </>
            ) : (
              translations.steps.confirm.submit
            )}
          </Button>
        </Dialog.Footer>
      )}
    </>
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
    case "date":
      return <StepDateSelect translations={translations.steps.date} />;

    case "time":
      return <StepTimeSelect translations={translations.steps.time} />;

    case "confirm":
      return (
        <StepConfirmation
          translations={translations.steps.confirm}
          beautyPageInfo={beautyPageInfo}
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
