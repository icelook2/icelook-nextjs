"use client";

/**
 * Quick Reschedule Dialog (Client-side)
 *
 * Enables rescheduling an appointment from the client's appointments page.
 * Fetches current service data and opens the booking flow in reschedule mode.
 */

import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import type {
  CreatorInfo,
  RescheduleData,
} from "@/app/[nickname]/_components/booking/_lib/booking-types";
import {
  type BeautyPageInfo,
  BookingDialog,
  type BookingDialogTranslations,
} from "@/app/[nickname]/_components/booking/booking-dialog";
import type { ClientAppointment } from "@/lib/queries/appointments";
import type { ProfileService } from "@/lib/queries/beauty-page-profile";
import type { RebookingData } from "@/lib/queries/services";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { getRebookingData } from "../_actions/rebooking.actions";

// ============================================================================
// Types
// ============================================================================

interface QuickRescheduleDialogProps {
  /** The appointment to reschedule */
  appointment: ClientAppointment | null;
  /** Client name for the reschedule (from the appointment) */
  clientName: string;
  /** Close the dialog */
  onClose: () => void;
  /** Called when reschedule is successful */
  onSuccess?: () => void;
  /** Translations for the reschedule dialog */
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
  clientName,
  onClose,
  onSuccess,
  translations,
}: QuickRescheduleDialogProps) {
  const [rescheduleData, setRescheduleData] = useState<RebookingData | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [didSucceed, setDidSucceed] = useState(false);

  // Track the appointment ID we've fetched data for to avoid re-fetching
  // when the appointment object reference changes (e.g., after revalidatePath)
  const fetchedForAppointmentIdRef = useRef<string | null>(null);

  // Fetch service data when dialog opens with a new appointment
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
      rescheduleData
    ) {
      return;
    }

    // Get service_id from appointment_services (first service)
    const firstService = appointment.appointment_services?.[0];
    const serviceId = firstService?.service_id || appointment.service_id;

    if (!serviceId) {
      setError(translations.serviceUnavailable);
      return;
    }

    setError(null);
    setRescheduleData(null);
    fetchedForAppointmentIdRef.current = appointment.id;

    startTransition(async () => {
      const data = await getRebookingData(serviceId);

      if (!data) {
        setError(translations.serviceUnavailable);
        return;
      }

      setRescheduleData(data);
    });
  }, [
    appointment,
    didSucceed,
    rescheduleData,
    translations.serviceUnavailable,
  ]);

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
      setRescheduleData(null);
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
    if (!rescheduleData || !appointment) {
      return null;
    }

    // Build service from appointment data (use actual booked values)
    const service: ProfileService = {
      id: rescheduleData.service.id,
      name: appointment.service_name,
      price_cents: appointment.service_price_cents,
      duration_minutes: appointment.service_duration_minutes,
      display_order: 0,
      available_from_time: rescheduleData.service.available_from_time ?? null,
      available_to_time: rescheduleData.service.available_to_time ?? null,
    };

    const beautyPageInfo: BeautyPageInfo = {
      name: rescheduleData.beautyPage.name,
      avatarUrl: rescheduleData.beautyPage.avatar_url,
      address: rescheduleData.beautyPage.address,
    };

    const creatorInfo: CreatorInfo = {
      displayName: rescheduleData.creator.display_name,
      avatarUrl: rescheduleData.creator.avatar_url,
    };

    // Build reschedule data for the booking provider
    const rescheduleDataObj: RescheduleData = {
      appointmentId: appointment.id,
      nickname: rescheduleData.beautyPage.slug,
      clientName: clientName,
      originalDate: appointment.date,
      originalStartTime: appointment.start_time,
    };

    return {
      service,
      beautyPageInfo,
      creatorInfo,
      beautyPageId: rescheduleData.beautyPage.id,
      nickname: rescheduleData.beautyPage.slug,
      timezone: rescheduleData.beautyPage.timezone,
      currency: rescheduleData.beautyPage.currency,
      locale: rescheduleData.beautyPage.locale,
      rescheduleData: rescheduleDataObj,
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
