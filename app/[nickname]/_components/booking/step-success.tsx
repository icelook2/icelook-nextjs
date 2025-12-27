"use client";

/**
 * Success Step
 *
 * Displays booking confirmation after successful submission.
 * Shows appointment details and next steps.
 */

import { Calendar, CheckCircle, Clock } from "lucide-react";
import { useMemo } from "react";
import { Avatar } from "@/lib/ui/avatar";
import { Button } from "@/lib/ui/button";
import { formatDuration, formatPrice } from "@/lib/utils/price-range";
import { useBooking } from "./booking-context";
import { calculateEndTime, formatSlotTime } from "./_lib/slot-generation";

interface StepSuccessProps {
  translations: {
    title: string;
    confirmedMessage: string;
    pendingMessage: string;
    appointmentId: string;
    summary: {
      specialist: string;
      dateTime: string;
      services: string;
    };
    done: string;
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
    specialist,
    date,
    time,
    selectedServices,
    result,
    currency,
    locale,
  } = useBooking();

  // Format display values
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

  // Get status message
  const statusMessage = useMemo(() => {
    if (!result || !result.success) return "";
    return result.status === "confirmed"
      ? translations.confirmedMessage
      : translations.pendingMessage;
  }, [result, translations]);

  if (!specialist || !date || !time || !result || !result.success) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Success icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
      </div>

      {/* Title and message */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {translations.title}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {statusMessage}
        </p>
      </div>

      {/* Appointment ID */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        <span>{translations.appointmentId}: </span>
        <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          {result.appointmentId.slice(0, 8).toUpperCase()}
        </code>
      </div>

      {/* Booking Summary */}
      <div className="w-full rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
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
                  {formattedDuration} • {formattedPrice}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Done button */}
      <Button onClick={onClose} className="w-full">
        {translations.done}
      </Button>
    </div>
  );
}
