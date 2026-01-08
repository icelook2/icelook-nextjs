"use client";

import { Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { Paper } from "@/lib/ui/paper";
import { useAnalytics } from "./analytics-context";
import { formatCurrency } from "../_lib/utils";

export function TopClientsSection() {
  const t = useTranslations("analytics.clients");
  const { analytics } = useAnalytics();

  const { topClients } = analytics.clients;
  const currency = analytics.revenue.currency;

  if (topClients.length === 0) {
    return null;
  }

  return (
    <Paper className="p-4">
      <div className="mb-4 flex items-center gap-2">
        <Users className="size-5 text-on-surface-muted" />
        <h3 className="font-semibold text-on-surface">{t("top_clients")}</h3>
      </div>

      <div className="space-y-3">
        {topClients.slice(0, 5).map((client, index) => (
          <div
            key={client.clientId ?? index}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-surface-muted text-sm font-medium text-on-surface-muted">
                {index + 1}
              </span>
              <div>
                <p className="font-medium text-on-surface">{client.clientName}</p>
                <p className="text-sm text-on-surface-muted">
                  {t("visits", { count: client.appointmentCount })}
                </p>
              </div>
            </div>
            <p className="font-semibold text-on-surface">
              {formatCurrency(client.totalSpentCents, currency)}
            </p>
          </div>
        ))}
      </div>
    </Paper>
  );
}
