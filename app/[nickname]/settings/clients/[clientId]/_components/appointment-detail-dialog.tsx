"use client";

import { Calendar, Clock, FileText, MessageSquare, Scissors } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ClientAppointmentHistory } from "@/lib/queries/clients";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { cn } from "@/lib/utils/cn";
import { formatDuration, formatPrice } from "@/lib/utils/price-range";

interface AppointmentDetailDialogProps {
  appointment: ClientAppointmentHistory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";

const statusStyles: Record<AppointmentStatus, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  confirmed: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
  completed: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  cancelled: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400",
  no_show: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
};

export function AppointmentDetailDialog({
  appointment,
  open,
  onOpenChange,
}: AppointmentDetailDialogProps) {
  const t = useTranslations("clients.appointment_detail");
  const tStatus = useTranslations("clients.history.status");
  const locale = useLocale();

  if (!appointment) {
    return null;
  }

  // Format date
  const dateTime = new Date(`${appointment.date}T${appointment.startTime}`);
  const formattedDate = dateTime.toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Format time range
  const formattedTime = `${appointment.startTime.slice(0, 5)} - ${appointment.endTime.slice(0, 5)}`;

  // Format price
  const formattedPrice = formatPrice(
    appointment.servicePriceCents,
    appointment.serviceCurrency,
    locale,
  );

  // Format duration
  const durationLabels = { min: t("min"), hour: t("hour") };
  const formattedDuration = formatDuration(
    appointment.serviceDurationMinutes,
    durationLabels,
  );

  // Check for valid notes (not JSON metadata)
  const hasClientNotes =
    appointment.clientNotes &&
    !appointment.clientNotes.trim().startsWith("{") &&
    !appointment.clientNotes.trim().startsWith("[");

  // Parse client notes (may have JSON appended)
  const clientNotes = hasClientNotes ? parseClientNotes(appointment.clientNotes) : null;

  const status = appointment.status as AppointmentStatus;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal open={open}>
        <Dialog.Header onClose={() => onOpenChange(false)}>
          {t("title")}
        </Dialog.Header>

        <Dialog.Body className="space-y-4">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex rounded-full px-3 py-1 text-sm font-medium",
                statusStyles[status] ?? statusStyles.pending,
              )}
            >
              {tStatus(status)}
            </span>
          </div>

          {/* Service */}
          <DetailRow icon={Scissors} label={t("service")}>
            <span className="font-medium">{appointment.serviceName}</span>
          </DetailRow>

          {/* Date */}
          <DetailRow icon={Calendar} label={t("date")}>
            <span>{formattedDate}</span>
          </DetailRow>

          {/* Time */}
          <DetailRow icon={Clock} label={t("time")}>
            <span>
              {formattedTime} ({formattedDuration})
            </span>
          </DetailRow>

          {/* Price */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm font-medium text-muted">{t("price")}</span>
            <span className="text-lg font-semibold">{formattedPrice}</span>
          </div>

          {/* Client Notes */}
          {clientNotes && (
            <DetailRow icon={MessageSquare} label={t("client_notes")}>
              <p className="text-sm">{clientNotes}</p>
            </DetailRow>
          )}

          {/* Creator Notes */}
          {appointment.creatorNotes && (
            <DetailRow icon={FileText} label={t("your_notes")}>
              <p className="text-sm">{appointment.creatorNotes}</p>
            </DetailRow>
          )}

          {/* Cancellation info */}
          {appointment.status === "cancelled" && appointment.cancelledAt && (
            <div className="rounded-lg bg-surface-muted p-3 text-sm text-muted">
              {t("cancelled_at", {
                date: new Date(appointment.cancelledAt).toLocaleDateString(locale, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              })}
            </div>
          )}
        </Dialog.Body>

        <Dialog.Footer className="justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("close")}
          </Button>
        </Dialog.Footer>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ============================================================================
// Detail Row Component
// ============================================================================

interface DetailRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}

function DetailRow({ icon: Icon, label, children }: DetailRowProps) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted">{label}</p>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Parse client notes to extract actual user notes from JSON metadata.
 */
function parseClientNotes(notes: string | null): string | null {
  if (!notes) {
    return null;
  }

  const trimmed = notes.trim();

  // If notes start with JSON, there are no user notes
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return null;
  }

  // If there's a separator, get content before it
  const separator = "\n\n---\n";
  const separatorIndex = notes.indexOf(separator);
  if (separatorIndex !== -1) {
    const userPart = notes.substring(0, separatorIndex).trim();
    return userPart || null;
  }

  return notes;
}
