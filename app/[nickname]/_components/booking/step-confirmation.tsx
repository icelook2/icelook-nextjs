"use client";

/**
 * Confirmation Step
 *
 * Shows booking summary and collects guest information.
 * Validates input before allowing booking submission.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Clock, Loader2, User } from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { Avatar } from "@/lib/ui/avatar";
import { Button } from "@/lib/ui/button";
import { formatDuration, formatPrice } from "@/lib/utils/price-range";
import { useBooking } from "./booking-context";
import {
  createGuestInfoSchema,
  type GuestInfoFormData,
  type GuestInfoValidationMessages,
} from "./_lib/booking-schemas";
import { calculateEndTime, formatSlotTime } from "./_lib/slot-generation";

interface StepConfirmationProps {
  translations: {
    title: string;
    subtitle: string;
    summary: {
      specialist: string;
      dateTime: string;
      services: string;
      total: string;
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
  durationLabels: {
    min: string;
    hour: string;
  };
}

export function StepConfirmation({
  translations,
  durationLabels,
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
    currentUserId,
  } = useBooking();

  // Create validation schema with translations
  const schema = useMemo(
    () => createGuestInfoSchema(translations.validation),
    [translations.validation],
  );

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<GuestInfoFormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      notes: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: GuestInfoFormData) => {
    setGuestInfo({
      name: data.name,
      phone: data.phone,
      email: data.email || undefined,
      notes: data.notes || undefined,
    });
    await submitBooking();
  };

  // Calculate end time and format display values
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

  const serviceNames = useMemo(
    () => selectedServices.map((s) => s.name).join(", "),
    [selectedServices],
  );

  if (!specialist || !date || !time) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {translations.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {translations.subtitle}
        </p>
      </div>

      {/* Booking Summary */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
        {/* Specialist */}
        <div className="flex items-center gap-3 pb-3">
          <Avatar
            url={specialist.avatarUrl}
            name={specialist.displayName}
            size="md"
          />
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {specialist.displayName}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {translations.summary.specialist}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
          <div className="space-y-2 text-sm">
            {/* Date & Time */}
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-4 w-4 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {formattedDate}
                </div>
                <div className="text-gray-500 dark:text-gray-400">
                  {formattedTime}
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-4 w-4 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {serviceNames}
                </div>
                <div className="text-gray-500 dark:text-gray-400">
                  {formattedDuration}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {translations.summary.total}
          </span>
          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {formattedPrice}
          </span>
        </div>
      </div>

      {/* Guest Info Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <div>
          <label
            htmlFor="name"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {translations.form.name} *
          </label>
          <input
            {...register("name")}
            id="name"
            type="text"
            placeholder={translations.form.namePlaceholder}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label
            htmlFor="phone"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {translations.form.phone} *
          </label>
          <input
            {...register("phone")}
            id="phone"
            type="tel"
            placeholder={translations.form.phonePlaceholder}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
          )}
        </div>

        {/* Email (optional) */}
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {translations.form.email}
          </label>
          <input
            {...register("email")}
            id="email"
            type="email"
            placeholder={translations.form.emailPlaceholder}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Notes (optional) */}
        <div>
          <label
            htmlFor="notes"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {translations.form.notes}
          </label>
          <textarea
            {...register("notes")}
            id="notes"
            rows={3}
            placeholder={translations.form.notesPlaceholder}
            className="w-full resize-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
          />
          {errors.notes && (
            <p className="mt-1 text-xs text-red-500">{errors.notes.message}</p>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Submit button */}
        <Button
          type="submit"
          className="w-full"
          disabled={!isValid || isSubmitting}
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
      </form>
    </div>
  );
}
