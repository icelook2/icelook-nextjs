"use client";

/**
 * Confirmation Column (Solo Creator Model)
 *
 * 3rd column showing dynamic booking summary.
 * Updates in real-time as user makes selections.
 * Handles booking directly without opening a dialog.
 */

import { format } from "date-fns";
import { Calendar, Clock, Loader2, Scissors } from "lucide-react";
import { useState } from "react";
import { Button } from "@/lib/ui/button";
import {
  type DurationLabels,
  formatDuration,
  formatPrice,
} from "@/lib/utils/price-range";
import { createBooking } from "../booking/_actions/booking.actions";
import type {
  GuestInfoFormData,
  GuestInfoValidationMessages,
} from "../booking/_lib/booking-schemas";
import type {
  BookingResult,
  CurrentUserProfile,
} from "../booking/_lib/booking-types";
import { calculateEndTime } from "../booking/_lib/slot-generation";
import { useBookingLayout } from "./booking-layout-context";
import { BookingSuccessCard } from "./booking-success-card";
import { GuestBookingForm } from "./guest-booking-form";
import { SummaryRow } from "./summary-row";

// ============================================================================
// Types
// ============================================================================

interface ConfirmationColumnProps {
  translations: {
    title: string;
    services: string;
    dateTime: string;
    total: string;
    bookButton: string;
    selectServices: string;
    selectDateTime: string;
  };
  formTranslations: {
    name: string;
    namePlaceholder: string;
    phone: string;
    phonePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    notes: string;
    notesPlaceholder: string;
  };
  validationTranslations: GuestInfoValidationMessages;
  successTranslations: {
    title: string;
    confirmedMessage: string;
    pendingMessage: string;
  };
  currency?: string;
  locale?: string;
  durationLabels: DurationLabels;
  beautyPageId: string;
  timezone: string;
  currentUserId?: string;
  currentUserProfile?: CurrentUserProfile;
}

// ============================================================================
// Component
// ============================================================================

export function ConfirmationColumn({
  translations,
  formTranslations,
  validationTranslations,
  successTranslations,
  currency = "UAH",
  locale = "uk-UA",
  durationLabels,
  beautyPageId,
  currentUserId,
  currentUserProfile,
}: ConfirmationColumnProps) {
  const {
    isReadyToBook,
    selectedServiceIds,
    selectedDate,
    selectedTime,
    selectedServices,
    totalPriceCents,
    totalDurationMinutes,
    clearAll,
  } = useBookingLayout();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(
    null,
  );

  const isAuthenticated = !!currentUserProfile?.name;
  const formattedDuration = formatDuration(
    totalDurationMinutes,
    durationLabels,
  );
  const hasServices = selectedServices.length > 0;
  const hasDateTime = !!selectedDate && !!selectedTime;

  async function handleSubmit(formData?: GuestInfoFormData) {
    if (!isReadyToBook || !selectedDate || !selectedTime) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const endTime = calculateEndTime(selectedTime, totalDurationMinutes);
      const dateStr = format(selectedDate, "yyyy-MM-dd");

      const clientInfo = isAuthenticated
        ? {
            name: currentUserProfile?.name ?? "",
            email: currentUserProfile?.email || undefined,
          }
        : {
            name: formData?.name ?? "",
            phone: formData?.phone,
            email: formData?.email || undefined,
            notes: formData?.notes || undefined,
          };

      const result = await createBooking({
        beautyPageId,
        serviceIds: Array.from(selectedServiceIds),
        date: dateStr,
        startTime: selectedTime,
        endTime,
        clientInfo,
        clientId: currentUserId,
      });

      if (result.success) {
        setBookingResult(result);
      } else {
        setError(result.message);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleBookAnother() {
    setBookingResult(null);
    setError(null);
    clearAll();
  }

  // Success state
  if (bookingResult?.success) {
    return (
      <BookingSuccessCard
        title={translations.title}
        status={bookingResult.status}
        translations={{
          successTitle: successTranslations.title,
          confirmedMessage: successTranslations.confirmedMessage,
          pendingMessage: successTranslations.pendingMessage,
          bookAnother: "Book another",
        }}
        onBookAnother={handleBookAnother}
      />
    );
  }

  return (
    <div>
      <div className="pb-3">
        <h3 className="text-base font-semibold">{translations.title}</h3>
      </div>

      <div className="flex flex-col rounded-2xl border border-border bg-surface p-4">
        <div className="space-y-4">
          <SummaryRow
            icon={<Scissors className="h-4 w-4" />}
            label={translations.services}
            completed={hasServices}
            placeholder={translations.selectServices}
          >
            {hasServices && (
              <div className="space-y-1">
                {selectedServices.map((service) => (
                  <div key={service.id} className="text-sm">
                    {service.name}
                  </div>
                ))}
              </div>
            )}
          </SummaryRow>

          <SummaryRow
            icon={<Calendar className="h-4 w-4" />}
            label={translations.dateTime}
            completed={hasDateTime}
            placeholder={translations.selectDateTime}
          >
            {selectedDate && selectedTime && (
              <div className="text-sm">
                <div className="font-medium">
                  {selectedDate.toLocaleDateString(locale, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <div className="flex items-center gap-1 text-muted">
                  <Clock className="h-3 w-3" />
                  {selectedTime}
                </div>
              </div>
            )}
          </SummaryRow>
        </div>

        <div className="my-4 border-t border-border" />

        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-muted">{translations.total}</span>
          <div className="text-right">
            <div className="text-lg font-semibold text-accent">
              {totalPriceCents > 0
                ? formatPrice(totalPriceCents, currency, locale)
                : "—"}
            </div>
            {totalDurationMinutes > 0 && (
              <div className="text-xs text-muted">{formattedDuration}</div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {!isAuthenticated && isReadyToBook ? (
          <GuestBookingForm
            formTranslations={formTranslations}
            validationTranslations={validationTranslations}
            bookButtonText={translations.bookButton}
            isSubmitting={isSubmitting}
            disabled={!isReadyToBook}
            onSubmit={handleSubmit}
          />
        ) : (
          <Button
            onClick={() => handleSubmit()}
            disabled={!isReadyToBook || isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Booking...
              </>
            ) : (
              translations.bookButton
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
