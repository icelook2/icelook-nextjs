"use client";

import { format, parseISO } from "date-fns";
import { ArrowRight, History } from "lucide-react";
import Link from "next/link";
import { Paper } from "@/lib/ui/paper";
import type { ClientHistorySummary } from "@/lib/queries/appointments";

interface ClientHistoryCardProps {
  history: ClientHistorySummary;
  nickname: string;
  clientKey: string;
}

export function ClientHistoryCard({
  history,
  nickname,
  clientKey,
}: ClientHistoryCardProps) {

  return (
    <Paper className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <History className="h-4 w-4 text-muted" />
        <h3 className="text-sm font-medium text-muted">Client History</h3>
      </div>

      <div className="space-y-3">
        {/* Stats row */}
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="font-semibold text-foreground">
              {history.totalVisits}
            </span>{" "}
            <span className="text-muted">
              {history.totalVisits === 1 ? "visit" : "visits"}
            </span>
          </div>
          <div className="text-muted">•</div>
          <div>
            <span className="font-semibold text-foreground">
              {(history.totalSpentCents / 100).toFixed(0)}
            </span>{" "}
            <span className="text-muted">{history.currency} total</span>
          </div>
        </div>

        {/* Last visit */}
        {history.lastVisitDate && (
          <p className="text-sm text-muted">
            Last visit:{" "}
            <span className="text-foreground">
              {format(parseISO(history.lastVisitDate), "MMM d, yyyy")}
            </span>
          </p>
        )}

        {/* Top services */}
        {history.topServices.length > 0 && (
          <div className="text-sm">
            <span className="text-muted">Top services: </span>
            <span className="text-foreground">
              {history.topServices
                .map((s) => `${s.serviceName} (${s.count})`)
                .join(", ")}
            </span>
          </div>
        )}

        {/* Link to full client page */}
        <Link
          href={`/${nickname}/settings/clients/${clientKey}`}
          className="mt-2 inline-flex items-center gap-1 text-sm text-accent transition-colors hover:text-accent/80"
        >
          View full history
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </Paper>
  );
}
