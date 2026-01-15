"use client";

import { Calendar, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import type { ClientAppointmentHistory } from "@/lib/queries/clients";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/price-range";
import { AppointmentDetailDialog } from "./appointment-detail-dialog";

interface ServiceAppointmentsDialogProps {
  serviceName: string | null;
  appointments: ClientAppointmentHistory[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { icon: typeof CheckCircle2; className: string }
> = {
  completed: {
    icon: CheckCircle2,
    className: "text-emerald-600 dark:text-emerald-400",
  },
  cancelled: {
    icon: XCircle,
    className: "text-red-500 dark:text-red-400",
  },
  no_show: {
    icon: XCircle,
    className: "text-amber-500 dark:text-amber-400",
  },
  pending: {
    icon: Clock,
    className: "text-blue-500 dark:text-blue-400",
  },
  confirmed: {
    icon: CheckCircle2,
    className: "text-blue-500 dark:text-blue-400",
  },
};

export function ServiceAppointmentsDialog({
  serviceName,
  appointments,
  open,
  onOpenChange,
}: ServiceAppointmentsDialogProps) {
  const t = useTranslations("clients.services.dialog");
  const tStatus = useTranslations("clients.history.status");
  const locale = useLocale();
  const [selectedAppointment, setSelectedAppointment] =
    useState<ClientAppointmentHistory | null>(null);

  if (!serviceName) {
    return null;
  }

  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal open={open} size="lg">
          <Dialog.Header onClose={() => onOpenChange(false)}>
            {t("title", { service: serviceName })}
          </Dialog.Header>

          <Dialog.Body>
            {appointments.length === 0 ? (
              <p className="py-8 text-center text-muted">
                {t("no_appointments")}
              </p>
            ) : (
              <div className="divide-y divide-border">
                {appointments.map((apt) => {
                  const status = apt.status as AppointmentStatus;
                  const statusConfig =
                    STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
                  const StatusIcon = statusConfig.icon;

                  // Format date
                  const formattedDate = new Date(apt.date).toLocaleDateString(
                    locale,
                    {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    },
                  );

                  return (
                    <button
                      key={apt.id}
                      type="button"
                      onClick={() => setSelectedAppointment(apt)}
                      className="flex w-full items-center justify-between gap-3 px-1 py-3 text-left transition-colors hover:bg-surface-muted"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/10">
                          <Calendar className="h-5 w-5 text-muted" />
                        </div>
                        <div>
                          <p className="font-medium">{formattedDate}</p>
                          <p className="text-sm text-muted">
                            {apt.startTime.slice(0, 5)} -{" "}
                            {apt.endTime.slice(0, 5)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-medium">
                          {formatPrice(
                            apt.servicePriceCents,
                            apt.serviceCurrency,
                            locale,
                          )}
                        </span>
                        <StatusIcon
                          className={cn("h-5 w-5", statusConfig.className)}
                          aria-label={tStatus(status)}
                        />
                      </div>
                    </button>
                  );
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

      {/* Appointment Detail Dialog - opens on top */}
      <AppointmentDetailDialog
        appointment={selectedAppointment}
        open={selectedAppointment !== null}
        onOpenChange={(isOpen) => !isOpen && setSelectedAppointment(null)}
      />
    </>
  );
}
