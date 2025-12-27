"use client";

/**
 * Services Section
 *
 * Displays service groups with collapsible cards.
 * Wraps content with ServiceSelectionProvider to enable
 * interactive service selection with specialist collision prevention.
 * Integrates BookingDialog for the complete booking flow.
 */

import { useCallback, useMemo, useState } from "react";
import type { ProfileServiceGroup } from "@/lib/queries/beauty-page-profile";
import type { DurationLabels } from "@/lib/utils/price-range";
import { BookingBar, type BookingBarTranslations } from "./booking-bar";
import {
  BookingDialog,
  type BookingDialogTranslations,
} from "./booking/booking-dialog";
import { ServiceGroupCard } from "./service-group-card";
import {
  ServiceSelectionProvider,
  useServiceSelection,
} from "./service-selection-context";

// ============================================================================
// Types
// ============================================================================

interface ServicesSectionProps {
  serviceGroups: ProfileServiceGroup[];
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  currency?: string;
  locale?: string;
  durationLabels: DurationLabels;
  bookingTranslations: BookingBarTranslations;
  bookingDialogTranslations: BookingDialogTranslations;
  /** Beauty page ID for creating bookings */
  beautyPageId: string;
  /** Nickname for display purposes */
  nickname: string;
  /** Timezone of the beauty page */
  timezone: string;
  /** Current user ID if authenticated */
  currentUserId?: string;
}

// ============================================================================
// Component
// ============================================================================

export function ServicesSection({
  serviceGroups,
  title,
  emptyTitle,
  emptyDescription,
  currency = "UAH",
  locale = "uk-UA",
  durationLabels,
  bookingTranslations,
  bookingDialogTranslations,
  beautyPageId,
  nickname,
  timezone,
  currentUserId,
}: ServicesSectionProps) {
  // Filter groups that have at least one service with assignments
  const groupsWithServices = serviceGroups.filter((group) =>
    group.services.some((s) => s.assignments.length > 0),
  );

  // Flatten all services for the selection provider
  const allServices = useMemo(
    () =>
      groupsWithServices.flatMap((group) =>
        group.services.filter((s) => s.assignments.length > 0),
      ),
    [groupsWithServices],
  );

  // Empty state - no provider needed
  if (groupsWithServices.length === 0) {
    return (
      <section>
        <h2 className="mb-3 text-base font-semibold">{title}</h2>
        <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
          <h3 className="font-semibold">{emptyTitle}</h3>
          <p className="mt-1 text-sm text-muted">{emptyDescription}</p>
        </div>
      </section>
    );
  }

  return (
    <ServiceSelectionProvider allServices={allServices}>
      <section>
        <h2 className="mb-3 text-base font-semibold">{title}</h2>
        <div className="space-y-3">
          {groupsWithServices.map((group, index) => (
            <ServiceGroupCard
              key={group.id}
              group={group}
              defaultOpen={index === 0}
              currency={currency}
              locale={locale}
              durationLabels={durationLabels}
            />
          ))}
        </div>
      </section>

      {/* Booking bar and dialog */}
      <BookingIntegration
        currency={currency}
        locale={locale}
        durationLabels={durationLabels}
        bookingTranslations={bookingTranslations}
        bookingDialogTranslations={bookingDialogTranslations}
        beautyPageId={beautyPageId}
        nickname={nickname}
        timezone={timezone}
        currentUserId={currentUserId}
      />
    </ServiceSelectionProvider>
  );
}

// ============================================================================
// Booking Integration
// ============================================================================

interface BookingIntegrationProps {
  currency: string;
  locale: string;
  durationLabels: DurationLabels;
  bookingTranslations: BookingBarTranslations;
  bookingDialogTranslations: BookingDialogTranslations;
  beautyPageId: string;
  nickname: string;
  timezone: string;
  currentUserId?: string;
}

/**
 * Internal component that uses the selection context for booking.
 * Manages dialog state and connects BookingBar to BookingDialog.
 */
function BookingIntegration({
  currency,
  locale,
  durationLabels,
  bookingTranslations,
  bookingDialogTranslations,
  beautyPageId,
  nickname,
  timezone,
  currentUserId,
}: BookingIntegrationProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const {
    selectedServices,
    availableSpecialists,
    clearSelection,
  } = useServiceSelection();

  const handleBookClick = useCallback(() => {
    if (selectedServices.length > 0) {
      setIsDialogOpen(true);
    }
  }, [selectedServices.length]);

  const handleDialogClose = useCallback(
    (open: boolean) => {
      setIsDialogOpen(open);
      if (!open) {
        // Clear selection when dialog closes
        clearSelection();
      }
    },
    [clearSelection],
  );

  return (
    <>
      {/* Floating booking bar */}
      <BookingBar
        currency={currency}
        locale={locale}
        durationLabels={durationLabels}
        translations={bookingTranslations}
        onBookClick={handleBookClick}
      />

      {/* Booking dialog */}
      <BookingDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        beautyPageId={beautyPageId}
        nickname={nickname}
        timezone={timezone}
        currency={currency}
        locale={locale}
        selectedServices={selectedServices}
        availableSpecialists={availableSpecialists}
        currentUserId={currentUserId}
        translations={bookingDialogTranslations}
        durationLabels={durationLabels}
      />
    </>
  );
}
