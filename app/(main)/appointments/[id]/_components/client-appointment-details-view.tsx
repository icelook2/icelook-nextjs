"use client";

import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Info,
  MapPin,
  RefreshCcw,
  XOctagon,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { CurrentUserProfile } from "@/app/[nickname]/_components/booking/_lib/booking-types";
import type { ClientAppointment } from "@/lib/queries/appointments";
import { Avatar } from "@/lib/ui/avatar";
import { Button } from "@/lib/ui/button";
import { DiscountBadge } from "@/lib/ui/discount-badge";
import { Paper } from "@/lib/ui/paper";
import {
  calculateDiscountPercentage,
  parseAppointmentMetadata,
} from "@/lib/utils/appointment-metadata";
import { formatDuration, formatPrice } from "@/lib/utils/price-range";
import {
  type AppointmentReview,
  getAppointmentReview,
} from "../../_actions/review.actions";
import {
  QuickBookingDialog,
  type QuickBookingTranslations,
} from "../../_components/quick-booking-dialog";
import type { QuickRescheduleTranslations } from "../../_components/quick-reschedule-dialog";
import { AppointmentReviewCard } from "./appointment-review-card";
import { ClientAppointmentActionsCard } from "./client-appointment-actions-card";
import { LeaveReviewForm } from "./leave-review-form";

type Props = {
  appointment: ClientAppointment;
  /** Current user ID for rebooking */
  currentUserId?: string;
  /** Current user profile for rebooking */
  currentUserProfile?: CurrentUserProfile;
  /** Client's name (from current user profile) */
  clientName: string;
  /** Translations for quick booking dialog */
  quickBookingTranslations: QuickBookingTranslations;
  /** Translations for quick reschedule dialog */
  quickRescheduleTranslations: QuickRescheduleTranslations;
};

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    bg: "bg-emerald-100 dark:bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-500/30",
  },
  cancelled: {
    icon: XOctagon,
    bg: "bg-red-100 dark:bg-red-500/20",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-500/30",
  },
  no_show: {
    icon: AlertCircle,
    bg: "bg-amber-100 dark:bg-amber-500/20",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-500/30",
  },
  pending: {
    icon: Clock,
    bg: "bg-amber-100 dark:bg-amber-500/20",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-500/30",
  },
  confirmed: {
    icon: CheckCircle2,
    bg: "bg-emerald-100 dark:bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-500/30",
  },
};

export function ClientAppointmentDetailsView({
  appointment,
  currentUserId,
  currentUserProfile,
  clientName,
  quickBookingTranslations,
  quickRescheduleTranslations,
}: Props) {
  const t = useTranslations("appointments");
  const locale = useLocale();

  // State for quick booking dialog
  const [showBookingDialog, setShowBookingDialog] = useState(false);

  // State for review data (fetched with reply info)
  const [review, setReview] = useState<AppointmentReview | null>(null);
  const [isLoadingReview, setIsLoadingReview] = useState(false);

  // Fetch review on mount for completed appointments
  useEffect(() => {
    if (appointment.status === "completed") {
      setIsLoadingReview(true);
      getAppointmentReview(appointment.id).then((result) => {
        if (result.success && result.review) {
          setReview(result.review);
        }
        setIsLoadingReview(false);
      });
    }
  }, [appointment.id, appointment.status]);

  // Callback when review is submitted
  function handleReviewSuccess() {
    setIsLoadingReview(true);
    getAppointmentReview(appointment.id).then((result) => {
      if (result.success && result.review) {
        setReview(result.review);
      }
      setIsLoadingReview(false);
    });
  }

  // Determine if this is a past appointment
  const today = new Date().toISOString().split("T")[0];
  const isPast =
    appointment.date < today ||
    appointment.status === "completed" ||
    appointment.status === "cancelled" ||
    appointment.status === "no_show";

  const dateTime = new Date(`${appointment.date}T${appointment.start_time}`);
  const formattedDate = dateTime.toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const formattedTime = dateTime.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const formattedTotalPrice = formatPrice(
    appointment.service_price_cents,
    appointment.service_currency,
    locale,
  );

  // Duration labels for formatting
  const durationLabels = { min: t("min"), hour: t("hour") };

  const config = statusConfig[appointment.status];
  const StatusIcon = config.icon;

  return (
    <div className="space-y-4">
      {/* 1. Status Banner - Most important: what's the status? */}
      <div className={`rounded-2xl p-5 ${config.bg} border ${config.border}`}>
        <div className="flex items-center gap-3">
          <StatusIcon className={`h-8 w-8 ${config.text}`} />
          <div>
            <p className={`text-lg font-bold ${config.text}`}>
              {t(`status_${appointment.status}`)}
            </p>
            {isPast && (
              <p className={`text-sm ${config.text} opacity-80`}>
                {t(`status_message_${appointment.status}`)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 2. Date & Time - Essential "when to show up" info */}
      <div className="grid grid-cols-2 gap-3">
        <Paper className="p-4">
          <Calendar className="h-5 w-5 text-muted mb-2" />
          <p className="text-xs text-muted uppercase tracking-wide">
            {t("date_time")}
          </p>
          <p className="font-medium text-foreground mt-1">{formattedDate}</p>
        </Paper>
        <Paper className="p-4">
          <Clock className="h-5 w-5 text-muted mb-2" />
          <p className="text-xs text-muted uppercase tracking-wide">
            {t("time")}
          </p>
          <p className="font-medium text-foreground mt-1">{formattedTime}</p>
        </Paper>
      </div>

      {/* 3. Beauty Page Card - Who and where */}
      {appointment.beauty_page_slug ? (
        <Link href={`/${appointment.beauty_page_slug}`} className="block">
          <Paper className="p-4">
            <div className="flex items-center gap-3">
              <Avatar
                url={appointment.beauty_page_avatar_url}
                name={
                  appointment.beauty_page_name ||
                  appointment.creator_display_name
                }
                size="md"
                shape="rounded"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">
                  {appointment.beauty_page_name}
                </p>
                <p className="text-sm text-muted">
                  @{appointment.beauty_page_slug}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted shrink-0" />
            </div>
          </Paper>
        </Link>
      ) : (
        <Paper className="p-4">
          <div className="flex items-center gap-3">
            <Avatar
              url={appointment.beauty_page_avatar_url}
              name={
                appointment.beauty_page_name || appointment.creator_display_name
              }
              size="md"
              shape="rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">
                {appointment.beauty_page_name ||
                  appointment.creator_display_name}
              </p>
            </div>
          </div>
        </Paper>
      )}

      {/* 4. Location - Where to go */}
      {appointment.beauty_page_address && (
        <Paper className="p-4">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted shrink-0" />
            <div>
              <p className="text-xs text-muted uppercase tracking-wide mb-1">
                {t("beauty_page")}
              </p>
              <p className="text-foreground">
                {appointment.beauty_page_address}
              </p>
            </div>
          </div>
        </Paper>
      )}

      {/* 5. Services List - What was booked */}
      <ServicesSection
        appointment={appointment}
        locale={locale}
        durationLabels={durationLabels}
        formattedTotalPrice={formattedTotalPrice}
        servicesLabel={
          appointment.appointment_services.length > 1
            ? t("services")
            : t("service")
        }
        totalLabel={t("total")}
      />

      {/* 6. Actions - What can user do */}
      {isPast ? (
        appointment.canRebook ? (
          <div className="pt-2">
            <Button
              className="w-full"
              variant="primary"
              onClick={() => setShowBookingDialog(true)}
            >
              <RefreshCcw className="h-4 w-4" />
              {t("book_again")}
            </Button>
          </div>
        ) : (
          <Paper className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-muted shrink-0 mt-0.5" />
              <p className="text-sm text-muted">
                {t("cannot_rebook_service_unavailable")}
              </p>
            </div>
          </Paper>
        )
      ) : (
        <ClientAppointmentActionsCard
          appointment={appointment}
          clientName={clientName}
          rescheduleTranslations={quickRescheduleTranslations}
        />
      )}

      {/* 7. Review Section - For completed appointments */}
      {appointment.status === "completed" && (
        <div className="pt-2">
          {isLoadingReview ? (
            <Paper className="p-4">
              <div className="flex items-center justify-center py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-accent" />
              </div>
            </Paper>
          ) : review ? (
            <AppointmentReviewCard review={review} />
          ) : (
            <LeaveReviewForm
              appointmentId={appointment.id}
              onSuccess={handleReviewSuccess}
            />
          )}
        </div>
      )}

      {/* Quick Booking Dialog */}
      <QuickBookingDialog
        appointment={showBookingDialog ? appointment : null}
        onClose={() => setShowBookingDialog(false)}
        currentUserId={currentUserId}
        currentUserProfile={currentUserProfile}
        translations={quickBookingTranslations}
      />
    </div>
  );
}

// ============================================================================
// Services Section Component
// ============================================================================

interface ServicesSectionProps {
  appointment: ClientAppointment;
  locale: string;
  durationLabels: { min: string; hour: string };
  formattedTotalPrice: string;
  servicesLabel: string;
  totalLabel: string;
}

function ServicesSection({
  appointment,
  locale,
  durationLabels,
  formattedTotalPrice,
  servicesLabel,
  totalLabel,
}: ServicesSectionProps) {
  // Parse metadata to check for bundle info
  const metadata = parseAppointmentMetadata(appointment.client_notes);
  const bundle = metadata?.bundle ?? null;

  // Calculate discount percentage if bundle exists
  const discountPercentage =
    bundle && metadata
      ? calculateDiscountPercentage(
          metadata.total_original_price_cents,
          metadata.total_final_price_cents,
        )
      : 0;

  // Format original price for bundles
  const formattedOriginalPrice =
    bundle && metadata
      ? formatPrice(
          metadata.total_original_price_cents,
          appointment.service_currency,
          locale,
        )
      : null;

  return (
    <Paper className="overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        {bundle ? (
          // Bundle header with name and discount
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{bundle.name}</span>
              <DiscountBadge percentage={discountPercentage} />
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted uppercase tracking-wider font-medium">
            {servicesLabel}
          </p>
        )}
      </div>

      {/* Services list */}
      <div className="divide-y divide-border">
        {appointment.appointment_services.map((service) => (
          <div key={service.id} className="flex items-center justify-between p-4">
            <p className="font-medium text-foreground">{service.service_name}</p>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted">
                {formatDuration(service.duration_minutes, durationLabels)}
              </span>
              {/* Only show individual prices if NOT a bundle */}
              {!bundle && (
                <span className="font-medium text-foreground">
                  {formatPrice(
                    service.price_cents,
                    appointment.service_currency,
                    locale,
                  )}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Total Row */}
      <div className="flex items-center justify-between p-4 bg-surface-alt/50 border-t border-border">
        <p className="font-semibold text-foreground">{totalLabel}</p>
        <div className="flex items-center gap-2">
          {/* Show original price crossed out for bundles */}
          {formattedOriginalPrice && (
            <span className="text-sm text-muted line-through">
              {formattedOriginalPrice}
            </span>
          )}
          <p className="text-xl font-bold text-foreground">
            {formattedTotalPrice}
          </p>
        </div>
      </div>
    </Paper>
  );
}
