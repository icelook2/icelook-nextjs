"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { BeautyPageClient } from "@/lib/queries/clients";
import { Avatar } from "@/lib/ui/avatar";
import { SettingsRow } from "@/lib/ui/settings-group";

interface ClientRowProps {
  client: BeautyPageClient;
  nickname: string;
  noBorder?: boolean;
}

export function ClientRow({ client, nickname, noBorder }: ClientRowProps) {
  return (
    <SettingsRow noBorder={noBorder}>
      <Link
        href={`/${nickname}/settings/clients/${client.clientId}`}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <Avatar size="md" name={client.clientName} />
          <div className="min-w-0">
            <p className="font-medium truncate">{client.clientName}</p>
            {client.clientEmail && (
              <p className="text-sm text-muted truncate">
                {client.clientEmail}
              </p>
            )}
          </div>
        </div>

        <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
      </Link>
    </SettingsRow>
  );
}
