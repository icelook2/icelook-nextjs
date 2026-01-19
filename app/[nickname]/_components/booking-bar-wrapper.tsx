"use client";

/**
 * Booking Bar Wrapper
 *
 * Wraps page content with ServiceSelectionProvider and BookingBar.
 * Hides the main navigation and shows booking bar when services are selected.
 */

import { type ReactNode, useEffect, useState } from "react";
import { useBottomNavVisibilityOptional } from "@/components/layout/bottom-nav-visibility-context";
import type { ProfileServiceGroup } from "@/lib/queries/beauty-page-profile";
import type { DurationLabels } from "@/lib/utils/price-range";
import type { CurrentUserProfile } from "./booking/_lib/booking-types";
import type { CreatorInfo } from "./booking/booking-context";
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

interface BookingBarWrapperProps {
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

export function BookingBarWrapper({
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
}: BookingBarWrapperProps) {
  return (
    <ServiceSelectionProvider>
      <BookingBarContent
        beautyPageId={beautyPageId}
        nickname={nickname}
        timezone={timezone}
        currency={currency}
        locale={locale}
        currentUserId={currentUserId}
        currentUserProfile={currentUserProfile}
        beautyPageInfo={beautyPageInfo}
        creatorInfo={creatorInfo}
        durationLabels={durationLabels}
        translations={translations}
      >
        {children}
      </BookingBarContent>
    </ServiceSelectionProvider>
  );
}

// ============================================================================
// Content Component (uses context)
// ============================================================================

interface BookingBarContentProps {
  children: ReactNode;
  beautyPageId: string;
  nickname: string;
  timezone: string;
  currency: string;
  locale: string;
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

function BookingBarContent({
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
}: BookingBarContentProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { selectedServices, totalPriceCents, totalDurationMinutes } =
    useServiceSelection();

  // Hide/show bottom nav based on selection
  const bottomNavVisibility = useBottomNavVisibilityOptional();
  const hasSelection = selectedServices.length > 0;

  // Hide bottom nav when services are selected, show booking bar instead
  useEffect(() => {
    if (!bottomNavVisibility) {
      return;
    }

    if (hasSelection) {
      bottomNavVisibility.hide();
    } else {
      bottomNavVisibility.show();
    }
  }, [bottomNavVisibility, hasSelection]);

  // Show bottom nav when leaving the page
  useEffect(() => {
    return () => {
      bottomNavVisibility?.show();
    };
  }, [bottomNavVisibility]);

  const handleBookClick = () => {
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
  };

  return (
    <>
      {/* Booking bar replaces bottom nav when services are selected */}
      {hasSelection && (
        <BookingBar
          currency={currency}
          locale={locale}
          durationLabels={durationLabels}
          translations={translations.bookingBar}
          onBookClick={handleBookClick}
        />
      )}

      {/* Page content */}
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
