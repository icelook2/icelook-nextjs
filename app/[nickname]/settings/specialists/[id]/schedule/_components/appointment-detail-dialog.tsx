"use client";

import { Calendar, Clock, Mail, Phone, Scissors, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { formatPrice } from "@/lib/utils/price-range";
import {
  cancelAppointment,
  completeAppointment,
  confirmAppointment,
  markNoShow,
} from "../_actions";
import { parseDate } from "../_lib/date-utils";
import { getAppointmentStatusColor } from "../_lib/schedule-utils";
import { normalizeTime } from "../_lib/time-utils";
import type { Appointment } from "../_lib/types";

// ============================================================================
// Types for service metadata stored in client_notes
// ============================================================================

interface ServiceMetadata {
  service_ids: string[];
  services: Array<{
    id: string;
    name: string;
    price_cents: number;
    duration_minutes: number;
  }>;
}

interface ParsedNotes {
  userNotes: string | null;
  serviceMetadata: ServiceMetadata | null;
}

// ============================================================================
// Utility to parse client notes
// ============================================================================

/**
 * Parse client_notes field to separate user notes from service metadata JSON.
 *
 * The booking system stores service metadata in client_notes as JSON:
 * - If user has notes: "User notes\n\n---\n{JSON}"
 * - If no user notes: "{JSON}"
 */
function parseClientNotes(notes: string | null): ParsedNotes {
  if (!notes) {
    return { userNotes: null, serviceMetadata: null };
  }

  const trimmed = notes.trim();

  // Check if it's pure JSON (no user notes)
  if (trimmed.startsWith("{")) {
    try {
      const metadata = JSON.parse(trimmed) as ServiceMetadata;
      return { userNotes: null, serviceMetadata: metadata };
    } catch {
      // Not valid JSON, treat as user notes
      return { userNotes: notes, serviceMetadata: null };
    }
  }

  // Try to split on separator
  const separator = "\n\n---\n";
  const sepIndex = notes.indexOf(separator);
  if (sepIndex !== -1) {
    const userNotes = notes.slice(0, sepIndex).trim();
    const jsonPart = notes.slice(sepIndex + separator.length).trim();
    try {
      const metadata = JSON.parse(jsonPart) as ServiceMetadata;
      return { userNotes: userNotes || null, serviceMetadata: metadata };
    } catch {
      // JSON parsing failed, return original notes
      return { userNotes: notes, serviceMetadata: null };
    }
  }

  // No separator found, treat as user notes
  return { userNotes: notes, serviceMetadata: null };
}

interface AppointmentDetailDialogProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment;
  beautyPageId: string;
  nickname: string;
  canManage: boolean;
}

/**
 * Dialog showing appointment details with status management
 */
export function AppointmentDetailDialog({
  open,
  onClose,
  appointment,
  beautyPageId,
  nickname,
  canManage,
}: AppointmentDetailDialogProps) {
  const t = useTranslations("schedule");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const statusColors = getAppointmentStatusColor(appointment.status);
  const formattedDate = parseDate(appointment.date).toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Parse client notes to separate user notes from service metadata
  const { userNotes, serviceMetadata } = useMemo(
    () => parseClientNotes(appointment.client_notes),
    [appointment.client_notes],
  );

  // Check if we have multiple services
  const hasMultipleServices =
    serviceMetadata?.services && serviceMetadata.services.length > 1;

  function handleStatusChange(
    action: "confirm" | "complete" | "cancel" | "no_show",
  ) {
    setServerError(null);
    startTransition(async () => {
      let result: { success: boolean; error?: string } | undefined;

      switch (action) {
        case "confirm":
          result = await confirmAppointment({
            appointmentId: appointment.id,
            beautyPageId,
            nickname,
          });
          break;
        case "complete":
          result = await completeAppointment({
            appointmentId: appointment.id,
            beautyPageId,
            nickname,
          });
          break;
        case "cancel":
          result = await cancelAppointment({
            appointmentId: appointment.id,
            beautyPageId,
            nickname,
          });
          break;
        case "no_show":
          result = await markNoShow({
            appointmentId: appointment.id,
            beautyPageId,
            nickname,
          });
          break;
      }

      if (result?.success) {
        router.refresh();
        onClose();
      } else {
        setServerError(result?.error ?? "An error occurred");
      }
    });
  }

  // Determine available actions based on current status
  const availableActions = {
    pending: ["confirm", "cancel"] as const,
    confirmed: ["complete", "cancel", "no_show"] as const,
    completed: [] as const,
    cancelled: [] as const,
    no_show: [] as const,
  }[appointment.status];

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal open={open} size="lg">
        <Dialog.Header onClose={onClose}>
          {t("appointment_details")}
        </Dialog.Header>

        <Dialog.Body className="space-y-6">
          {/* Status badge */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusColors.bg} ${statusColors.text}`}
            >
              {appointment.status.charAt(0).toUpperCase() +
                appointment.status.slice(1).replace("_", " ")}
            </span>
          </div>

          {/* Client info */}
          <div className="rounded-lg bg-surface p-4">
            <h3 className="mb-3 font-medium">{t("client")}</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="size-4 text-muted" />
                <span>{appointment.client_name}</span>
              </div>
              {appointment.client_phone && (
                <a
                  href={`tel:${appointment.client_phone}`}
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Phone className="size-4" />
                  {appointment.client_phone}
                </a>
              )}
              {appointment.client_email && (
                <a
                  href={`mailto:${appointment.client_email}`}
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Mail className="size-4" />
                  {appointment.client_email}
                </a>
              )}
            </div>
          </div>

          {/* Service & Time */}
          <div className="rounded-lg bg-surface p-4">
            <h3 className="mb-3 font-medium">{t("service")}</h3>
            <div className="space-y-2">
              {/* Show itemized services if multiple, otherwise show combined name */}
              {hasMultipleServices ? (
                <div className="space-y-1.5">
                  {serviceMetadata.services.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Scissors className="size-4 text-muted" />
                        <span>{service.name}</span>
                      </div>
                      <span className="text-muted">
                        {formatPrice(
                          service.price_cents,
                          appointment.service_currency,
                          locale,
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <Scissors className="size-4 text-muted" />
                  <span>{appointment.service_name}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="size-4 text-muted" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="size-4 text-muted" />
                <span>
                  {normalizeTime(appointment.start_time)} -{" "}
                  {normalizeTime(appointment.end_time)}
                </span>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between rounded-lg bg-surface p-4">
            <span className="font-medium">{t("total")}</span>
            <span className="text-lg font-semibold">
              {formatPrice(
                appointment.service_price_cents,
                appointment.service_currency,
                locale,
              )}
            </span>
          </div>

          {/* Notes - only show actual user notes, not JSON metadata */}
          {(userNotes || appointment.specialist_notes) && (
            <div className="rounded-lg bg-surface p-4">
              <h3 className="mb-3 font-medium">{t("notes")}</h3>
              {userNotes && (
                <div className="mb-2">
                  <p className="text-xs text-muted">{t("client_note")}:</p>
                  <p className="whitespace-pre-wrap text-sm">{userNotes}</p>
                </div>
              )}
              {appointment.specialist_notes && (
                <div>
                  <p className="text-xs text-muted">{t("specialist_note")}:</p>
                  <p className="whitespace-pre-wrap text-sm">
                    {appointment.specialist_notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {serverError && <p className="text-sm text-danger">{serverError}</p>}
        </Dialog.Body>

        {canManage && availableActions.length > 0 && (
          <Dialog.Footer>
            <div className="flex flex-wrap gap-2">
              {availableActions.includes("confirm" as never) && (
                <Button
                  onClick={() => handleStatusChange("confirm")}
                  disabled={isPending}
                >
                  {t("confirm_appointment")}
                </Button>
              )}
              {availableActions.includes("complete" as never) && (
                <Button
                  onClick={() => handleStatusChange("complete")}
                  disabled={isPending}
                >
                  {t("mark_completed")}
                </Button>
              )}
              {availableActions.includes("no_show" as never) && (
                <Button
                  variant="secondary"
                  onClick={() => handleStatusChange("no_show")}
                  disabled={isPending}
                >
                  {t("mark_no_show")}
                </Button>
              )}
              {availableActions.includes("cancel" as never) && (
                <Button
                  variant="danger"
                  onClick={() => handleStatusChange("cancel")}
                  disabled={isPending}
                >
                  {t("cancel_appointment")}
                </Button>
              )}
            </div>
          </Dialog.Footer>
        )}
      </Dialog.Portal>
    </Dialog.Root>
  );
}
