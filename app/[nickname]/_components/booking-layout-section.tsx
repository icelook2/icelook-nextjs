"use client";

/**
 * Booking Layout Section
 *
 * Desktop-only 4-column booking layout.
 * Booking is handled directly within the ConfirmationColumn.
 */

import type {
  ProfileServiceGroup,
  ProfileSpecialist,
} from "@/lib/queries/beauty-page-profile";
import type { DurationLabels } from "@/lib/utils/price-range";
import type { CurrentUserProfile } from "./booking/_lib/booking-types";
import {
  BookingLayout,
  type BookingLayoutTranslations,
} from "./booking-layout";

// ============================================================================
// Types
// ============================================================================

export interface BookingLayoutSectionProps {
  serviceGroups: ProfileServiceGroup[];
  specialists: ProfileSpecialist[];
  beautyPageId: string;
  nickname: string;
  timezone: string;
  currency?: string;
  locale?: string;
  durationLabels: DurationLabels;
  layoutTranslations: BookingLayoutTranslations;
  currentUserId?: string;
  currentUserProfile?: CurrentUserProfile;
}

// ============================================================================
// Component
// ============================================================================

export function BookingLayoutSection({
  serviceGroups,
  specialists,
  beautyPageId,
  timezone,
  currency = "UAH",
  locale = "uk-UA",
  durationLabels,
  layoutTranslations,
  currentUserId,
  currentUserProfile,
}: BookingLayoutSectionProps) {
  return (
    <BookingLayout
      serviceGroups={serviceGroups}
      specialists={specialists}
      beautyPageId={beautyPageId}
      timezone={timezone}
      translations={layoutTranslations}
      currency={currency}
      locale={locale}
      durationLabels={durationLabels}
      currentUserId={currentUserId}
      currentUserProfile={currentUserProfile}
    />
  );
}
