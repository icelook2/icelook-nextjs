"use client";

/**
 * Confirmation Step
 *
 * Shows structured booking summary (Who, When, Where, What, Price, Duration)
 * and collects guest information for the booking.
 *
 * For authenticated users with a profile, only asks for phone and notes.
 * For guests (unauthenticated), asks for name, phone, email, and notes.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { Avatar } from "@/lib/ui/avatar";
import { Button } from "@/lib/ui/button";
import { formatDuration, formatPrice } from "@/lib/utils/price-range";
import type { BeautyPageInfo } from "./booking-dialog";
import { useBooking } from "./booking-context";
import {
  createAuthUserSchema,
  createGuestInfoSchema,
  type AuthUserFormData,
  type GuestInfoFormData,
  type GuestInfoValidationMessages,
} from "./_lib/booking-schemas";
import { calculateEndTime, formatSlotTime } from "./_lib/slot-generation";

interface StepConfirmationProps {
  translations: {
    title: string;
    subtitle: string;
    summary: {
      who: string;
      when: string;
      where: string;
      what: string;
      price: string;
      duration: string;
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
    submit: string;
    submitting: string;
  };
  cancelLabel: string;
  beautyPageInfo: BeautyPageInfo;
  durationLabels: {
    min: string;
    hour: string;
  };
  onCancel: () => void;
}

export function StepConfirmation({
  translations,
  cancelLabel,
  beautyPageInfo,
  durationLabels,
  onCancel,
}: StepConfirmationProps) {
  const {
    specialist,
    date,
    time,
    selectedServices,
    currency,
    locale,
    isSubmitting,
    error,
    submitBooking,
    setGuestInfo,
    goBack,
    currentUserProfile,
  } = useBooking();

  // Determine if user is authenticated with profile data
  const isAuthenticated = !!currentUserProfile?.name;

  // Create validation schema based on auth status
  const guestSchema = useMemo(
    () => createGuestInfoSchema(translations.validation),
    [translations.validation],
  );

  const authSchema = useMemo(
    () => createAuthUserSchema(translations.validation),
    [translations.validation],
  );

  // Form for guest users
  const guestForm = useForm<GuestInfoFormData>({
    resolver: zodResolver(guestSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      notes: "",
    },
  });

  // Form for authenticated users (only notes field)
  const authForm = useForm<AuthUserFormData>({
    resolver: zodResolver(authSchema),
    mode: "onChange",
    defaultValues: {
      notes: "",
    },
  });

  // Handle form submission for guests
  const onGuestSubmit = async (data: GuestInfoFormData) => {
    setGuestInfo({
      name: data.name,
      phone: data.phone,
      email: data.email || undefined,
      notes: data.notes || undefined,
    });
    await submitBooking();
  };

  // Handle form submission for authenticated users
  const onAuthSubmit = async (data: AuthUserFormData) => {
    setGuestInfo({
      name: currentUserProfile?.name ?? "",
      // Phone not required for authenticated users
      email: currentUserProfile?.email || undefined,
      notes: data.notes || undefined,
    });
    await submitBooking();
  };

  // Get form validity based on auth status
  const formIsValid = isAuthenticated
    ? authForm.formState.isValid
    : guestForm.formState.isValid;

  // Calculate formatted values
  const formattedDate = useMemo(() => {
    if (!date) return "";
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [date]);

  const formattedTime = useMemo(() => {
    if (!time || !specialist) return "";
    const endTime = calculateEndTime(time, specialist.totalDurationMinutes);
    return `${formatSlotTime(time, false)} – ${formatSlotTime(endTime, false)}`;
  }, [time, specialist]);

  const formattedPrice = useMemo(() => {
    if (!specialist) return "";
    return formatPrice(specialist.totalPriceCents, currency, locale);
  }, [specialist, currency, locale]);

  const formattedDuration = useMemo(() => {
    if (!specialist) return "";
    return formatDuration(specialist.totalDurationMinutes, durationLabels);
  }, [specialist, durationLabels]);

  if (!specialist || !date || !time) {
    return null;
  }

  return (
    <div className="flex flex-col">
      {/* Content */}
      <div className="space-y-6 px-4 pb-4">
        {/* Booking Summary */}
        <div className="space-y-4">
          {/* Who */}
          <SummaryRow label={translations.summary.who}>
            <div className="flex items-center gap-2">
              <Avatar
                url={specialist.avatarUrl}
                name={specialist.displayName}
                size="sm"
              />
              <span className="font-medium text-foreground">
                {specialist.displayName}
              </span>
            </div>
          </SummaryRow>

          {/* When */}
          <SummaryRow label={translations.summary.when}>
            <div>
              <div className="font-medium text-foreground">{formattedDate}</div>
              <div className="text-sm text-muted">
                {formattedTime} ({formattedDuration})
              </div>
            </div>
          </SummaryRow>

          {/* Where */}
          <SummaryRow label={translations.summary.where}>
            <div className="flex items-center gap-2">
              <Avatar
                url={beautyPageInfo.avatarUrl}
                name={beautyPageInfo.name}
                size="sm"
              />
              <div>
                <div className="font-medium text-foreground">
                  {beautyPageInfo.name}
                </div>
                {beautyPageInfo.address && (
                  <div className="text-sm text-muted">
                    {beautyPageInfo.address}
                  </div>
                )}
              </div>
            </div>
          </SummaryRow>

          {/* What */}
          <SummaryRow label={translations.summary.what}>
            <div className="space-y-1">
              {selectedServices.map((service) => {
                // Get the price for this service from the specialist's assignment
                const assignment = service.assignments.find(
                  (a) => a.member_id === specialist.memberId,
                );
                const priceCents = assignment?.price_cents ?? 0;
                return (
                  <div
                    key={service.id}
                    className="flex items-center justify-between"
                  >
                    <span className="text-foreground">{service.name}</span>
                    <span className="text-sm text-muted">
                      {formatPrice(priceCents, currency, locale)}
                    </span>
                  </div>
                );
              })}
            </div>
          </SummaryRow>

          {/* Price */}
          <SummaryRow label={translations.summary.price}>
            <span className="font-semibold text-foreground">{formattedPrice}</span>
          </SummaryRow>
        </div>

        {/* Form - different for authenticated vs guest users */}
        {isAuthenticated ? (
          // Authenticated user - no form fields needed, just submit
          <form
            id="booking-form"
            onSubmit={authForm.handleSubmit(onAuthSubmit)}
          >
            {/* Error message */}
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}
          </form>
        ) : (
          // Guest user form - name, phone, email, notes
          <form
            id="booking-form"
            onSubmit={guestForm.handleSubmit(onGuestSubmit)}
            className="space-y-4"
          >
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                {translations.form.name} *
              </label>
              <input
                {...guestForm.register("name")}
                id="name"
                type="text"
                placeholder={translations.form.namePlaceholder}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {guestForm.formState.errors.name && (
                <p className="mt-1 text-xs text-red-500">
                  {guestForm.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                {translations.form.phone} *
              </label>
              <input
                {...guestForm.register("phone")}
                id="phone"
                type="tel"
                placeholder={translations.form.phonePlaceholder}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {guestForm.formState.errors.phone && (
                <p className="mt-1 text-xs text-red-500">
                  {guestForm.formState.errors.phone.message}
                </p>
              )}
            </div>

            {/* Email (optional) */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                {translations.form.email}
              </label>
              <input
                {...guestForm.register("email")}
                id="email"
                type="email"
                placeholder={translations.form.emailPlaceholder}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {guestForm.formState.errors.email && (
                <p className="mt-1 text-xs text-red-500">
                  {guestForm.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Notes (optional) */}
            <div>
              <label
                htmlFor="notes"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                {translations.form.notes}
              </label>
              <textarea
                {...guestForm.register("notes")}
                id="notes"
                rows={3}
                placeholder={translations.form.notesPlaceholder}
                className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {guestForm.formState.errors.notes && (
                <p className="mt-1 text-xs text-red-500">
                  {guestForm.formState.errors.notes.message}
                </p>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}
          </form>
        )}
      </div>

      {/* Footer with actions */}
      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <Button variant="ghost" onClick={goBack}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <Button
          type="submit"
          form="booking-form"
          disabled={!formIsValid || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {translations.submitting}
            </>
          ) : (
            translations.submit
          )}
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Summary Row
// ============================================================================

interface SummaryRowProps {
  label: string;
  children: React.ReactNode;
}

function SummaryRow({ label, children }: SummaryRowProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-24 shrink-0 pt-1 text-xs uppercase tracking-wide text-muted">
        {label}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
