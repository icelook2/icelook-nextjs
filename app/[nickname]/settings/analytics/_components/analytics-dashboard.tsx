"use client";

import {
  Activity,
  Calendar,
  CheckCircle,
  Clock,
  Percent,
  Receipt,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  Wallet,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { formatCurrency } from "../_lib/utils";
import { useAnalytics } from "./analytics-context";
import { MetricCard } from "./metric-card";
import { ServicesSection } from "./services-section";
import { TopClientsSection } from "./top-clients-section";

// Icon color class constants
const ICON_COLORS = {
  emerald:
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  green: "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
  red: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400",
  purple:
    "bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
  orange:
    "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400",
};

function DashboardContent() {
  const t = useTranslations("analytics");
  const { analytics } = useAnalytics();

  const { revenue, appointments, clients, operational, averageTicketCents, averageTicketTrend } =
    analytics;

  const currency = revenue.currency;

  return (
    <div className="space-y-6">
      {/* Revenue & Tickets */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-on-surface-muted">
          {t("groups.revenue_tickets")}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            label={t("metrics.revenue")}
            value={formatCurrency(revenue.totalCents, currency)}
            icon={Wallet}
            iconClassName={ICON_COLORS.emerald}
            trend={revenue.trend !== null ? { value: revenue.trend } : null}
            infoKey="revenue"
          />
          <MetricCard
            label={t("metrics.avg_ticket")}
            value={
              averageTicketCents
                ? formatCurrency(averageTicketCents, currency)
                : "—"
            }
            icon={Receipt}
            iconClassName={ICON_COLORS.emerald}
            trend={
              averageTicketTrend !== null ? { value: averageTicketTrend } : null
            }
            infoKey="avg_ticket"
          />
        </div>
      </section>

      {/* Appointments */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-on-surface-muted">
          {t("groups.appointments")}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            label={t("appointments.total")}
            value={appointments.total.toString()}
            icon={Calendar}
            iconClassName={ICON_COLORS.blue}
            trend={
              appointments.trends.total !== null
                ? { value: appointments.trends.total }
                : null
            }
            infoKey="total_appointments"
          />
          <MetricCard
            label={t("appointments.completed")}
            value={appointments.completed.toString()}
            icon={CheckCircle}
            iconClassName={ICON_COLORS.green}
            trend={
              appointments.trends.completed !== null
                ? { value: appointments.trends.completed }
                : null
            }
            infoKey="completed"
          />
          <MetricCard
            label={t("appointments.pending")}
            value={appointments.pending.toString()}
            icon={Clock}
            iconClassName={ICON_COLORS.amber}
            infoKey="pending"
          />
          <MetricCard
            label={t("appointments.cancelled")}
            value={appointments.cancelled.toString()}
            icon={XCircle}
            iconClassName={ICON_COLORS.red}
            infoKey="cancelled"
          />
          <MetricCard
            label={t("appointments.no_show")}
            value={appointments.noShow.toString()}
            icon={UserX}
            iconClassName={ICON_COLORS.red}
            infoKey="no_show"
          />
        </div>
      </section>

      {/* Clients */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-on-surface-muted">
          {t("groups.clients")}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            label={t("clients.total_clients")}
            value={clients.total.toString()}
            icon={Users}
            iconClassName={ICON_COLORS.purple}
            trend={
              clients.trends.total !== null
                ? { value: clients.trends.total }
                : null
            }
            infoKey="total_clients"
          />
          <MetricCard
            label={t("clients.new")}
            value={clients.new.toString()}
            icon={UserPlus}
            iconClassName={ICON_COLORS.purple}
            trend={
              clients.trends.new !== null ? { value: clients.trends.new } : null
            }
            infoKey="new_clients"
          />
          <MetricCard
            label={t("clients.returning")}
            value={clients.returning.toString()}
            icon={UserCheck}
            iconClassName={ICON_COLORS.purple}
            infoKey="returning_clients"
          />
          <MetricCard
            label={t("metrics.retention")}
            value={
              clients.retentionRate !== null
                ? `${clients.retentionRate.toFixed(1)}%`
                : "—"
            }
            icon={TrendingUp}
            iconClassName={ICON_COLORS.purple}
            infoKey="retention_rate"
          />
        </div>
      </section>

      {/* Operations */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-on-surface-muted">
          {t("groups.operations")}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            label={t("metrics.fill_rate")}
            value={
              operational.fillRate !== null
                ? `${operational.fillRate.toFixed(1)}%`
                : "—"
            }
            icon={Activity}
            iconClassName={ICON_COLORS.orange}
            infoKey="fill_rate"
          />
          <MetricCard
            label={t("metrics.cancellation_rate")}
            value={`${operational.cancellationRate.toFixed(1)}%`}
            icon={Percent}
            iconClassName={ICON_COLORS.orange}
            infoKey="cancellation_rate"
          />
          <MetricCard
            label={t("metrics.no_show_rate")}
            value={`${operational.noShowRate.toFixed(1)}%`}
            icon={Percent}
            iconClassName={ICON_COLORS.orange}
            infoKey="no_show_rate"
          />
        </div>
      </section>

      {/* Existing sections */}
      <TopClientsSection />
      <ServicesSection />
    </div>
  );
}

export function AnalyticsDashboard() {
  return <DashboardContent />;
}
