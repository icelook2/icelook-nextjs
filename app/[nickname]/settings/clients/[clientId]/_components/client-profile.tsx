"use client";

import { useTranslations } from "next-intl";
import type { BeautyPageClient } from "@/lib/queries/clients";
import { Avatar } from "@/lib/ui/avatar";

interface ClientProfileProps {
  client: BeautyPageClient;
}

export function ClientProfile({ client }: ClientProfileProps) {
  const t = useTranslations("clients.detail");

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <Avatar size="lg" name={client.clientName} />
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">{client.clientName}</h2>
        {client.isGuest && (
          <span className="shrink-0 rounded-full bg-muted/20 px-2 py-0.5 text-xs text-muted">
            {t("guest_badge")}
          </span>
        )}
      </div>
    </div>
  );
}
