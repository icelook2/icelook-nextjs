"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ClientHistorySummary } from "@/lib/queries/appointments";
import { Avatar } from "@/lib/ui/avatar";
import { Paper } from "@/lib/ui/paper";

interface ClientDetailsCardProps {
  clientName: string;
  clientId: string | null;
  clientHistory: ClientHistorySummary | null;
  clientKey: string;
  nickname: string;
}

export function ClientDetailsCard({
  clientName,
  clientId,
  clientHistory,
  clientKey,
  nickname,
}: ClientDetailsCardProps) {
  const totalVisits = clientHistory?.totalVisits ?? 0;
  const isNewClient = totalVisits === 0;
  const isGuest = !clientId;

  // Build badges array
  const badges: string[] = [];
  if (isNewClient) {
    badges.push("New client");
  } else if (totalVisits > 0) {
    badges.push(`${totalVisits} visit${totalVisits !== 1 ? "s" : ""}`);
  }
  if (isGuest) {
    badges.push("Guest");
  }

  return (
    <Paper className="p-4">
      <Link
        href={`/${nickname}/settings/clients/${clientKey}`}
        className="flex items-center gap-3"
      >
        <Avatar name={clientName} size="md" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-foreground">
            {clientName}
          </p>
          {badges.length > 0 && (
            <p className="text-sm text-muted">{badges.join(" · ")}</p>
          )}
        </div>

        <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
      </Link>
    </Paper>
  );
}
