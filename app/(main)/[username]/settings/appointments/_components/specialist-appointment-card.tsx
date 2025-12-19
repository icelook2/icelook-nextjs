"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Calendar, Clock, MessageSquare, Phone, User } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { Appointment, AppointmentStatus } from "@/lib/appointments";
import {
  formatDateForDisplay,
  formatDuration,
  formatPrice,
  formatTimeForDisplay,
} from "@/lib/appointments";
import { Button } from "@/lib/ui/button";
import { updateAppointmentStatus } from "../_actions/specialist-appointments.action";

interface SpecialistAppointmentCardProps {
  appointment: Appointment;
  showActions?: boolean;
  specialistUsername: string;
}

const statusConfig: Record<
  AppointmentStatus,
  { bg: string; text: string; key: string }
> = {
  pending: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    key: "status_pending",
  },
  confirmed: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-400",
    key: "status_confirmed",
  },
  completed: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    key: "status_completed",
  },
  cancelled: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    key: "status_cancelled",
  },
  no_show: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-600 dark:text-gray-400",
    key: "status_no_show",
  },
};

type ActionType = "confirm" | "complete" | "cancel" | "no_show";

export function SpecialistAppointmentCard({
  appointment,
  showActions = false,
}: SpecialistAppointmentCardProps) {
  const t = useTranslations("specialist.settings.appointments");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<ActionType | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const status = statusConfig[appointment.status];
  const formattedDate = formatDateForDisplay(appointment.date);
  const formattedTime = `${formatTimeForDisplay(appointment.start_time)} - ${formatTimeForDisplay(appointment.end_time)}`;

  const openDialog = (action: ActionType) => {
    setActionType(action);
    setError(null);
    setDialogOpen(true);
  };

  const handleAction = () => {
    if (!actionType) {
      return;
    }

    const statusMap: Record<ActionType, AppointmentStatus> = {
      confirm: "confirmed",
      complete: "completed",
      cancel: "cancelled",
      no_show: "no_show",
    };

    setError(null);
    startTransition(async () => {
      const result = await updateAppointmentStatus({
        appointmentId: appointment.id,
        status: statusMap[actionType],
      });
      if (result.success) {
        setDialogOpen(false);
        setActionType(null);
      } else {
        setError(result.error);
      }
    });
  };

  const getDialogContent = () => {
    if (!actionType) {
      return {
        title: "",
        message: "",
        confirmText: "",
        variant: "primary" as const,
      };
    }

    const content: Record<
      ActionType,
      {
        title: string;
        message: string;
        confirmText: string;
        variant: "primary" | "danger";
      }
    > = {
      confirm: {
        title: t("confirm_title"),
        message: t("confirm_message", {
          client: appointment.client_name,
          date: formattedDate,
        }),
        confirmText: t("yes_confirm"),
        variant: "primary",
      },
      complete: {
        title: t("complete_title"),
        message: t("complete_message", { client: appointment.client_name }),
        confirmText: t("yes_complete"),
        variant: "primary",
      },
      cancel: {
        title: t("cancel_title"),
        message: t("cancel_message", { client: appointment.client_name }),
        confirmText: t("yes_cancel"),
        variant: "danger",
      },
      no_show: {
        title: t("no_show_title"),
        message: t("no_show_message", { client: appointment.client_name }),
        confirmText: t("yes_no_show"),
        variant: "danger",
      },
    };

    return content[actionType];
  };

  const dialogContent = getDialogContent();

  return (
    <div className="rounded-xl border border-foreground/10 bg-background p-4 space-y-3">
      {/* Header: Service name + Status badge */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-foreground">
            {appointment.service_name}
          </h3>
          <div className="flex items-center gap-4 text-sm text-foreground/60 mt-1">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {formattedTime}
            </span>
          </div>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${status.bg} ${status.text}`}
        >
          {t(status.key)}
        </span>
      </div>

      {/* Client info */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <div className="flex items-center gap-1.5 text-foreground">
          <User className="h-3.5 w-3.5 text-foreground/40" />
          {appointment.client_name}
        </div>
        <div className="flex items-center gap-1.5 text-foreground/70">
          <Phone className="h-3.5 w-3.5 text-foreground/40" />
          {appointment.client_phone}
        </div>
        {appointment.client_notes && (
          <div className="flex items-center gap-1.5 text-foreground/60 basis-full mt-1">
            <MessageSquare className="h-3.5 w-3.5 text-foreground/40 flex-shrink-0" />
            <span className="line-clamp-1">{appointment.client_notes}</span>
          </div>
        )}
      </div>

      {/* Price & duration */}
      <div className="flex items-center justify-between text-sm pt-2 border-t border-foreground/5">
        <span className="text-foreground/50">
          {formatDuration(appointment.service_duration_minutes)}
        </span>
        <span className="font-medium text-foreground">
          {formatPrice(appointment.service_price, appointment.service_currency)}
        </span>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-foreground/5">
          {appointment.status === "pending" && (
            <button
              type="button"
              onClick={() => openDialog("confirm")}
              className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
            >
              {t("confirm")}
            </button>
          )}
          {appointment.status === "confirmed" && (
            <button
              type="button"
              onClick={() => openDialog("complete")}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              {t("complete")}
            </button>
          )}
          {["pending", "confirmed"].includes(appointment.status) && (
            <>
              <button
                type="button"
                onClick={() => openDialog("cancel")}
                className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={() => openDialog("no_show")}
                className="text-xs font-medium text-foreground/50 hover:text-foreground/70"
              >
                {t("mark_no_show")}
              </button>
            </>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialog.Portal>
          <AnimatePresence>
            {dialogOpen && (
              <>
                <AlertDialog.Backdrop
                  render={
                    <motion.div
                      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    />
                  }
                />
                <AlertDialog.Popup
                  render={
                    <motion.div
                      className="fixed left-1/2 top-1/2 z-50 w-full max-w-md bg-background rounded-xl border border-foreground/10 shadow-xl p-6"
                      initial={{
                        opacity: 0,
                        scale: 0.95,
                        x: "-50%",
                        y: "-50%",
                      }}
                      animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                      exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
                      transition={{ duration: 0.2 }}
                    />
                  }
                >
                  <AlertDialog.Title className="text-lg font-semibold text-foreground mb-2">
                    {dialogContent.title}
                  </AlertDialog.Title>
                  <AlertDialog.Description className="text-foreground/70 text-sm mb-6">
                    {dialogContent.message}
                  </AlertDialog.Description>

                  {error && (
                    <p className="text-sm text-red-600 dark:text-red-400 mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30">
                      {error}
                    </p>
                  )}

                  <div className="flex justify-end gap-3">
                    <AlertDialog.Close
                      className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground rounded-lg hover:bg-foreground/5 transition-colors"
                      disabled={isPending}
                    >
                      {t("keep")}
                    </AlertDialog.Close>
                    <Button
                      variant={dialogContent.variant}
                      size="sm"
                      onClick={handleAction}
                      disabled={isPending}
                    >
                      {isPending ? "..." : dialogContent.confirmText}
                    </Button>
                  </div>
                </AlertDialog.Popup>
              </>
            )}
          </AnimatePresence>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
