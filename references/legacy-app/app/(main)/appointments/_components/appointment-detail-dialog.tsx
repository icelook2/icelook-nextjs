"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { ClientAppointment } from "@/lib/queries/appointments";
import type { Enums } from "@/lib/supabase/database.types";
import { Avatar } from "@/lib/ui/avatar";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { formatDuration, formatPrice } from "@/lib/utils/price-range";
import { cancelClientAppointment } from "../_actions/appointment.actions";
import { CancelAppointmentDialog } from "../[id]/_components/cancel-appointment-dialog";
import { StatusBadge } from "./status-badge";

interface AppointmentDetailDialogProps {
  appointment: ClientAppointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppointmentDetailDialog({
  appointment,
  open,
  onOpenChange,
}: AppointmentDetailDialogProps) {
  const t = useTranslations("appointments");
  const locale = useLocale();
  const format = useFormatter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  if (!appointment) {
    return null;
  }

  const canCancel =
    appointment.status === "pending" || appointment.status === "confirmed";
  const today = new Date().toISOString().split("T")[0];
  const isUpcoming = appointment.date >= today;
  const showCancel = canCancel && isUpcoming;

  // Format date and time
  const dateTime = new Date(`${appointment.date}T${appointment.start_time}`);
  const formattedDate = dateTime.toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = dateTime.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Format price using utility
  const formattedPrice = formatPrice(
    appointment.service_price_cents,
    appointment.service_currency,
    locale,
  );

  // Format duration using utility with localized labels
  const durationLabels = { min: t("min"), hour: t("hour") };
  const formattedDuration = formatDuration(
    appointment.service_duration_minutes,
    durationLabels,
  );

  // Check if notes are valid user notes (not JSON metadata)
  const hasValidNotes =
    appointment.client_notes &&
    !appointment.client_notes.trim().startsWith("{") &&
    !appointment.client_notes.trim().startsWith("[");

  // Format the appointment date for the cancel dialog
  const cancelDialogDate = format.dateTime(new Date(appointment.date), {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  function handleCancelClick() {
    setCancelDialogOpen(true);
  }

  function handleConfirmCancel(reason: Enums<"client_cancellation_reason">) {
    if (!appointment) {
      return;
    }
    const appointmentId = appointment.id;
    setError(null);
    startTransition(async () => {
      const result = await cancelClientAppointment(appointmentId, reason);
      if (result.success) {
        setCancelDialogOpen(false);
        onOpenChange(false);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal open={open}>
        <Dialog.Header onClose={() => onOpenChange(false)}>
          {appointment.service_name}
        </Dialog.Header>
        <Dialog.Body>
          <div className="space-y-4">
            {/* Status */}
            <SummaryRow label={t("status_label")}>
              <StatusBadge status={appointment.status} />
            </SummaryRow>

            {/* Beauty Page */}
            {appointment.beauty_page_name && (
              <SummaryRow label={t("beauty_page")}>
                <div className="flex items-center gap-2">
                  <Avatar
                    url={appointment.beauty_page_avatar_url}
                    name={appointment.beauty_page_name}
                    size="sm"
                    shape="rounded"
                  />
                  <div>
                    {appointment.beauty_page_slug ? (
                      <Link
                        href={`/${appointment.beauty_page_slug}`}
                        className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                        onClick={() => onOpenChange(false)}
                      >
                        {appointment.beauty_page_name}
                        <ExternalLink className="size-3.5" />
                      </Link>
                    ) : (
                      <span className="font-medium text-foreground">
                        {appointment.beauty_page_name}
                      </span>
                    )}
                    {appointment.beauty_page_address && (
                      <div className="text-sm text-muted">
                        {appointment.beauty_page_address}
                      </div>
                    )}
                  </div>
                </div>
              </SummaryRow>
            )}

            {/* Service */}
            <SummaryRow label={t("service")}>
              <span className="font-medium text-foreground">
                {appointment.service_name}
              </span>
            </SummaryRow>

            {/* Creator */}
            <SummaryRow label={t("specialist")}>
              <div className="flex items-center gap-2">
                <Avatar
                  url={appointment.creator_avatar_url}
                  name={appointment.creator_display_name}
                  size="sm"
                />
                <span className="font-medium text-foreground">
                  {appointment.creator_display_name}
                </span>
              </div>
            </SummaryRow>

            {/* Date & Time */}
            <SummaryRow label={t("date_time")}>
              <div>
                <div className="font-medium text-foreground">
                  {formattedDate}
                </div>
                <div className="text-sm text-muted">
                  {formattedTime} ({formattedDuration})
                </div>
              </div>
            </SummaryRow>

            {/* Price */}
            <SummaryRow label={t("price")}>
              <span className="font-semibold text-foreground">
                {formattedPrice}
              </span>
            </SummaryRow>

            {/* Notes - only show if valid user notes */}
            {hasValidNotes && (
              <SummaryRow label={t("notes")}>
                <p className="text-foreground">{appointment.client_notes}</p>
              </SummaryRow>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}
          </div>
        </Dialog.Body>

        {showCancel ? (
          <Dialog.Footer className="justify-end">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              {t("keep")}
            </Button>
            <Button variant="danger" onClick={handleCancelClick}>
              {t("cancel")}
            </Button>
          </Dialog.Footer>
        ) : (
          <Dialog.Footer className="justify-end">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              {t("close")}
            </Button>
          </Dialog.Footer>
        )}
      </Dialog.Portal>

      <CancelAppointmentDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleConfirmCancel}
        specialistName={appointment.creator_display_name}
        appointmentDate={cancelDialogDate}
        isPending={isPending}
      />
    </Dialog.Root>
  );
}

// ============================================================================
// Summary Row - matches booking confirmation step pattern
// ============================================================================

interface SummaryRowProps {
  label: string;
  children: React.ReactNode;
}

function SummaryRow({ label, children }: SummaryRowProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-24 shrink-0 pt-0.5 text-xs uppercase tracking-wide text-muted">
        {label}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
