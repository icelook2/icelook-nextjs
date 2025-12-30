"use client";

/**
 * Confirmation Column
 *
 * 4th column showing dynamic booking summary.
 * Updates in real-time as user makes selections.
 * Handles booking directly without opening a dialog.
 *
 * For authenticated users: books directly on button click.
 * For guests: shows inline form, then books on submit.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Calendar, Clock, User, Scissors, Loader2, CheckCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/lib/ui/button";
import { formatPrice, formatDuration, type DurationLabels } from "@/lib/utils/price-range";
import { useBookingLayout } from "./booking-layout-context";
import { createBooking } from "../booking/_actions/booking.actions";
import {
  createGuestInfoSchema,
  type GuestInfoFormData,
  type GuestInfoValidationMessages,
} from "../booking/_lib/booking-schemas";
import { calculateEndTime } from "../booking/_lib/slot-generation";
import type { BookingResult, CurrentUserProfile } from "../booking/_lib/booking-types";

// ============================================================================
// Types
// ============================================================================

interface ConfirmationColumnProps {
  translations: {
    title: string;
    services: string;
    specialist: string;
    dateTime: string;
    total: string;
    bookButton: string;
    selectServices: string;
    selectSpecialist: string;
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
  timezone,
  currentUserId,
  currentUserProfile,
}: ConfirmationColumnProps) {
  const {
    isReadyToBook,
    selectedServiceIds,
    selectedSpecialistId,
    selectedDate,
    selectedTime,
    getSpecialistPrice,
    getSpecialistDuration,
    selectedServices,
    allSpecialists,
    clearAll,
  } = useBookingLayout();

  // Booking state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);

  // Form state for guest users
  const isAuthenticated = !!currentUserProfile?.name;

  const guestSchema = useMemo(
    () => createGuestInfoSchema(validationTranslations),
    [validationTranslations],
  );

  const form = useForm<GuestInfoFormData>({
    resolver: zodResolver(guestSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      notes: "",
    },
  });

  // Get specialist info
  const specialist = selectedSpecialistId
    ? allSpecialists.find((s) => s.member_id === selectedSpecialistId)
    : null;

  // Get price and duration
  const price = selectedSpecialistId
    ? getSpecialistPrice(selectedSpecialistId)
    : 0;
  const duration = selectedSpecialistId
    ? getSpecialistDuration(selectedSpecialistId)
    : 0;

  // Format duration
  const formattedDuration = formatDuration(duration, durationLabels);

  // Check completion status of each step
  const hasServices = selectedServices.length > 0;
  const hasSpecialist = !!selectedSpecialistId;
  const hasDateTime = !!selectedDate && !!selectedTime;

  // Form is valid for booking
  const canBook = isAuthenticated
    ? isReadyToBook
    : isReadyToBook && form.formState.isValid;

  // Handle booking submission
  async function handleSubmit(formData?: GuestInfoFormData) {
    if (!isReadyToBook || !selectedSpecialistId || !selectedDate || !selectedTime || !specialist) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Calculate end time
      const endTime = calculateEndTime(selectedTime, duration);

      // Format date as YYYY-MM-DD
      const dateStr = formatDateToYYYYMMDD(selectedDate);

      // Prepare client info
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
        specialistMemberId: selectedSpecialistId,
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
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle authenticated user booking
  function handleAuthenticatedBooking() {
    handleSubmit();
  }

  // Handle guest form submission
  function onGuestSubmit(data: GuestInfoFormData) {
    handleSubmit(data);
  }

  // Handle booking another appointment
  function handleBookAnother() {
    setBookingResult(null);
    setError(null);
    clearAll();
    form.reset();
  }

  // Show success state
  if (bookingResult?.success) {
    return (
      <div>
        <div className="pb-3">
          <h3 className="text-base font-semibold">{translations.title}</h3>
        </div>

        <div className="flex flex-col items-center rounded-2xl border border-border bg-surface p-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>

          <h4 className="mb-2 text-lg font-semibold">{successTranslations.title}</h4>

          <p className="mb-6 text-sm text-muted">
            {bookingResult.status === "confirmed"
              ? successTranslations.confirmedMessage
              : successTranslations.pendingMessage}
          </p>

          <Button variant="secondary" onClick={handleBookAnother} className="w-full">
            Book another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="pb-3">
        <h3 className="text-base font-semibold">{translations.title}</h3>
      </div>

      {/* Content */}
      <div className="flex flex-col rounded-2xl border border-border bg-surface p-4">
        <div className="space-y-4">
          {/* Services */}
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

          {/* Specialist */}
          <SummaryRow
            icon={<User className="h-4 w-4" />}
            label={translations.specialist}
            completed={hasSpecialist}
            placeholder={translations.selectSpecialist}
          >
            {specialist && (
              <div className="text-sm font-medium">
                {specialist.display_name ?? "Specialist"}
              </div>
            )}
          </SummaryRow>

          {/* Date & Time */}
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

        {/* Divider */}
        <div className="my-4 border-t border-border" />

        {/* Total */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-muted">{translations.total}</span>
          <div className="text-right">
            <div className="text-lg font-semibold text-accent">
              {price > 0 ? formatPrice(price, currency, locale) : "—"}
            </div>
            {duration > 0 && (
              <div className="text-xs text-muted">{formattedDuration}</div>
            )}
          </div>
        </div>

        {/* Guest form - only show when ready to book and not authenticated */}
        {!isAuthenticated && isReadyToBook && (
          <form
            id="booking-form"
            onSubmit={form.handleSubmit(onGuestSubmit)}
            className="mb-4 space-y-3"
          >
            {/* Name */}
            <div>
              <input
                {...form.register("name")}
                type="text"
                placeholder={formTranslations.namePlaceholder}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:border-accent focus:outline-none"
              />
              {form.formState.errors.name && (
                <p className="mt-1 text-xs text-red-500">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <input
                {...form.register("phone")}
                type="tel"
                placeholder={formTranslations.phonePlaceholder}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:border-accent focus:outline-none"
              />
              {form.formState.errors.phone && (
                <p className="mt-1 text-xs text-red-500">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>
          </form>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Book button */}
        {isAuthenticated ? (
          <Button
            onClick={handleAuthenticatedBooking}
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
        ) : (
          <Button
            type="submit"
            form="booking-form"
            disabled={!canBook || isSubmitting}
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

// ============================================================================
// Summary Row Component
// ============================================================================

interface SummaryRowProps {
  icon: React.ReactNode;
  label: string;
  completed: boolean;
  placeholder: string;
  children?: React.ReactNode;
}

function SummaryRow({
  icon,
  label,
  completed,
  placeholder,
  children,
}: SummaryRowProps) {
  return (
    <div className="flex gap-3">
      {/* Status icon */}
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          completed
            ? "bg-accent/10 text-accent"
            : "bg-surface-hover text-muted"
        }`}
      >
        {completed ? <Check className="h-3.5 w-3.5" /> : icon}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-muted">{label}</div>
        {completed ? (
          children
        ) : (
          <div className="text-sm text-muted/60">{placeholder}</div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
