"use client";

/**
 * Quick Booking Dialog
 *
 * Enables rebooking a service directly from the appointments page.
 * Fetches current service data and opens the booking flow.
 */

import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import type { ClientAppointment } from "@/lib/queries/appointments";
import type { ProfileService } from "@/lib/queries/beauty-page-profile";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import {
  BookingDialog,
  type BeautyPageInfo,
  type BookingDialogTranslations,
} from "@/app/[nickname]/_components/booking/booking-dialog";
import type { CreatorInfo } from "@/app/[nickname]/_components/booking/booking-context";
import type { CurrentUserProfile } from "@/app/[nickname]/_components/booking/_lib/booking-types";
import { getRebookingData } from "../_actions/rebooking.actions";
import type { RebookingData } from "@/lib/queries/services";

// ============================================================================
// Types
// ============================================================================

interface QuickBookingDialogProps {
  /** The appointment to rebook (from history) */
  appointment: ClientAppointment | null;
  /** Close the dialog */
  onClose: () => void;
  /** Current user info (from page server component) */
  currentUserId?: string;
  currentUserProfile?: CurrentUserProfile;
  /** Translations for the booking dialog */
  translations: QuickBookingTranslations;
}

export interface QuickBookingTranslations {
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
  /** Full booking dialog translations */
  bookingDialog: BookingDialogTranslations;
}

// ============================================================================
// Component
// ============================================================================

export function QuickBookingDialog({
  appointment,
  onClose,
  currentUserId,
  currentUserProfile,
  translations,
}: QuickBookingDialogProps) {
  const [rebookingData, setRebookingData] = useState<RebookingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Fetch service data when appointment changes
  useEffect(() => {
    if (!appointment?.service_id) {
      return;
    }

    setError(null);
    setRebookingData(null);

    startTransition(async () => {
      const data = await getRebookingData(appointment.service_id!);

      if (!data) {
        setError(translations.serviceUnavailable);
        return;
      }

      setRebookingData(data);
    });
  }, [appointment?.service_id, translations.serviceUnavailable]);

  const isOpen = !!appointment;

  // Handle close
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      // Reset state when closing
      setRebookingData(null);
      setError(null);
    }
  };

  // Build props for BookingDialog when data is available
  const getBookingDialogProps = () => {
    if (!rebookingData || !appointment) {
      return null;
    }

    const service: ProfileService = {
      id: rebookingData.service.id,
      name: rebookingData.service.name,
      price_cents: rebookingData.service.price_cents,
      duration_minutes: rebookingData.service.duration_minutes,
      display_order: rebookingData.service.display_order,
    };

    const beautyPageInfo: BeautyPageInfo = {
      name: rebookingData.beautyPage.name,
      avatarUrl: rebookingData.beautyPage.avatar_url,
      address: rebookingData.beautyPage.address,
    };

    const creatorInfo: CreatorInfo = {
      displayName: rebookingData.creator.display_name,
      avatarUrl: rebookingData.creator.avatar_url,
    };

    // Check if price changed - pass original price for comparison on confirm step
    const priceChanged =
      rebookingData.service.price_cents !== appointment.service_price_cents;

    return {
      service,
      beautyPageInfo,
      creatorInfo,
      beautyPageId: rebookingData.beautyPage.id,
      nickname: rebookingData.beautyPage.slug,
      timezone: rebookingData.beautyPage.timezone,
      currency: rebookingData.beautyPage.currency,
      locale: rebookingData.beautyPage.locale,
      // Only pass original price if it's different (for showing change on confirm step)
      originalPriceCents: priceChanged ? appointment.service_price_cents : undefined,
    };
  };

  const dialogProps = getBookingDialogProps();

  // Loading state
  if (isOpen && isPending) {
    return (
      <Dialog.Root open onOpenChange={handleOpenChange}>
        <Dialog.Portal open size="sm">
          <Dialog.Body className="flex flex-col items-center gap-4 text-center py-8">
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
          <Dialog.Body className="flex flex-col items-center gap-4 text-center py-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <p className="text-foreground font-medium">{error}</p>
            <Button variant="soft" onClick={onClose}>
              {translations.close}
            </Button>
          </Dialog.Body>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  // Ready state - show BookingDialog
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
        currentUserId={currentUserId}
        currentUserProfile={currentUserProfile}
        translations={translations.bookingDialog}
        beautyPageInfo={dialogProps.beautyPageInfo}
        creatorInfo={dialogProps.creatorInfo}
        durationLabels={translations.durationLabels}
        originalPriceCents={dialogProps.originalPriceCents}
      />
    );
  }

  return null;
}
