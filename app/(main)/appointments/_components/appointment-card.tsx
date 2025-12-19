"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Calendar, Clock, ExternalLink, User } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
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
import { cancelAppointment } from "../_actions/appointments.action";

interface AppointmentCardProps {
  appointment: Appointment;
  showCancelButton?: boolean;
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

export function AppointmentCard({
  appointment,
  showCancelButton = false,
}: AppointmentCardProps) {
  const t = useTranslations("appointments");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const status = statusConfig[appointment.status];

  const handleCancel = () => {
    setError(null);
    startTransition(async () => {
      const result = await cancelAppointment(appointment.id);
      if (result.success) {
        setCancelDialogOpen(false);
      } else {
        setError(result.error);
      }
    });
  };

  const formattedDate = formatDateForDisplay(appointment.date);
  const formattedTime = `${formatTimeForDisplay(appointment.start_time)} - ${formatTimeForDisplay(appointment.end_time)}`;

  return (
    <div className="rounded-xl border border-foreground/10 bg-background p-4 sm:p-6 space-y-4">
      {/* Header: Service name + Status badge */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-foreground text-lg">
            {appointment.service_name}
          </h3>
          <Link
            href={`/@${appointment.specialist_username}`}
            className="text-sm text-foreground/60 hover:text-violet-600 dark:hover:text-violet-400 inline-flex items-center gap-1 group"
          >
            <User className="h-3.5 w-3.5" />
            {appointment.specialist_display_name}
            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}
        >
          {t(status.key)}
        </span>
      </div>

      {/* Details */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-foreground/70">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-foreground/40" />
          <span>{formattedDate}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-foreground/40" />
          <span>{formattedTime}</span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <span className="text-foreground/50">
            {formatDuration(appointment.service_duration_minutes)}
          </span>
          <span className="font-medium text-foreground">
            {formatPrice(
              appointment.service_price,
              appointment.service_currency,
            )}
          </span>
        </div>
      </div>

      {/* Actions */}
      {showCancelButton && (
        <div className="flex justify-end pt-2 border-t border-foreground/5">
          <AlertDialog.Root
            open={cancelDialogOpen}
            onOpenChange={setCancelDialogOpen}
          >
            <AlertDialog.Trigger className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium">
              {t("cancel")}
            </AlertDialog.Trigger>
            <AlertDialog.Portal>
              <AnimatePresence>
                {cancelDialogOpen && (
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
                          animate={{
                            opacity: 1,
                            scale: 1,
                            x: "-50%",
                            y: "-50%",
                          }}
                          exit={{
                            opacity: 0,
                            scale: 0.95,
                            x: "-50%",
                            y: "-50%",
                          }}
                          transition={{ duration: 0.2 }}
                        />
                      }
                    >
                      <AlertDialog.Title className="text-lg font-semibold text-foreground mb-2">
                        {t("cancel_confirm_title")}
                      </AlertDialog.Title>
                      <AlertDialog.Description className="text-foreground/70 text-sm mb-6">
                        {t("cancel_confirm_message", {
                          specialist: appointment.specialist_display_name,
                          date: formattedDate,
                        })}
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
                          variant="danger"
                          size="sm"
                          onClick={handleCancel}
                          disabled={isPending}
                        >
                          {isPending ? t("cancel") + "..." : t("cancel")}
                        </Button>
                      </div>
                    </AlertDialog.Popup>
                  </>
                )}
              </AnimatePresence>
            </AlertDialog.Portal>
          </AlertDialog.Root>
        </div>
      )}
    </div>
  );
}
