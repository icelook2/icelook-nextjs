"use client";

/**
 * Confirmation Step (Solo Creator Model)
 *
 * Shows structured booking summary (Who, When, Where, What, Price, Duration)
 * and collects guest information for the booking.
 *
 * For authenticated users with a profile, only asks for notes.
 * For guests (unauthenticated), asks for name, phone, email, and notes.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type {
  AccessibilityNeed,
  CommunicationPreference,
  VisitPreferences,
} from "@/lib/types";
import { formatDuration, formatPrice } from "@/lib/utils/price-range";
import {
  type AuthUserFormData,
  createAuthUserSchema,
  createGuestInfoSchema,
  type GuestInfoFormData,
  type GuestInfoValidationMessages,
} from "./_lib/booking-schemas";
import { calculateEndTime, formatSlotTime } from "./_lib/slot-generation";
import { useBooking } from "./booking-context";
import type { BeautyPageInfo } from "./booking-dialog";
import { BookingSummary } from "./booking-summary";
import { GuestFormFields } from "./guest-form-fields";
import {
  VisitPreferencesSection,
  type VisitPreferencesTranslations,
} from "./visit-preferences-section";

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
    visitPreferences: VisitPreferencesTranslations;
    submit: string;
    submitting: string;
    priceChangedNotice?: string;
  };
  beautyPageInfo: BeautyPageInfo;
  durationLabels: {
    min: string;
    hour: string;
  };
}

export function StepConfirmation({
  translations,
  beautyPageInfo,
  durationLabels,
}: StepConfirmationProps) {
  const {
    date,
    time,
    selectedServices,
    selectedBundle,
    totalPriceCents,
    totalDurationMinutes,
    currency,
    locale,
    error,
    submitBooking,
    setGuestInfo,
    setConfirmFormReady,
    currentUserProfile,
    creatorInfo,
    originalPriceCents,
    isRescheduleMode,
    rescheduleData,
  } = useBooking();

  // Determine if user is authenticated with profile data
  const isAuthenticated = !!currentUserProfile?.name;

  // Visit preferences state
  const [communication, setCommunication] = useState<
    CommunicationPreference | undefined
  >(currentUserProfile?.visitPreferences?.communication);
  const [accessibility, setAccessibility] = useState<AccessibilityNeed[]>(
    currentUserProfile?.visitPreferences?.accessibility ?? [],
  );
  const [allergies, setAllergies] = useState<string>(
    currentUserProfile?.visitPreferences?.allergies ?? "",
  );

  // Build visit preferences object
  const buildVisitPreferences = (): VisitPreferences | undefined => {
    const prefs: VisitPreferences = {};
    if (communication) {
      prefs.communication = communication;
    }
    if (accessibility.length > 0) {
      prefs.accessibility = accessibility;
    }
    if (allergies.trim()) {
      prefs.allergies = allergies.trim();
    }
    return Object.keys(prefs).length > 0 ? prefs : undefined;
  };

  const toggleAccessibility = (need: AccessibilityNeed) => {
    setAccessibility((prev) =>
      prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need],
    );
  };

  // Forms
  const guestSchema = createGuestInfoSchema(translations.validation);
  const authSchema = createAuthUserSchema(translations.validation);

  const guestForm = useForm<GuestInfoFormData>({
    resolver: zodResolver(guestSchema),
    mode: "onChange",
    defaultValues: { name: "", phone: "", email: "", notes: "" },
  });

  const authForm = useForm<AuthUserFormData>({
    resolver: zodResolver(authSchema),
    mode: "onChange",
    defaultValues: { notes: "" },
  });

  // Submit handlers
  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitBooking();
  };

  const onGuestSubmit = async (data: GuestInfoFormData) => {
    setGuestInfo({
      name: data.name,
      phone: data.phone,
      email: data.email || undefined,
      notes: data.notes || undefined,
      visitPreferences: buildVisitPreferences(),
    });
    await submitBooking();
  };

  const onAuthSubmit = async (data: AuthUserFormData) => {
    setGuestInfo({
      name: currentUserProfile?.name ?? "",
      email: currentUserProfile?.email || undefined,
      notes: data.notes || undefined,
      visitPreferences: buildVisitPreferences(),
    });
    await submitBooking();
  };

  // Form validity
  const formIsValid = isRescheduleMode
    ? true
    : isAuthenticated
      ? authForm.formState.isValid
      : guestForm.formState.isValid;

  useEffect(() => {
    setConfirmFormReady(formIsValid);
  }, [formIsValid, setConfirmFormReady]);

  // Formatted values
  const formattedDate = date
    ? date.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const formattedTime = time
    ? `${formatSlotTime(time, false)} – ${formatSlotTime(calculateEndTime(time, totalDurationMinutes), false)}`
    : "";

  const formattedPrice = formatPrice(totalPriceCents, currency, locale);
  const formattedDuration = formatDuration(
    totalDurationMinutes,
    durationLabels,
  );
  const formattedOriginalPrice = originalPriceCents
    ? formatPrice(originalPriceCents, currency, locale)
    : null;
  const hasPriceChanged =
    originalPriceCents !== undefined && originalPriceCents !== totalPriceCents;

  // Reschedule formatting
  const formattedOriginalDate = rescheduleData?.originalDate
    ? new Date(rescheduleData.originalDate + "T00:00:00").toLocaleDateString(
        undefined,
        { weekday: "long", month: "long", day: "numeric", year: "numeric" },
      )
    : null;

  const formattedOriginalTime = rescheduleData?.originalStartTime
    ? `${formatSlotTime(rescheduleData.originalStartTime, false)} – ${formatSlotTime(calculateEndTime(rescheduleData.originalStartTime, totalDurationMinutes), false)}`
    : null;

  const hasDateTimeChanged =
    isRescheduleMode &&
    rescheduleData &&
    (rescheduleData.originalDate !== date?.toISOString().split("T")[0] ||
      rescheduleData.originalStartTime !== time);

  if (!date || !time) {
    return null;
  }

  return (
    <div className="flex flex-col">
      <div className="space-y-6 px-4 pb-4">
        <BookingSummary
          translations={translations.summary}
          creatorInfo={creatorInfo}
          formattedDate={formattedDate}
          formattedTime={formattedTime}
          formattedDuration={formattedDuration}
          address={beautyPageInfo.address ?? undefined}
          selectedServices={selectedServices}
          formattedPrice={formattedPrice}
          currency={currency}
          locale={locale}
          selectedBundle={selectedBundle}
          originalPriceCents={originalPriceCents}
          totalPriceCents={totalPriceCents}
          hasDateTimeChanged={hasDateTimeChanged}
          formattedOriginalDate={formattedOriginalDate}
          formattedOriginalTime={formattedOriginalTime}
          hasPriceChanged={hasPriceChanged}
          formattedOriginalPrice={formattedOriginalPrice}
          priceChangedNotice={translations.priceChangedNotice}
        />

        {isRescheduleMode ? (
          <form id="booking-form" onSubmit={handleRescheduleSubmit}>
            <ErrorMessage error={error} />
          </form>
        ) : isAuthenticated ? (
          <form
            id="booking-form"
            onSubmit={authForm.handleSubmit(onAuthSubmit)}
            className="space-y-4"
          >
            <VisitPreferencesSection
              translations={translations.visitPreferences}
              communication={communication}
              onCommunicationChange={setCommunication}
              accessibility={accessibility}
              onAccessibilityToggle={toggleAccessibility}
              allergies={allergies}
              onAllergiesChange={setAllergies}
            />
            <ErrorMessage error={error} />
          </form>
        ) : (
          <form
            id="booking-form"
            onSubmit={guestForm.handleSubmit(onGuestSubmit)}
            className="space-y-4"
          >
            <GuestFormFields
              register={guestForm.register}
              errors={guestForm.formState.errors}
              translations={translations.form}
            />
            <VisitPreferencesSection
              translations={translations.visitPreferences}
              communication={communication}
              onCommunicationChange={setCommunication}
              accessibility={accessibility}
              onAccessibilityToggle={toggleAccessibility}
              allergies={allergies}
              onAllergiesChange={setAllergies}
            />
            <ErrorMessage error={error} />
          </form>
        )}
      </div>
    </div>
  );
}

function ErrorMessage({ error }: { error: string | null }) {
  if (!error) {
    return null;
  }
  return (
    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
      {error}
    </div>
  );
}
