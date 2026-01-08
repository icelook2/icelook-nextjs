"use client";

import { Scissors } from "lucide-react";
import { useTranslations } from "next-intl";
import { Paper } from "@/lib/ui/paper";
import { useAnalytics } from "./analytics-context";
import { formatCurrency } from "../_lib/utils";

export function ServicesSection() {
  const t = useTranslations("analytics.services");
  const { analytics } = useAnalytics();

  const { services, revenue } = analytics;
  const currency = revenue.currency;

  if (services.length === 0) {
    return null;
  }

  // Sort by revenue descending
  const sortedServices = [...services].sort(
    (a, b) => b.revenueCents - a.revenueCents
  );

  return (
    <Paper className="p-4">
      <div className="mb-4 flex items-center gap-2">
        <Scissors className="size-5 text-on-surface-muted" />
        <h3 className="font-semibold text-on-surface">{t("title")}</h3>
      </div>

      <div className="space-y-4">
        {sortedServices.map((service) => (
          <div key={service.serviceId ?? service.serviceName}>
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="font-medium text-on-surface">
                  {service.serviceName}
                </p>
                <span className="text-sm text-on-surface-muted">
                  {t("bookings_count", { count: service.bookingCount })}
                </span>
              </div>
              <p className="font-semibold text-on-surface">
                {formatCurrency(service.revenueCents, currency)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(service.revenuePercentage, 100)}%` }}
                />
              </div>
              <span className="w-12 text-right text-sm text-on-surface-muted">
                {service.revenuePercentage.toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </Paper>
  );
}
