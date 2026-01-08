"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { BeautyPageClient } from "@/lib/queries/clients";
import { Avatar } from "@/lib/ui/avatar";
import { SettingsRow } from "@/lib/ui/settings-group";

interface ClientRowProps {
  client: BeautyPageClient;
  nickname: string;
  noBorder?: boolean;
}

export function ClientRow({ client, nickname, noBorder }: ClientRowProps) {
  const t = useTranslations("clients");

  return (
    <SettingsRow noBorder={noBorder}>
      <Link
        href={`/${nickname}/settings/clients/${client.clientKey}`}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <Avatar size="md" name={client.clientName} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{client.clientName}</p>
              {client.isGuest && (
                <span className="shrink-0 rounded-full bg-muted/20 px-1.5 py-0.5 text-xs text-muted">
                  {t("guest_badge")}
                </span>
              )}
            </div>
            <p className="text-sm text-muted truncate">{client.clientPhone}</p>
          </div>
        </div>

        <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
      </Link>
    </SettingsRow>
  );
}
