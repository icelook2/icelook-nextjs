"use client";

import { useTranslations } from "next-intl";
import type { ClientDetails } from "@/lib/queries/clients";
import { Paper } from "@/lib/ui/paper";
import { formatCurrency, formatDate } from "../../_lib/utils";

interface ClientStatsProps {
  details: ClientDetails;
}

export function ClientStats({ details }: ClientStatsProps) {
  const t = useTranslations("clients.stats");
  const { client, averageSpendCents } = details;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-on-surface-muted">{t("title")}</h3>

      <div className="grid grid-cols-2 gap-3">
        {/* Row 1: Visits + Last visit */}
        <Paper className="p-4">
          <p className="text-sm text-on-surface-muted">{t("total_visits")}</p>
          <p className="mt-1 text-3xl font-bold text-on-surface">
            {client.totalVisits}
          </p>
        </Paper>

        <Paper className="p-4">
          <p className="text-sm text-on-surface-muted">{t("last_visit")}</p>
          <p className="mt-1 text-3xl font-bold text-on-surface">
            {formatDate(client.lastVisitDate)}
          </p>
        </Paper>

        {/* Row 2: Total Spent + Avg. Spend */}
        <Paper className="p-4">
          <p className="text-sm text-on-surface-muted">{t("total_spent")}</p>
          <p className="mt-1 text-3xl font-bold text-on-surface">
            {formatCurrency(client.totalSpentCents, client.currency)}
          </p>
        </Paper>

        <Paper className="p-4">
          <p className="text-sm text-on-surface-muted">{t("average_spend")}</p>
          <p className="mt-1 text-3xl font-bold text-on-surface">
            {formatCurrency(averageSpendCents, client.currency)}
          </p>
        </Paper>

        {/* Row 3: First visit */}
        <Paper className="p-4">
          <p className="text-sm text-on-surface-muted">{t("first_visit")}</p>
          <p className="mt-1 text-3xl font-bold text-on-surface">
            {formatDate(client.firstVisitDate)}
          </p>
        </Paper>
      </div>
    </div>
  );
}
