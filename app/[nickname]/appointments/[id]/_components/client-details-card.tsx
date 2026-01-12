"use client";

import { Phone } from "lucide-react";
import Link from "next/link";
import type {
  Appointment,
  ClientHistorySummary,
} from "@/lib/queries/appointments";
import { Avatar } from "@/lib/ui/avatar";
import { Paper } from "@/lib/ui/paper";

interface ClientDetailsCardProps {
  appointment: Appointment;
  clientHistory: ClientHistorySummary | null;
  clientKey: string;
  nickname: string;
}

export function ClientDetailsCard({
  appointment,
  clientHistory,
  clientKey,
  nickname,
}: ClientDetailsCardProps) {
  const totalVisits = clientHistory?.totalVisits ?? 0;
  const isReturningClient = totalVisits > 0;

  return (
    <Paper className="p-4">
      {/* Client header row */}
      <div className="flex items-center gap-3">
        <Avatar name={appointment.client_name} size="md" />

        <div className="min-w-0 flex-1">
          <Link
            href={`/${nickname}/settings/clients/${clientKey}`}
            className="group"
          >
            <p className="truncate font-semibold text-foreground group-hover:text-accent">
              {appointment.client_name}
            </p>
          </Link>

          {/* Phone number */}
          {appointment.client_phone && (
            <p className="text-sm text-muted">{appointment.client_phone}</p>
          )}
        </div>

        {/* Call button */}
        {appointment.client_phone && (
          <a
            href={`tel:${appointment.client_phone}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent transition-colors hover:bg-accent/20"
            aria-label={`Call ${appointment.client_name}`}
          >
            <Phone className="h-5 w-5" />
          </a>
        )}
      </div>

      {/* Visit count */}
      <div className="mt-3 flex items-center gap-2 text-sm">
        {isReturningClient ? (
          <span className="text-muted">
            {totalVisits} visit{totalVisits !== 1 ? "s" : ""}
          </span>
        ) : (
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
            New client
          </span>
        )}

        {!appointment.client_id && (
          <span className="rounded-full bg-muted/20 px-2 py-0.5 text-xs text-muted">
            Guest
          </span>
        )}
      </div>
    </Paper>
  );
}
