"use client";

/**
 * Booking Bar Wrapper
 *
 * Wraps page content with ServiceSelectionProvider and BookingBar.
 * Hides the main navigation and shows booking bar when services are selected.
 *
 * Also provides a context for opening the booking dialog from anywhere
 * in the page (e.g., inline booking summaries in layout variants).
 */

import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { useBottomNavVisibilityOptional } from "@/components/layout/bottom-nav-visibility-context";
import type { ProfileServiceGroup } from "@/lib/queries/beauty-page-profile";
import type { PublicBundle } from "@/lib/types/bundles";
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
// Booking Action Context
// ============================================================================

interface BookingActionContextValue {
  /** Open the booking dialog */
  openBookingDialog: () => void;
}

const BookingActionContext = createContext<BookingActionContextValue | null>(null);

/**
 * Hook to access booking actions (e.g., open dialog).
 * Must be used within BookingBarWrapper.
 */
export function useBookingAction() {
  const context = useContext(BookingActionContext);
  if (!context) {
    throw new Error("useBookingAction must be used within BookingBarWrapper");
  }
  return context;
}

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

/** Snapshot of selection when dialog opens */
interface DialogSelectionSnapshot {
  services: typeof useServiceSelection extends () => {
    selectedServices: infer T;
  }
    ? T
    : never;
  bundle: PublicBundle | null;
  totalPriceCents: number;
  totalDurationMinutes: number;
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
  const [dialogSnapshot, setDialogSnapshot] =
    useState<DialogSelectionSnapshot | null>(null);
  const {
    selectedServices,
    selectedBundle,
    totalPriceCents,
    totalDurationMinutes,
    clearSelection,
  } = useServiceSelection();

  // Hide/show bottom nav based on selection
  const bottomNavVisibility = useBottomNavVisibilityOptional();
  const hasSelection = selectedServices.length > 0 || selectedBundle !== null;

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
    // Snapshot the current selection when opening the dialog
    setDialogSnapshot({
      services: selectedServices,
      bundle: selectedBundle,
      totalPriceCents,
      totalDurationMinutes,
    });
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      // Clear snapshot when dialog closes
      setDialogSnapshot(null);
    }
  };

  const handleBookingSuccess = () => {
    // Clear the page selection when booking succeeds
    clearSelection();
  };

  const bookingActionValue: BookingActionContextValue = {
    openBookingDialog: handleBookClick,
  };

  return (
    <BookingActionContext.Provider value={bookingActionValue}>
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

      {/* Booking dialog - uses snapshot of selection taken when opened */}
      {dialogSnapshot && (
        <BookingDialog
          open={isDialogOpen}
          onOpenChange={handleDialogClose}
          beautyPageId={beautyPageId}
          nickname={nickname}
          timezone={timezone}
          currency={currency}
          locale={locale}
          selectedServices={dialogSnapshot.services}
          selectedBundle={dialogSnapshot.bundle}
          totalPriceCents={dialogSnapshot.totalPriceCents}
          totalDurationMinutes={dialogSnapshot.totalDurationMinutes}
          currentUserId={currentUserId}
          currentUserProfile={currentUserProfile}
          translations={translations.bookingDialog}
          beautyPageInfo={beautyPageInfo}
          creatorInfo={creatorInfo}
          durationLabels={durationLabels}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
    </BookingActionContext.Provider>
  );
}
