"use client";

import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { ClientHistorySummary } from "@/lib/queries/appointments";
import { Paper } from "@/lib/ui/paper";
import { SettingsGroup } from "@/lib/ui/settings-group";

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

function formatCurrency(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

interface LastAppointmentCardProps {
  clientHistory: ClientHistorySummary;
  nickname: string;
}

export function LastAppointmentCard({
  clientHistory,
  nickname,
}: LastAppointmentCardProps) {
  const t = useTranslations("appointments");
  const tHistory = useTranslations("clients.history");
  const locale = useLocale();
  const { lastAppointment } = clientHistory;

  if (!lastAppointment) {
    return null;
  }

  // Format date for display
  const dateTime = new Date(
    `${lastAppointment.date}T${lastAppointment.start_time}`,
  );
  const formattedDate = dateTime.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const statusConfig =
    STATUS_CONFIG[lastAppointment.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  return (
    <SettingsGroup title={t("last_appointment")}>
      <Paper className="overflow-hidden">
        <Link
          href={`/${nickname}/appointments/${lastAppointment.id}`}
          className="grid w-full grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-muted"
        >
          {/* Calendar Icon */}
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400">
            <Calendar className="h-4 w-4" />
          </div>

          {/* Service Name */}
          <span className="truncate font-medium">
            {lastAppointment.service_name}
          </span>

          {/* Date */}
          <span className="w-24 text-right text-sm text-muted">
            {formattedDate}
          </span>

          {/* Price */}
          <span className="w-24 text-right">
            {formatCurrency(
              lastAppointment.service_price_cents,
              lastAppointment.service_currency,
            )}
          </span>

          {/* Status */}
          <StatusIcon
            className={`h-5 w-5 ${statusConfig.className}`}
            aria-label={tHistory(`status.${statusConfig.label}`)}
          />

          {/* Chevron */}
          <ChevronRight className="h-4 w-4 text-muted" />
        </Link>
      </Paper>
    </SettingsGroup>
  );
}
