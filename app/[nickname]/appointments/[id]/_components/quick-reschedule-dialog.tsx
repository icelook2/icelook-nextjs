"use client";

/**
 * Quick Reschedule Dialog
 *
 * Enables rescheduling an appointment to a new date/time.
 * Fetches current service data and opens the booking flow in reschedule mode.
 *
 * Key difference from rebooking: This updates an existing appointment
 * rather than creating a new one.
 */

import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import type { Appointment } from "@/lib/queries/appointments";
import type { ProfileService } from "@/lib/queries/beauty-page-profile";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import {
  BookingDialog,
  type BeautyPageInfo,
  type BookingDialogTranslations,
} from "@/app/[nickname]/_components/booking/booking-dialog";
import type {
  CreatorInfo,
  RescheduleData,
} from "@/app/[nickname]/_components/booking/booking-context";
import { getRescheduleData } from "../../_actions/reschedule.actions";
import type { RescheduleServiceData } from "../../_actions/reschedule.actions";

// ============================================================================
// Types
// ============================================================================

interface QuickRescheduleDialogProps {
  /** The appointment to reschedule */
  appointment: Appointment | null;
  /** Beauty page info */
  beautyPageId: string;
  nickname: string;
  /** Close the dialog */
  onClose: () => void;
  /** Called when reschedule is successful */
  onSuccess?: () => void;
  /** Translations for the dialog */
  translations: QuickRescheduleTranslations;
}

export interface QuickRescheduleTranslations {
  /** Error message when service is unavailable */
  serviceUnavailable: string;
  /** Error message when fetching fails */
  fetchError: string;
  /** Loading message */
  loading: string;
  /** Close button */
  close: string;
  /** Duration labels */
  durationLabels: {
    min: string;
    hour: string;
  };
  /** Full booking dialog translations (with reschedule-specific additions) */
  bookingDialog: BookingDialogTranslations;
}

// ============================================================================
// Component
// ============================================================================

export function QuickRescheduleDialog({
  appointment,
  beautyPageId,
  nickname,
  onClose,
  onSuccess,
  translations,
}: QuickRescheduleDialogProps) {
  const [rescheduleServiceData, setRescheduleServiceData] =
    useState<RescheduleServiceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [didSucceed, setDidSucceed] = useState(false);

  // Track the appointment ID we've fetched data for to avoid re-fetching
  // when the appointment object reference changes (e.g., after revalidatePath)
  const fetchedForAppointmentIdRef = useRef<string | null>(null);

  // Fetch service data when appointment changes
  useEffect(() => {
    if (!appointment) {
      // Dialog closed - reset tracking so we fetch fresh data next time
      fetchedForAppointmentIdRef.current = null;
      return;
    }

    // Skip if reschedule already succeeded - we're showing the success step
    // and don't want to reset the dialog state when revalidatePath triggers
    if (didSucceed) {
      return;
    }

    // Skip if we already have data for this appointment
    // This prevents re-fetching when revalidatePath updates the appointment object
    if (
      fetchedForAppointmentIdRef.current === appointment.id &&
      rescheduleServiceData
    ) {
      return;
    }

    // Get the first service from appointment_services
    const firstService = appointment.appointment_services?.[0];
    const serviceId = firstService?.service_id;
    if (!serviceId) {
      setError(translations.serviceUnavailable);
      return;
    }

    setError(null);
    setRescheduleServiceData(null);
    fetchedForAppointmentIdRef.current = appointment.id;

    startTransition(async () => {
      const data = await getRescheduleData(serviceId);

      if (!data) {
        setError(translations.serviceUnavailable);
        return;
      }

      setRescheduleServiceData(data);
    });
  }, [appointment, didSucceed, rescheduleServiceData, translations.serviceUnavailable]);

  const isOpen = !!appointment;

  // Handle close
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // If reschedule succeeded, call onSuccess to refresh the page
      if (didSucceed) {
        onSuccess?.();
      }
      onClose();
      // Reset state when closing
      setRescheduleServiceData(null);
      setError(null);
      setDidSucceed(false);
    }
  };

  // Handle booking success (reschedule complete)
  // Note: Don't close the dialog here - let the success step show first.
  // The dialog will be closed when the user clicks "Close" on the success step,
  // which triggers handleOpenChange(false).
  const handleBookingSuccess = () => {
    setDidSucceed(true);
  };

  // Build props for BookingDialog when data is available
  const getBookingDialogProps = () => {
    if (!rescheduleServiceData || !appointment) {
      return null;
    }

    // Build service from appointment data (use actual booked values)
    const service: ProfileService = {
      id: rescheduleServiceData.service.id,
      name: appointment.service_name,
      price_cents: appointment.service_price_cents,
      duration_minutes: appointment.service_duration_minutes,
      display_order: 0,
    };

    const beautyPageInfo: BeautyPageInfo = {
      name: rescheduleServiceData.beautyPage.name,
      avatarUrl: rescheduleServiceData.beautyPage.avatar_url,
      address: rescheduleServiceData.beautyPage.address,
    };

    const creatorInfo: CreatorInfo = {
      displayName: rescheduleServiceData.creator.display_name,
      avatarUrl: rescheduleServiceData.creator.avatar_url,
    };

    // Build reschedule data for the booking provider
    const rescheduleData: RescheduleData = {
      appointmentId: appointment.id,
      nickname,
      clientName: appointment.client_name,
      originalDate: appointment.date,
      originalStartTime: appointment.start_time,
    };

    return {
      service,
      beautyPageInfo,
      creatorInfo,
      beautyPageId,
      nickname,
      timezone: rescheduleServiceData.beautyPage.timezone,
      currency: rescheduleServiceData.beautyPage.currency,
      locale: rescheduleServiceData.beautyPage.locale,
      rescheduleData,
    };
  };

  const dialogProps = getBookingDialogProps();

  // Loading state
  if (isOpen && isPending) {
    return (
      <Dialog.Root open onOpenChange={handleOpenChange}>
        <Dialog.Portal open size="sm">
          <Dialog.Body className="flex flex-col items-center gap-4 py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-foreground">{translations.loading}</p>
          </Dialog.Body>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  // Error state
  if (isOpen && error) {
    return (
      <Dialog.Root open onOpenChange={handleOpenChange}>
        <Dialog.Portal open size="sm">
          <Dialog.Body className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <p className="font-medium text-foreground">{error}</p>
            <Button variant="soft" onClick={onClose}>
              {translations.close}
            </Button>
          </Dialog.Body>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  // Ready state - show BookingDialog in reschedule mode
  if (isOpen && dialogProps) {
    return (
      <BookingDialog
        open={isOpen}
        onOpenChange={handleOpenChange}
        beautyPageId={dialogProps.beautyPageId}
        nickname={dialogProps.nickname}
        timezone={dialogProps.timezone}
        currency={dialogProps.currency}
        locale={dialogProps.locale}
        selectedServices={[dialogProps.service]}
        totalPriceCents={dialogProps.service.price_cents}
        totalDurationMinutes={dialogProps.service.duration_minutes}
        translations={translations.bookingDialog}
        beautyPageInfo={dialogProps.beautyPageInfo}
        creatorInfo={dialogProps.creatorInfo}
        durationLabels={translations.durationLabels}
        onBookingSuccess={handleBookingSuccess}
        rescheduleData={dialogProps.rescheduleData}
      />
    );
  }

  return null;
}
