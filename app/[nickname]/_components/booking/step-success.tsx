"use client";

/**
 * Success Step (Solo Creator Model)
 *
 * Displays booking confirmation after successful submission.
 * Shows appointment details and next steps.
 */

import { Calendar, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Avatar } from "@/lib/ui/avatar";
import { Button } from "@/lib/ui/button";
import { formatDuration, formatPrice } from "@/lib/utils/price-range";
import { calculateEndTime, formatSlotTime } from "./_lib/slot-generation";
import { useBooking } from "./booking-context";

interface StepSuccessProps {
  translations: {
    title: string;
    confirmedMessage: string;
    pendingMessage: string;
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
    totalPriceCents,
    totalDurationMinutes,
    result,
    currency,
    locale,
    creatorInfo,
  } = useBooking();

  // Format display values
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

  const serviceNames = useMemo(
    () => selectedServices.map((s) => s.name).join(", "),
    [selectedServices],
  );

  // Get status message
  const statusMessage = useMemo(() => {
    if (!result || !result.success) {
      return "";
    }
    return result.status === "confirmed"
      ? translations.confirmedMessage
      : translations.pendingMessage;
  }, [result, translations]);

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
          {translations.title}
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
                <div className="font-medium text-foreground">
                  {serviceNames}
                </div>
                <div className="text-muted">
                  {formattedDuration} · {formattedPrice}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex w-full flex-col gap-2">
        <Link href="/appointments" className="w-full">
          <Button className="w-full">{translations.viewAppointment}</Button>
        </Link>
        <Button variant="ghost" onClick={onClose} className="w-full">
          {translations.close}
        </Button>
      </div>
    </div>
  );
}
