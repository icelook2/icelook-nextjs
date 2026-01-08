"use client";

import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { ClientAppointmentHistory } from "@/lib/queries/clients";
import { Paper } from "@/lib/ui/paper";
import { formatCurrency, formatDate } from "../../_lib/utils";
import { AppointmentDetailDialog } from "./appointment-detail-dialog";

/** Maximum number of appointments to display */
const MAX_DISPLAY_COUNT = 5;

interface AppointmentHistoryProps {
  appointments: ClientAppointmentHistory[];
  nickname: string;
  clientId: string;
}

const STATUS_CONFIG: Record<
  string,
  { icon: typeof CheckCircle2; className: string; label: string }
> = {
  completed: {
    icon: CheckCircle2,
    className: "text-emerald-600 dark:text-emerald-400",
    label: "completed",
  },
  cancelled: {
    icon: XCircle,
    className: "text-red-500 dark:text-red-400",
    label: "cancelled",
  },
  no_show: {
    icon: XCircle,
    className: "text-amber-500 dark:text-amber-400",
    label: "no_show",
  },
  pending: {
    icon: Clock,
    className: "text-blue-500 dark:text-blue-400",
    label: "pending",
  },
  confirmed: {
    icon: CheckCircle2,
    className: "text-blue-500 dark:text-blue-400",
    label: "confirmed",
  },
};

export function AppointmentHistory({
  appointments,
  nickname,
  clientId,
}: AppointmentHistoryProps) {
  const t = useTranslations("clients.history");
  const [selectedAppointment, setSelectedAppointment] =
    useState<ClientAppointmentHistory | null>(null);

  if (appointments.length === 0) {
    return null;
  }

  // Show only the most recent appointments
  const displayedAppointments = appointments.slice(0, MAX_DISPLAY_COUNT);
  const hasMore = appointments.length > MAX_DISPLAY_COUNT;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-on-surface-muted">{t("title")}</h3>

      <Paper className="overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-3 border-b border-border bg-surface-muted px-4 py-2">
          {/* Icon column spacer */}
          <div className="h-8 w-8" />

          {/* Service */}
          <span className="text-sm font-medium text-muted">
            {t("columns.service")}
          </span>

          {/* Date */}
          <span className="w-24 text-right text-sm font-medium text-muted">
            {t("columns.date")}
          </span>

          {/* Price */}
          <span className="w-24 text-right text-sm font-medium text-muted">
            {t("columns.price")}
          </span>

          {/* Status column spacer */}
          <div className="h-5 w-5" />

          {/* Chevron column spacer */}
          <div className="h-4 w-4" />
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border">
          {displayedAppointments.map((apt) => {
            const statusConfig = STATUS_CONFIG[apt.status] ?? STATUS_CONFIG.pending;
            const StatusIcon = statusConfig.icon;

            return (
              <button
                key={apt.id}
                type="button"
                onClick={() => setSelectedAppointment(apt)}
                className="grid w-full grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-muted"
              >
                {/* Calendar Icon */}
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                </div>

                {/* Service Name */}
                <span className="truncate font-medium">{apt.serviceName}</span>

                {/* Date */}
                <span className="w-24 text-right text-sm text-muted">
                  {formatDate(apt.date)}
                </span>

                {/* Price */}
                <span className="w-24 text-right">
                  {formatCurrency(apt.servicePriceCents, apt.serviceCurrency)}
                </span>

                {/* Status */}
                <StatusIcon
                  className={`h-5 w-5 ${statusConfig.className}`}
                  aria-label={t(`status.${statusConfig.label}`)}
                />

                {/* Chevron */}
                <ChevronRight className="h-4 w-4 text-muted" />
              </button>
            );
          })}

          {/* Show All Link */}
          {hasMore && (
            <Link
              href={`/${nickname}/settings/clients/${clientId}/appointments`}
              className="flex items-center justify-center gap-1 px-4 py-3 text-sm text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              {t("show_all")}
              <span>({appointments.length})</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
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
