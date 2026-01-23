"use client";

/**
 * Success Step (Solo Creator Model)
 *
 * Displays booking confirmation after successful submission.
 * Shows appointment details and next steps.
 */

import { Calendar, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/lib/ui/avatar";
import { Button } from "@/lib/ui/button";
import { DiscountBadge } from "@/lib/ui/discount-badge";
import { formatDuration, formatPrice } from "@/lib/utils/price-range";
import { calculateEndTime, formatSlotTime } from "./_lib/slot-generation";
import { useBooking } from "./booking-context";

interface StepSuccessProps {
  translations: {
    title: string;
    confirmedMessage: string;
    pendingMessage: string;
    /** Title shown for reschedule success */
    rescheduledTitle?: string;
    /** Message shown for reschedule success */
    rescheduledMessage?: string;
    summary: {
      specialist: string;
      dateTime: string;
      services: string;
    };
    viewAppointment: string;
    close: string;
  };
  durationLabels: {
    min: string;
    hour: string;
  };
  onClose: () => void;
}

export function StepSuccess({
  translations,
  durationLabels,
  onClose,
}: StepSuccessProps) {
  const {
    date,
    time,
    selectedServices,
    selectedBundle,
    totalPriceCents,
    totalDurationMinutes,
    originalPriceCents,
    result,
    currency,
    locale,
    creatorInfo,
    isRescheduleMode,
  } = useBooking();

  // Derived values (React Compiler handles optimization)
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
  const formattedOriginalPrice = originalPriceCents
    ? formatPrice(originalPriceCents, currency, locale)
    : null;
  const formattedDuration = formatDuration(
    totalDurationMinutes,
    durationLabels,
  );
  const serviceNames = selectedServices.map((s) => s.name).join(", ");

  // Calculate bundle discount percentage
  const bundleDiscountPercentage =
    selectedBundle &&
    originalPriceCents &&
    totalPriceCents &&
    originalPriceCents > totalPriceCents
      ? Math.round(
          ((originalPriceCents - totalPriceCents) / originalPriceCents) * 100,
        )
      : 0;

  // Title and status message (different for reschedule vs new booking)
  const displayTitle =
    isRescheduleMode && translations.rescheduledTitle
      ? translations.rescheduledTitle
      : translations.title;

  let statusMessage = "";
  if (result?.success) {
    if (isRescheduleMode && translations.rescheduledMessage) {
      statusMessage = translations.rescheduledMessage;
    } else {
      statusMessage =
        result.status === "confirmed"
          ? translations.confirmedMessage
          : translations.pendingMessage;
    }
  }

  if (!date || !time || !result || !result.success) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-4">
      {/* Success icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
      </div>

      {/* Title and message */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground">
          {displayTitle}
        </h3>
        <p className="mt-1 text-sm text-muted">{statusMessage}</p>
      </div>

      {/* Booking Summary */}
      <div className="w-full rounded-lg border border-border bg-surface p-4">
        {/* Creator */}
        <div className="flex items-center gap-3 pb-3">
          <Avatar
            url={creatorInfo.avatarUrl}
            name={creatorInfo.displayName}
            size="md"
          />
          <div>
            <div className="font-medium text-foreground">
              {creatorInfo.displayName}
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-3">
          <div className="space-y-2 text-sm">
            {/* Date & Time */}
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-4 w-4 text-muted" />
              <div>
                <div className="font-medium text-foreground">
                  {formattedDate}
                </div>
                <div className="text-muted">{formattedTime}</div>
              </div>
            </div>

            {/* Services */}
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-4 w-4 text-muted" />
              <div>
                {/* Bundle header if applicable */}
                {selectedBundle && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground">
                      {selectedBundle.name}
                    </span>
                    <DiscountBadge percentage={bundleDiscountPercentage} />
                  </div>
                )}
                <div
                  className={
                    selectedBundle
                      ? "text-sm text-muted"
                      : "font-medium text-foreground"
                  }
                >
                  {serviceNames}
                </div>
                <div className="text-muted flex items-center gap-2">
                  <span>{formattedDuration}</span>
                  <span>·</span>
                  {/* Show original price crossed out for bundles */}
                  {selectedBundle && formattedOriginalPrice && (
                    <span className="line-through">
                      {formattedOriginalPrice}
                    </span>
                  )}
                  <span
                    className={
                      selectedBundle ? "font-medium text-foreground" : ""
                    }
                  >
                    {formattedPrice}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex w-full flex-col gap-2">
        {isRescheduleMode ? (
          // When rescheduling, user is already on the appointment page - just show Close
          <Button onClick={onClose} className="w-full">
            {translations.close}
          </Button>
        ) : (
          // For new bookings, show both View Appointment and Close
          <>
            <Link
              href={`/appointments/${result.appointmentId}`}
              className="w-full"
            >
              <Button className="w-full">{translations.viewAppointment}</Button>
            </Link>
            <Button variant="ghost" onClick={onClose} className="w-full">
              {translations.close}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
