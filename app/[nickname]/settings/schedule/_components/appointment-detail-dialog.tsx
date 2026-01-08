"use client";

import {
  Accessibility,
  AlertTriangle,
  Calendar,
  Clock,
  Mail,
  MessageCircle,
  Phone,
  Scissors,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { VisitPreferences } from "@/lib/types";
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
  const userNotes = parseClientNotes(appointment.client_notes);

  // Safely access visit_preferences (may not be in generated types yet)
  const visitPreferences = (
    appointment as unknown as { visit_preferences?: VisitPreferences | null }
  ).visit_preferences;

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

        <Dialog.Body className="space-y-4">
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
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted">{t("client")}</h3>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <User className="size-4 text-muted" />
                <span>{appointment.client_name || t("unknown_client")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="size-4 text-muted" />
                <span className={!appointment.client_phone ? "text-muted" : ""}>
                  {appointment.client_phone || t("no_phone_provided")}
                </span>
              </div>
              {appointment.client_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="size-4 text-muted" />
                  <span>{appointment.client_email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Service & Time */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted">{t("service")}</h3>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Scissors className="size-4 text-muted" />
                <span>{appointment.service_name}</span>
              </div>
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
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted">{t("total")}</span>
            <span className="text-lg font-semibold">
              {formatPrice(
                appointment.service_price_cents,
                appointment.service_currency,
                locale,
              )}
            </span>
          </div>

          {/* Notes - only show if there are actual user notes (not JSON metadata) */}
          {userNotes && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted">{t("notes")}</h3>
              <p className="text-sm">{userNotes}</p>
            </div>
          )}

          {/* Visit Preferences - only show if client specified preferences */}
          {visitPreferences && (
            <VisitPreferencesDisplay
              preferences={visitPreferences}
              translations={{
                title: t("visit_preferences"),
                communication: t("communication_label"),
                communicationQuiet: t("communication_quiet"),
                communicationFriendly: t("communication_friendly"),
                communicationChatty: t("communication_chatty"),
                accessibilityWheelchair: t("accessibility_wheelchair"),
                accessibilityHearing: t("accessibility_hearing"),
                accessibilityVision: t("accessibility_vision"),
                accessibilitySensory: t("accessibility_sensory"),
                allergies: t("allergies_label"),
              }}
            />
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

// ============================================================================
// Helpers
// ============================================================================

/**
 * Parse client notes to extract actual user notes from JSON metadata.
 *
 * The booking action stores service metadata as JSON in client_notes:
 * - With user notes: `<user_notes>\n\n---\n<json_metadata>`
 * - Without user notes: just `<json_metadata>`
 *
 * This function extracts only the user-provided notes, filtering out the JSON.
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

// ============================================================================
// Visit Preferences Display
// ============================================================================

interface VisitPreferencesDisplayProps {
  preferences: VisitPreferences;
  translations: {
    title: string;
    communication: string;
    communicationQuiet: string;
    communicationFriendly: string;
    communicationChatty: string;
    accessibilityWheelchair: string;
    accessibilityHearing: string;
    accessibilityVision: string;
    accessibilitySensory: string;
    allergies: string;
  };
}

function VisitPreferencesDisplay({
  preferences,
  translations,
}: VisitPreferencesDisplayProps) {
  const { communication, accessibility, allergies } = preferences;

  // Map communication preference to translation
  const getCommunicationLabel = () => {
    switch (communication) {
      case "quiet":
        return translations.communicationQuiet;
      case "friendly":
        return translations.communicationFriendly;
      case "chatty":
        return translations.communicationChatty;
      default:
        return null;
    }
  };

  // Map accessibility need to translation
  const getAccessibilityLabel = (need: string) => {
    switch (need) {
      case "wheelchair":
        return translations.accessibilityWheelchair;
      case "hearing_impaired":
        return translations.accessibilityHearing;
      case "vision_impaired":
        return translations.accessibilityVision;
      case "sensory_sensitivity":
        return translations.accessibilitySensory;
      default:
        return need;
    }
  };

  const communicationLabel = getCommunicationLabel();
  const hasAccessibility = accessibility && accessibility.length > 0;
  const hasAllergies = allergies && allergies.trim().length > 0;

  // Don't render if no preferences are set
  if (!communicationLabel && !hasAccessibility && !hasAllergies) {
    return null;
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-muted">
        {translations.title}
      </h3>
      <div className="space-y-2">
        {/* Communication preference */}
        {communicationLabel && (
          <div className="flex items-center gap-2 text-sm">
            <MessageCircle className="size-4 text-muted" />
            <span>{communicationLabel}</span>
          </div>
        )}

        {/* Accessibility needs */}
        {hasAccessibility && (
          <div className="flex items-start gap-2 text-sm">
            <Accessibility className="mt-0.5 size-4 text-muted" />
            <div className="flex flex-wrap gap-1">
              {accessibility.map((need) => (
                <span
                  key={need}
                  className="rounded-full bg-surface-muted px-2 py-0.5 text-xs"
                >
                  {getAccessibilityLabel(need)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Allergies */}
        {hasAllergies && (
          <div className="flex items-start gap-2 text-sm">
            <AlertTriangle className="mt-0.5 size-4 text-warning" />
            <span className="text-warning">{allergies}</span>
          </div>
        )}
      </div>
    </div>
  );
}
