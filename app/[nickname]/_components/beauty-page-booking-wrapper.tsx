"use client";

/**
 * Beauty Page Booking Wrapper
 *
 * Client component that wraps the beauty page content and provides
 * the booking flow functionality:
 * - Service selection context
 * - Booking bar (sticky on mobile, fixed drawer on desktop)
 * - Booking dialog
 */

import { type ReactNode, useState } from "react";
import type { ProfileServiceGroup } from "@/lib/queries/beauty-page-profile";
import type { DurationLabels } from "@/lib/utils/price-range";
import type {
  CreatorInfo,
  CurrentUserProfile,
} from "./booking/_lib/booking-types";
import {
  type BeautyPageInfo,
  BookingDialog,
  type BookingDialogTranslations,
} from "./booking/booking-dialog";
import { BookingBar, type BookingBarTranslations } from "./booking-bar";
import {
  ServiceSelectionProvider,
  useServiceSelection,
} from "./service-selection-context";

// ============================================================================
// Types
// ============================================================================

interface BeautyPageBookingWrapperProps {
  children: ReactNode;
  beautyPageId: string;
  nickname: string;
  timezone: string;
  currency: string;
  locale: string;
  serviceGroups: ProfileServiceGroup[];
  currentUserId?: string;
  currentUserProfile?: CurrentUserProfile;
  beautyPageInfo: BeautyPageInfo;
  creatorInfo: CreatorInfo;
  durationLabels: DurationLabels;
  translations: {
    bookingBar: BookingBarTranslations;
    bookingDialog: BookingDialogTranslations;
  };
}

// ============================================================================
// Wrapper Component
// ============================================================================

export function BeautyPageBookingWrapper({
  children,
  beautyPageId,
  nickname,
  timezone,
  currency,
  locale,
  serviceGroups,
  currentUserId,
  currentUserProfile,
  beautyPageInfo,
  creatorInfo,
  durationLabels,
  translations,
}: BeautyPageBookingWrapperProps) {
  return (
    <ServiceSelectionProvider>
      <BookingFlowManager
        beautyPageId={beautyPageId}
        nickname={nickname}
        timezone={timezone}
        currency={currency}
        locale={locale}
        serviceGroups={serviceGroups}
        currentUserId={currentUserId}
        currentUserProfile={currentUserProfile}
        beautyPageInfo={beautyPageInfo}
        creatorInfo={creatorInfo}
        durationLabels={durationLabels}
        translations={translations}
      >
        {children}
      </BookingFlowManager>
    </ServiceSelectionProvider>
  );
}

// ============================================================================
// Booking Flow Manager (uses the selection context)
// ============================================================================

interface BookingFlowManagerProps {
  children: ReactNode;
  beautyPageId: string;
  nickname: string;
  timezone: string;
  currency: string;
  locale: string;
  serviceGroups: ProfileServiceGroup[];
  currentUserId?: string;
  currentUserProfile?: CurrentUserProfile;
  beautyPageInfo: BeautyPageInfo;
  creatorInfo: CreatorInfo;
  durationLabels: DurationLabels;
  translations: {
    bookingBar: BookingBarTranslations;
    bookingDialog: BookingDialogTranslations;
  };
}

function BookingFlowManager({
  children,
  beautyPageId,
  nickname,
  timezone,
  currency,
  locale,
  currentUserId,
  currentUserProfile,
  beautyPageInfo,
  creatorInfo,
  durationLabels,
  translations,
}: BookingFlowManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { selectedServices, totalPriceCents, totalDurationMinutes } =
    useServiceSelection();

  const handleBookClick = () => {
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    // Clear selection when dialog closes after successful booking
    if (!open) {
      // Note: We might want to only clear on success, but for simplicity
      // we'll let the user re-select if they close without booking
    }
  };

  return (
    <>
      {/* Sticky booking bar (rendered first for sticky positioning on mobile) */}
      <BookingBar
        currency={currency}
        locale={locale}
        durationLabels={durationLabels}
        translations={translations.bookingBar}
        onBookClick={handleBookClick}
      />

      {children}

      {/* Booking dialog */}
      {selectedServices.length > 0 && (
        <BookingDialog
          open={isDialogOpen}
          onOpenChange={handleDialogClose}
          beautyPageId={beautyPageId}
          nickname={nickname}
          timezone={timezone}
          currency={currency}
          locale={locale}
          selectedServices={selectedServices}
          totalPriceCents={totalPriceCents}
          totalDurationMinutes={totalDurationMinutes}
          currentUserId={currentUserId}
          currentUserProfile={currentUserProfile}
          translations={translations.bookingDialog}
          beautyPageInfo={beautyPageInfo}
          creatorInfo={creatorInfo}
          durationLabels={durationLabels}
        />
      )}
    </>
  );
}
