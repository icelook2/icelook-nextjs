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

import { Collapsible } from "@base-ui/react/collapsible";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type {
  AccessibilityNeed,
  CommunicationPreference,
  VisitPreferences,
} from "@/lib/types";
import { ACCESSIBILITY_OPTIONS, COMMUNICATION_OPTIONS } from "@/lib/types";
import { Avatar } from "@/lib/ui/avatar";
import { Checkbox } from "@/lib/ui/checkbox";
import { Select } from "@/lib/ui/select";
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

interface VisitPreferencesTranslations {
  title: string;
  subtitle: string;
  communicationLabel: string;
  communicationQuiet: string;
  communicationFriendly: string;
  communicationChatty: string;
  accessibilityLabel: string;
  accessibilityWheelchair: string;
  accessibilityHearing: string;
  accessibilityVision: string;
  accessibilitySensory: string;
  allergiesLabel: string;
  allergiesPlaceholder: string;
}

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
    /** Notice shown when price differs from original booking */
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

  // Handle reschedule submit (no form data needed)
  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitBooking();
  };

  // Visit preferences state - pre-fill from profile for authenticated users
  const [communication, setCommunication] = useState<
    CommunicationPreference | undefined
  >(currentUserProfile?.visitPreferences?.communication);
  const [accessibility, setAccessibility] = useState<AccessibilityNeed[]>(
    currentUserProfile?.visitPreferences?.accessibility ?? [],
  );
  const [allergies, setAllergies] = useState<string>(
    currentUserProfile?.visitPreferences?.allergies ?? "",
  );

  // Build visit preferences object (only include non-empty values)
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

  // Handle accessibility checkbox toggle
  const toggleAccessibility = (need: AccessibilityNeed) => {
    setAccessibility((prev) =>
      prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need],
    );
  };

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
      visitPreferences: buildVisitPreferences(),
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
      visitPreferences: buildVisitPreferences(),
    });
    await submitBooking();
  };

  // Get form validity based on auth status
  // In reschedule mode, form is always valid (no input needed)
  const formIsValid = isRescheduleMode
    ? true
    : isAuthenticated
      ? authForm.formState.isValid
      : guestForm.formState.isValid;

  // Report form validity to context for sticky footer button
  useEffect(() => {
    setConfirmFormReady(formIsValid);
  }, [formIsValid, setConfirmFormReady]);

  // Calculate formatted values
  const formattedDate = useMemo(() => {
    if (!date) {
      return "";
    }
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [date]);

  const formattedTime = useMemo(() => {
    if (!time) {
      return "";
    }
    const endTime = calculateEndTime(time, totalDurationMinutes);
    return `${formatSlotTime(time, false)} – ${formatSlotTime(endTime, false)}`;
  }, [time, totalDurationMinutes]);

  const formattedPrice = useMemo(() => {
    return formatPrice(totalPriceCents, currency, locale);
  }, [totalPriceCents, currency, locale]);

  const formattedDuration = useMemo(() => {
    return formatDuration(totalDurationMinutes, durationLabels);
  }, [totalDurationMinutes, durationLabels]);

  // Format original price for comparison display (when rebooking with price change)
  const formattedOriginalPrice = useMemo(() => {
    if (!originalPriceCents) {
      return null;
    }
    return formatPrice(originalPriceCents, currency, locale);
  }, [originalPriceCents, currency, locale]);

  // Check if price has changed (for rebooking flow)
  const hasPriceChanged = originalPriceCents !== undefined && originalPriceCents !== totalPriceCents;

  // Format original date/time for reschedule mode
  const formattedOriginalDate = useMemo(() => {
    if (!rescheduleData?.originalDate) {
      return null;
    }
    const originalDate = new Date(rescheduleData.originalDate + "T00:00:00");
    return originalDate.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [rescheduleData?.originalDate]);

  const formattedOriginalTime = useMemo(() => {
    if (!rescheduleData?.originalStartTime) {
      return null;
    }
    const endTime = calculateEndTime(
      rescheduleData.originalStartTime,
      totalDurationMinutes,
    );
    return `${formatSlotTime(rescheduleData.originalStartTime, false)} – ${formatSlotTime(endTime, false)}`;
  }, [rescheduleData?.originalStartTime, totalDurationMinutes]);

  // Check if date/time has changed (for reschedule flow)
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
      {/* Content */}
      <div className="space-y-6 px-4 pb-4">
        {/* Booking Summary */}
        <div className="space-y-4">
          {/* Who (Creator) */}
          <SummaryRow label={translations.summary.who}>
            <div className="flex items-center gap-2">
              <Avatar
                url={creatorInfo.avatarUrl}
                name={creatorInfo.displayName}
                size="sm"
              />
              <span className="font-medium text-foreground">
                {creatorInfo.displayName}
              </span>
            </div>
          </SummaryRow>

          {/* When */}
          <SummaryRow label={translations.summary.when}>
            <div>
              {/* Show original date/time crossed out when rescheduling */}
              {hasDateTimeChanged && formattedOriginalDate && formattedOriginalTime && (
                <div className="mb-1">
                  <div className="text-sm text-muted line-through">
                    {formattedOriginalDate}
                  </div>
                  <div className="text-sm text-muted line-through">
                    {formattedOriginalTime} ({formattedDuration})
                  </div>
                </div>
              )}
              {/* New date/time */}
              <div className="font-medium text-foreground">{formattedDate}</div>
              <div className="text-sm text-muted">
                {formattedTime} ({formattedDuration})
              </div>
            </div>
          </SummaryRow>

          {/* Where */}
          {beautyPageInfo.address && (
            <SummaryRow label={translations.summary.where}>
              <span className="text-foreground">{beautyPageInfo.address}</span>
            </SummaryRow>
          )}

          {/* What */}
          <SummaryRow label={translations.summary.what}>
            <div className="space-y-1">
              {selectedServices.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between"
                >
                  <span className="text-foreground">{service.name}</span>
                  <span className="text-sm text-muted">
                    {formatPrice(service.price_cents, currency, locale)}
                  </span>
                </div>
              ))}
            </div>
          </SummaryRow>

          {/* Price */}
          <SummaryRow label={translations.summary.price}>
            <div>
              <span className="font-semibold text-foreground">
                {formattedPrice}
              </span>
              {hasPriceChanged && formattedOriginalPrice && (
                <span className="ml-2 text-sm text-muted line-through">
                  {formattedOriginalPrice}
                </span>
              )}
            </div>
          </SummaryRow>

          {/* Price change notice */}
          {hasPriceChanged && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                {translations.priceChangedNotice}
              </p>
            </div>
          )}
        </div>

        {/* Form - different for reschedule, authenticated, and guest users */}
        {isRescheduleMode ? (
          // Reschedule mode - no form needed, just a simple confirmation
          <form id="booking-form" onSubmit={handleRescheduleSubmit}>
            {/* Error message */}
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}
          </form>
        ) : isAuthenticated ? (
          // Authenticated user form - visit preferences only
          <form
            id="booking-form"
            onSubmit={authForm.handleSubmit(onAuthSubmit)}
            className="space-y-4"
          >
            {/* Visit Preferences (collapsible) */}
            <VisitPreferencesSection
              translations={translations.visitPreferences}
              communication={communication}
              onCommunicationChange={setCommunication}
              accessibility={accessibility}
              onAccessibilityToggle={toggleAccessibility}
              allergies={allergies}
              onAllergiesChange={setAllergies}
            />

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

            {/* Visit Preferences (collapsible) */}
            <VisitPreferencesSection
              translations={translations.visitPreferences}
              communication={communication}
              onCommunicationChange={setCommunication}
              accessibility={accessibility}
              onAccessibilityToggle={toggleAccessibility}
              allergies={allergies}
              onAllergiesChange={setAllergies}
            />

            {/* Error message */}
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}
          </form>
        )}
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

// ============================================================================
// Visit Preferences Section
// ============================================================================

interface VisitPreferencesSectionProps {
  translations: VisitPreferencesTranslations;
  communication: CommunicationPreference | undefined;
  onCommunicationChange: (value: CommunicationPreference | undefined) => void;
  accessibility: AccessibilityNeed[];
  onAccessibilityToggle: (need: AccessibilityNeed) => void;
  allergies: string;
  onAllergiesChange: (value: string) => void;
}

function VisitPreferencesSection({
  translations,
  communication,
  onCommunicationChange,
  accessibility,
  onAccessibilityToggle,
  allergies,
  onAllergiesChange,
}: VisitPreferencesSectionProps) {
  // Communication options with translations
  const communicationOptions = useMemo(
    () =>
      COMMUNICATION_OPTIONS.map((opt) => ({
        value: opt,
        label:
          opt === "quiet"
            ? translations.communicationQuiet
            : opt === "friendly"
              ? translations.communicationFriendly
              : translations.communicationChatty,
      })),
    [translations],
  );

  // Accessibility options with translations
  const accessibilityOptions = useMemo(
    () =>
      ACCESSIBILITY_OPTIONS.map((opt) => ({
        value: opt,
        label:
          opt === "wheelchair"
            ? translations.accessibilityWheelchair
            : opt === "hearing_impaired"
              ? translations.accessibilityHearing
              : opt === "vision_impaired"
                ? translations.accessibilityVision
                : translations.accessibilitySensory,
      })),
    [translations],
  );

  return (
    <Collapsible.Root>
      <Collapsible.Trigger className="group flex w-full items-center justify-between rounded-lg border border-border bg-surface-muted px-3 py-2.5 text-left transition-colors hover:bg-surface-hover data-[panel-open]:rounded-b-none data-[panel-open]:border-b-0">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground">
            {translations.title}
          </div>
          <div className="text-xs text-muted">{translations.subtitle}</div>
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform duration-200 group-data-[panel-open]:rotate-180" />
      </Collapsible.Trigger>

      <Collapsible.Panel className="overflow-hidden rounded-b-lg border border-t-0 border-border bg-surface transition-all duration-200 data-[ending-style]:h-0 data-[starting-style]:h-0">
        <div className="space-y-4 p-3">
          {/* Communication Style */}
          <div>
            <div className="mb-1.5 text-sm font-medium text-foreground">
              {translations.communicationLabel}
            </div>
            <Select.Root
              value={communication ?? null}
              onValueChange={(val) =>
                onCommunicationChange(
                  val ? (val as CommunicationPreference) : undefined,
                )
              }
            >
              <Select.Trigger
                placeholder={translations.communicationLabel}
                items={communicationOptions}
              />
              <Select.Content>
                {communicationOptions.map((opt) => (
                  <Select.Item key={opt.value} value={opt.value}>
                    {opt.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </div>

          {/* Accessibility Needs */}
          <div>
            <div className="mb-2 text-sm font-medium text-foreground">
              {translations.accessibilityLabel}
            </div>
            <div className="space-y-2">
              {accessibilityOptions.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <Checkbox
                    checked={accessibility.includes(opt.value)}
                    onCheckedChange={() => onAccessibilityToggle(opt.value)}
                  />
                  <span className="text-sm text-foreground">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Allergies */}
          <div>
            <label
              htmlFor="allergies-textarea"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              {translations.allergiesLabel}
            </label>
            <textarea
              id="allergies-textarea"
              value={allergies}
              onChange={(e) => onAllergiesChange(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder={translations.allergiesPlaceholder}
              className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
