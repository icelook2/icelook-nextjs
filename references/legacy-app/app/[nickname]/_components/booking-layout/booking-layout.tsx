"use client";

/**
 * Booking Layout (Solo Creator Model)
 *
 * Main container for the horizontal 3-column booking layout.
 * Columns: Services | Date & Time | Confirmation
 *
 * Key change from multi-specialist model:
 * - No specialist selection (creator IS the specialist)
 * - 3 columns instead of 4
 * - Price/duration directly on services
 *
 * Desktop (md+): 3-column grid layout
 * Mobile: Tab-based navigation between columns
 */

import { useState } from "react";
import type {
  ProfileService,
  ProfileServiceGroup,
  ProfileSpecialist,
} from "@/lib/queries/beauty-page-profile";
import { Tabs } from "@/lib/ui/tabs";
import type { DurationLabels } from "@/lib/utils/price-range";
import type { GuestInfoValidationMessages } from "../booking/_lib/booking-schemas";
import type { CurrentUserProfile } from "../booking/_lib/booking-types";
import {
  BookingLayoutProvider,
  useBookingLayout,
} from "./booking-layout-context";
import { BookingSummaryBar } from "./booking-summary-bar";
import { ConfirmationColumn } from "./confirmation-column";
import { DateTimeColumn } from "./date-time-column";
import { ServicesColumn } from "./services-column";

// ============================================================================
// Types
// ============================================================================

export interface BookingLayoutTranslations {
  services: {
    title: string;
  };
  dateTime: {
    title: string;
    selectServiceFirst: string;
    calendar: {
      monthNames: string[];
      weekdayNames: string[];
      today: string;
      noAvailability: string;
    };
    time: {
      morning: string;
      afternoon: string;
      evening: string;
      noSlots: string;
    };
  };
  confirmation: {
    title: string;
    services: string;
    dateTime: string;
    total: string;
    bookButton: string;
    selectServices: string;
    selectDateTime: string;
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
  validation: GuestInfoValidationMessages;
  success: {
    title: string;
    confirmedMessage: string;
    pendingMessage: string;
  };
  // Mobile tab labels (optional - falls back to column titles)
  tabs?: {
    services: string;
    dateTime: string;
    book: string;
  };
}

interface BookingLayoutProps {
  serviceGroups: ProfileServiceGroup[];
  /** The creator (single specialist) for this beauty page */
  specialists: ProfileSpecialist[];
  beautyPageId: string;
  timezone: string;
  translations: BookingLayoutTranslations;
  currency?: string;
  locale?: string;
  durationLabels: DurationLabels;
  currentUserId?: string;
  currentUserProfile?: CurrentUserProfile;
}

// ============================================================================
// Component
// ============================================================================

export function BookingLayout({
  serviceGroups,
  specialists,
  beautyPageId,
  timezone,
  translations,
  currency = "UAH",
  locale = "uk-UA",
  durationLabels,
  currentUserId,
  currentUserProfile,
}: BookingLayoutProps) {
  // Flatten all services for the context (React Compiler handles optimization)
  const allServices: ProfileService[] = [];
  for (const group of serviceGroups) {
    for (const service of group.services) {
      allServices.push(service);
    }
  }

  // Tab labels with fallbacks to column titles
  const tabLabels = {
    services: translations.tabs?.services ?? translations.services.title,
    dateTime: translations.tabs?.dateTime ?? translations.dateTime.title,
    book: translations.tabs?.book ?? translations.confirmation.title,
  };

  return (
    <BookingLayoutProvider
      allServices={allServices}
      allSpecialists={specialists}
      beautyPageId={beautyPageId}
      timezone={timezone}
    >
      {/* Desktop: 3-column layout */}
      <div className="hidden md:grid md:grid-cols-3 md:items-start md:gap-4 lg:gap-6">
        <ServicesColumn
          serviceGroups={serviceGroups}
          title={translations.services.title}
          currency={currency}
          locale={locale}
          durationLabels={durationLabels}
        />

        <DateTimeColumn
          title={translations.dateTime.title}
          translations={{
            selectServiceFirst: translations.dateTime.selectServiceFirst,
            calendar: translations.dateTime.calendar,
            time: translations.dateTime.time,
          }}
        />

        <ConfirmationColumn
          translations={translations.confirmation}
          formTranslations={translations.form}
          validationTranslations={translations.validation}
          successTranslations={translations.success}
          currency={currency}
          locale={locale}
          durationLabels={durationLabels}
          beautyPageId={beautyPageId}
          timezone={timezone}
          currentUserId={currentUserId}
          currentUserProfile={currentUserProfile}
        />
      </div>

      {/* Mobile: Tab-based layout */}
      <MobileBookingTabs
        serviceGroups={serviceGroups}
        translations={translations}
        tabLabels={tabLabels}
        currency={currency}
        locale={locale}
        durationLabels={durationLabels}
        beautyPageId={beautyPageId}
        timezone={timezone}
        currentUserId={currentUserId}
        currentUserProfile={currentUserProfile}
      />
    </BookingLayoutProvider>
  );
}

// ============================================================================
// Mobile Tabs Component
// ============================================================================

type TabValue = "services" | "dateTime" | "book";

interface MobileBookingTabsProps {
  serviceGroups: ProfileServiceGroup[];
  translations: BookingLayoutTranslations;
  tabLabels: {
    services: string;
    dateTime: string;
    book: string;
  };
  currency: string;
  locale: string;
  durationLabels: DurationLabels;
  beautyPageId: string;
  timezone: string;
  currentUserId?: string;
  currentUserProfile?: CurrentUserProfile;
}

function MobileBookingTabs({
  serviceGroups,
  translations,
  tabLabels,
  currency,
  locale,
  durationLabels,
  beautyPageId,
  timezone,
  currentUserId,
  currentUserProfile,
}: MobileBookingTabsProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("services");
  const { selectedServiceIds, selectedDate, selectedTime } = useBookingLayout();

  // Calculate progress indicators
  const hasServices = selectedServiceIds.size > 0;
  const hasDateTime = !!selectedDate && !!selectedTime;

  return (
    <div className="md:hidden">
      <Tabs.Root
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabValue)}
      >
        {/* Sticky tab bar */}
        <div className="sticky top-0 bg-background pb-4">
          <Tabs.List className="grid grid-cols-3">
            <Tabs.Tab value="services" className="relative text-xs">
              {tabLabels.services}
              {hasServices && (
                <span className="absolute -top-1 right-1 h-2 w-2 rounded-full bg-accent" />
              )}
            </Tabs.Tab>
            <Tabs.Tab value="dateTime" className="relative text-xs">
              {tabLabels.dateTime}
              {hasDateTime && (
                <span className="absolute -top-1 right-1 h-2 w-2 rounded-full bg-accent" />
              )}
            </Tabs.Tab>
            <Tabs.Tab value="book" className="text-xs">
              {tabLabels.book}
            </Tabs.Tab>
          </Tabs.List>
        </div>

        {/* Tab panels */}
        <Tabs.Panel value="services" className="mt-0">
          <ServicesColumn
            serviceGroups={serviceGroups}
            title=""
            currency={currency}
            locale={locale}
            durationLabels={durationLabels}
          />
        </Tabs.Panel>

        <Tabs.Panel value="dateTime" className="mt-0">
          <DateTimeColumn
            title=""
            translations={{
              selectServiceFirst: translations.dateTime.selectServiceFirst,
              calendar: translations.dateTime.calendar,
              time: translations.dateTime.time,
            }}
          />
        </Tabs.Panel>

        <Tabs.Panel value="book" className="mt-0">
          <ConfirmationColumn
            translations={translations.confirmation}
            formTranslations={translations.form}
            validationTranslations={translations.validation}
            successTranslations={translations.success}
            currency={currency}
            locale={locale}
            durationLabels={durationLabels}
            beautyPageId={beautyPageId}
            timezone={timezone}
            currentUserId={currentUserId}
            currentUserProfile={currentUserProfile}
          />
        </Tabs.Panel>
      </Tabs.Root>

      {/* Summary bar - visible when not on book tab */}
      {activeTab !== "book" && (
        <BookingSummaryBar
          currency={currency}
          locale={locale}
          durationLabels={durationLabels}
          onBookClick={() => setActiveTab("book")}
          bookLabel={translations.confirmation.bookButton}
        />
      )}
    </div>
  );
}
