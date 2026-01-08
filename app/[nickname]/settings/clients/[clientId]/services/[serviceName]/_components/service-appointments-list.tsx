"use client";

import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  XCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import type { ClientAppointmentHistory } from "@/lib/queries/clients";
import { Paper } from "@/lib/ui/paper";
import { formatCurrency } from "../../../../_lib/utils";
import { AppointmentDetailDialog } from "../../../_components/appointment-detail-dialog";

interface ServiceAppointmentsListProps {
  appointments: ClientAppointmentHistory[];
  totalCount: number;
  totalSpentCents: number;
  currency: string;
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

export function ServiceAppointmentsList({
  appointments,
  totalCount,
  totalSpentCents,
  currency,
}: ServiceAppointmentsListProps) {
  const t = useTranslations("clients.service_detail");
  const tStatus = useTranslations("clients.history.status");
  const locale = useLocale();
  const [selectedAppointment, setSelectedAppointment] =
    useState<ClientAppointmentHistory | null>(null);

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted">
          {t("appointments_title")}
        </h3>
        <div className="text-sm text-muted">
          <span className="font-medium text-foreground">{totalCount}</span>{" "}
          {t("appointments_count")} ·{" "}
          {formatCurrency(totalSpentCents, currency)}
        </div>
      </div>

      {/* Appointments Table */}
      <Paper className="overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-3 border-b border-border bg-surface-muted px-4 py-2">
          {/* Icon column spacer */}
          <div className="h-8 w-8" />

          {/* Date */}
          <span className="text-sm font-medium text-muted">
            {t("columns.date")}
          </span>

          {/* Time */}
          <span className="w-24 text-right text-sm font-medium text-muted">
            {t("columns.time")}
          </span>

          {/* Price */}
          <span className="w-20 text-right text-sm font-medium text-muted">
            {t("columns.price")}
          </span>

          {/* Status column spacer */}
          <div className="h-5 w-5" />

          {/* Chevron column spacer */}
          <div className="h-4 w-4" />
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border">
          {appointments.map((apt) => {
            const status = apt.status as AppointmentStatus;
            const statusConfig = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
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

            // Format time
            const formattedTime = `${apt.startTime.slice(0, 5)} - ${apt.endTime.slice(0, 5)}`;

            return (
              <button
                key={apt.id}
                type="button"
                onClick={() => setSelectedAppointment(apt)}
                className="grid w-full grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-muted"
              >
                {/* Calendar Icon */}
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400">
                  <Calendar className="h-4 w-4" />
                </div>

                {/* Date */}
                <span className="truncate font-medium">{formattedDate}</span>

                {/* Time */}
                <span className="w-24 text-right text-sm text-muted">
                  {formattedTime}
                </span>

                {/* Price */}
                <span className="w-20 text-right">
                  {formatCurrency(apt.servicePriceCents, apt.serviceCurrency)}
                </span>

                {/* Status */}
                <StatusIcon
                  className={`h-5 w-5 ${statusConfig.className}`}
                  aria-label={tStatus(status)}
                />

                {/* Chevron */}
                <ChevronRight className="h-4 w-4 text-muted" />
              </button>
            );
          })}
        </div>
      </Paper>

      {/* Appointment Detail Dialog */}
      <AppointmentDetailDialog
        appointment={selectedAppointment}
        open={selectedAppointment !== null}
        onOpenChange={(open) => !open && setSelectedAppointment(null)}
      />
    </div>
  );
}
