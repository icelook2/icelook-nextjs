"use client";

import {
  ArrowDown,
  ArrowUp,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  XCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import type {
  AppointmentsSortField,
  ClientAppointmentHistory,
  SortOrder,
} from "@/lib/queries/clients";
import { Paper } from "@/lib/ui/paper";
import { formatCurrency, formatDate } from "../../../_lib/utils";
import { AppointmentDetailDialog } from "../../_components/appointment-detail-dialog";

interface AppointmentsTableProps {
  appointments: ClientAppointmentHistory[];
  sort: AppointmentsSortField;
  order: SortOrder;
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

export function AppointmentsTable({
  appointments,
  sort,
  order,
}: AppointmentsTableProps) {
  const t = useTranslations("clients.appointments_page");
  const tStatus = useTranslations("clients.history.status");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedAppointment, setSelectedAppointment] =
    useState<ClientAppointmentHistory | null>(null);

  const handleSort = useCallback(
    (field: AppointmentsSortField) => {
      const params = new URLSearchParams(searchParams.toString());

      if (sort === field) {
        // Toggle order if same field
        params.set("order", order === "desc" ? "asc" : "desc");
      } else {
        // New field, default to desc
        params.set("sort", field);
        params.set("order", "desc");
      }

      // Reset to page 1 when sorting changes
      params.delete("page");

      router.push(`?${params.toString()}`);
    },
    [router, searchParams, sort, order],
  );

  const SortIcon = ({ field }: { field: AppointmentsSortField }) => {
    if (sort !== field) {
      return null;
    }
    return order === "asc" ? (
      <ArrowUp className="h-3 w-3" />
    ) : (
      <ArrowDown className="h-3 w-3" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Appointments Table */}
      <Paper className="overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-3 border-b border-border bg-surface-muted px-4 py-2">
          {/* Icon column spacer */}
          <div className="h-8 w-8" />

          {/* Service - sortable */}
          <button
            type="button"
            onClick={() => handleSort("service")}
            className="flex items-center gap-1 text-left text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            {t("columns.service")}
            <SortIcon field="service" />
          </button>

          {/* Date - sortable */}
          <button
            type="button"
            onClick={() => handleSort("date")}
            className="flex w-24 items-center justify-end gap-1 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            {t("columns.date")}
            <SortIcon field="date" />
          </button>

          {/* Price - sortable */}
          <button
            type="button"
            onClick={() => handleSort("price")}
            className="flex w-24 items-center justify-end gap-1 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            {t("columns.price")}
            <SortIcon field="price" />
          </button>

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
