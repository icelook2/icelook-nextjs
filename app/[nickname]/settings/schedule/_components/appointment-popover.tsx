"use client";

import {
  Ban,
  Calendar,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  Scissors,
  User,
  UserX,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { ReactElement, ReactNode } from "react";
import { useState, useTransition } from "react";
import { Popover } from "@/lib/ui/popover";
import { cn } from "@/lib/utils/cn";
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

interface AppointmentPopoverProps {
  appointment: Appointment;
  beautyPageId: string;
  nickname: string;
  canManage: boolean;
  children: ReactElement;
  /** Controlled open state (optional) */
  open?: boolean;
  /** Callback when open state should change (optional) */
  onOpenChange?: (open: boolean) => void;
}

/**
 * Popover showing appointment details with quick actions
 * Similar to Google Calendar's event popover pattern
 */
export function AppointmentPopover({
  appointment,
  beautyPageId,
  nickname,
  canManage,
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: AppointmentPopoverProps) {
  const t = useTranslations("schedule");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [internalOpen, setInternalOpen] = useState(false);

  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (value: boolean) => controlledOnOpenChange?.(value)
    : setInternalOpen;

  const statusColors = getAppointmentStatusColor(appointment.status);
  const formattedDate = parseDate(appointment.date).toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Determine available actions based on current status
  const availableActions = {
    pending: ["confirm", "cancel"] as const,
    confirmed: ["complete", "cancel", "no_show"] as const,
    completed: [] as const,
    cancelled: [] as const,
    no_show: [] as const,
  }[appointment.status];

  function handleAction(action: "confirm" | "complete" | "cancel" | "no_show") {
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
        setOpen(false);
      }
    });
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger render={children} />
      <Popover.Portal>
        <Popover.Content
          className="w-72 p-0"
          side="right"
          align="start"
          sideOffset={8}
        >
          {/* Quick Actions Toolbar */}
          {canManage && availableActions.length > 0 && (
            <div className="flex items-center justify-end gap-1 border-b border-border px-2 py-1.5">
              {availableActions.includes("confirm" as never) && (
                <ActionButton
                  onClick={() => handleAction("confirm")}
                  disabled={isPending}
                  title={t("confirm_appointment")}
                  variant="success"
                >
                  <CheckCircle className="size-4" />
                </ActionButton>
              )}
              {availableActions.includes("complete" as never) && (
                <ActionButton
                  onClick={() => handleAction("complete")}
                  disabled={isPending}
                  title={t("mark_completed")}
                  variant="success"
                >
                  <CheckCircle className="size-4" />
                </ActionButton>
              )}
              {availableActions.includes("no_show" as never) && (
                <ActionButton
                  onClick={() => handleAction("no_show")}
                  disabled={isPending}
                  title={t("mark_no_show")}
                  variant="muted"
                >
                  <UserX className="size-4" />
                </ActionButton>
              )}
              {availableActions.includes("cancel" as never) && (
                <ActionButton
                  onClick={() => handleAction("cancel")}
                  disabled={isPending}
                  title={t("cancel_appointment")}
                  variant="danger"
                >
                  <Ban className="size-4" />
                </ActionButton>
              )}
              <div className="mx-1 h-4 w-px bg-border" />
              <ActionButton
                onClick={() => setOpen(false)}
                title={t("close")}
                variant="muted"
              >
                <X className="size-4" />
              </ActionButton>
            </div>
          )}

          {/* Content */}
          <div className="space-y-3 p-3">
            {/* Title with status indicator */}
            <div className="flex items-start gap-2">
              <div
                className={cn("mt-1.5 size-3 shrink-0 rounded-sm", statusColors.bg)}
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-medium leading-tight">
                  {appointment.client_name || t("unknown_client")}
                </h3>
                <p className="text-xs text-muted">
                  {appointment.status.charAt(0).toUpperCase() +
                    appointment.status.slice(1).replace("_", " ")}
                </p>
              </div>
            </div>

            {/* Date & Time */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="size-4 shrink-0 text-muted" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="size-4 shrink-0 text-muted" />
                <span>
                  {normalizeTime(appointment.start_time)} –{" "}
                  {normalizeTime(appointment.end_time)}
                </span>
              </div>
            </div>

            {/* Contact info */}
            <div className="space-y-1.5">
              {appointment.client_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="size-4 shrink-0 text-muted" />
                  <span>{appointment.client_phone}</span>
                </div>
              )}
              {appointment.client_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="size-4 shrink-0 text-muted" />
                  <span className="truncate">{appointment.client_email}</span>
                </div>
              )}
              {!appointment.client_phone && !appointment.client_email && (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <User className="size-4 shrink-0" />
                  <span>{t("no_contact_info")}</span>
                </div>
              )}
            </div>

            {/* Service & Price */}
            <div className="flex items-center justify-between border-t border-border pt-3">
              <div className="flex items-center gap-2 text-sm">
                <Scissors className="size-4 shrink-0 text-muted" />
                <span className="truncate">{appointment.service_name}</span>
              </div>
              <span className="shrink-0 font-medium">
                {formatPrice(
                  appointment.service_price_cents,
                  appointment.service_currency,
                  locale,
                )}
              </span>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

// ============================================================================
// Action Button - icon button for quick actions
// ============================================================================

interface ActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  variant: "success" | "danger" | "muted";
  children: ReactNode;
}

function ActionButton({
  onClick,
  disabled,
  title,
  variant,
  children,
}: ActionButtonProps) {
  const variantStyles = {
    success: "hover:bg-success/10 hover:text-success",
    danger: "hover:bg-danger/10 hover:text-danger",
    muted: "hover:bg-surface-alt",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "rounded-md p-1.5 text-muted transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        variantStyles[variant],
      )}
    >
      {children}
    </button>
  );
}
