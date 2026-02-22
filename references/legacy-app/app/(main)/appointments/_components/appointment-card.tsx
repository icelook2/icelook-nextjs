"use client";

import { Calendar, ChevronRight, Clock, Star } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { ClientAppointment } from "@/lib/queries/appointments";
import { DiscountBadge } from "@/lib/ui/discount-badge";
import { StarRating } from "@/lib/ui/star-rating";
import {
  calculateDiscountPercentage,
  parseAppointmentMetadata,
} from "@/lib/utils/appointment-metadata";
import { formatPrice } from "@/lib/utils/price-range";

interface AppointmentCardProps {
  appointment: ClientAppointment;
  /** Called when "Leave a review" is clicked. */
  onLeaveReview?: (appointment: ClientAppointment) => void;
}

/**
 * Returns a user-friendly date string:
 * - "Today" if the date is today
 * - "Tomorrow" if the date is tomorrow
 * - Full date like "Monday, 15 January" otherwise
 */
function getSmartDate(
  date: Date,
  locale: string,
  t: (key: string) => string,
): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const appointmentDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  if (appointmentDay.getTime() === today.getTime()) {
    return t("today");
  }

  if (appointmentDay.getTime() === tomorrow.getTime()) {
    return t("tomorrow");
  }

  // Full date: "Monday, 15 January"
  return date.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function AppointmentCard({
  appointment,
  onLeaveReview,
}: AppointmentCardProps) {
  const locale = useLocale();
  const t = useTranslations("appointments");

  const dateTime = new Date(`${appointment.date}T${appointment.start_time}`);

  const formattedTime = dateTime.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedPrice = formatPrice(
    appointment.service_price_cents,
    appointment.service_currency,
    locale,
  );

  const initial = appointment.creator_display_name.charAt(0).toUpperCase();

  // Determine if this is a past appointment
  const isPast =
    appointment.status === "completed" ||
    appointment.status === "cancelled" ||
    appointment.status === "no_show";

  // Status message for all appointments
  const statusMessage = t(`status_message_${appointment.status}`);

  // Status text color based on appointment status
  const statusColor = {
    pending: "text-amber-600 dark:text-amber-400",
    confirmed: "text-green-600 dark:text-green-400",
    completed: "text-blue-600 dark:text-blue-400",
    cancelled: "text-red-600 dark:text-red-400",
    no_show: "text-red-600 dark:text-red-400",
  }[appointment.status];

  const shouldCrossPrice =
    appointment.status === "cancelled" || appointment.status === "no_show";

  // Smart date for display
  const smartDate = getSmartDate(dateTime, locale, t);

  // Parse metadata to check for bundle info
  const metadata = parseAppointmentMetadata(appointment.client_notes);
  const bundle = metadata?.bundle ?? null;
  const discountPercentage =
    bundle && metadata
      ? calculateDiscountPercentage(
          metadata.total_original_price_cents,
          metadata.total_final_price_cents,
        )
      : 0;
  const formattedOriginalPrice =
    bundle && metadata
      ? formatPrice(
          metadata.total_original_price_cents,
          appointment.service_currency,
          locale,
        )
      : null;

  if (isPast) {
    // Past appointments: Service first (what did I have done?)
    return (
      <div className="rounded-2xl bg-surface border border-border p-4 flex flex-col gap-4">
        <Link
          href={`/appointments/${appointment.id}`}
          className="flex flex-col gap-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="font-bold text-lg text-foreground">
                {appointment.service_name}
              </p>
              {bundle && <DiscountBadge percentage={discountPercentage} />}
            </div>
            <ChevronRight className="h-5 w-5 text-muted shrink-0" />
          </div>

          {/* Beauty Page Info */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white font-semibold shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                {appointment.beauty_page_name}
              </p>
              <p className="text-sm text-muted truncate">
                @{appointment.beauty_page_slug}
              </p>
            </div>
          </div>

          {/* Date & Time + Status */}
          <div>
            <div className="flex items-center gap-2 text-sm text-muted">
              <Calendar className="h-4 w-4" />
              <span>{smartDate}</span>
              <span>·</span>
              <Clock className="h-4 w-4" />
              <span>{formattedTime}</span>
            </div>
            <p className={`text-sm mt-1 ${statusColor}`}>{statusMessage}</p>
          </div>

          {/* Total Price */}
          <div className="flex items-center gap-2">
            {formattedOriginalPrice && !shouldCrossPrice && (
              <span className="text-sm text-muted line-through">
                {formattedOriginalPrice}
              </span>
            )}
            <span
              className={`text-xl font-bold text-foreground ${shouldCrossPrice ? "line-through" : ""}`}
            >
              {formattedPrice}
            </span>
          </div>
        </Link>

        {/* Review section for completed appointments */}
        {appointment.status === "completed" && (
          <div className="border-t border-border pt-4">
            {appointment.hasReview && appointment.review ? (
              // Show existing review rating
              <div className="flex items-center gap-2">
                <StarRating rating={appointment.review.rating} size="sm" />
                <span className="text-sm text-muted">{t("your_review")}</span>
              </div>
            ) : (
              // Show leave review CTA
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onLeaveReview?.(appointment);
                }}
                className="flex items-center gap-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
              >
                <Star className="h-4 w-4" />
                {t("leave_review")}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Upcoming appointments: Time first (when do I need to be there?)
  return (
    <Link
      href={`/appointments/${appointment.id}`}
      className="block rounded-2xl bg-surface border border-border p-4 flex flex-col gap-4"
    >
      {/* Date & Time - smart formatting */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-foreground">
            <span className="font-semibold">{smartDate}</span>
            <span className="text-muted"> · </span>
            <span>{formattedTime}</span>
          </p>
          <p className={`text-sm mt-1 ${statusColor}`}>{statusMessage}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted shrink-0" />
      </div>

      <div className="flex items-center gap-2">
        <p className="text-foreground">{appointment.service_name}</p>
        {bundle && <DiscountBadge percentage={discountPercentage} />}
      </div>

      {/* Beauty Page Info */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white font-semibold shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">
            {appointment.beauty_page_name}
          </p>
          <p className="text-sm text-muted truncate">
            @{appointment.beauty_page_slug}
          </p>
        </div>
      </div>

      {/* Total Price */}
      <div className="flex items-center gap-2">
        {formattedOriginalPrice && !shouldCrossPrice && (
          <span className="text-sm text-muted line-through">
            {formattedOriginalPrice}
          </span>
        )}
        <span
          className={`text-xl font-bold text-foreground ${shouldCrossPrice ? "line-through" : ""}`}
        >
          {formattedPrice}
        </span>
      </div>
    </Link>
  );
}
