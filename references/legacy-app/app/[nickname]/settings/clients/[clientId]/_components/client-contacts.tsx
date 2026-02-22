"use client";

import { Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import type { BeautyPageClient } from "@/lib/queries/clients";
import { Paper } from "@/lib/ui/paper";

interface ClientContactsProps {
  client: BeautyPageClient;
}

export function ClientContacts({ client }: ClientContactsProps) {
  const t = useTranslations("clients.contacts");

  if (!client.clientEmail) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-on-surface-muted">
        {t("title")}
      </h3>

      <Paper className="overflow-hidden">
        <a
          href={`mailto:${client.clientEmail}`}
          className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-hover"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
            <Mail className="h-4 w-4" />
          </div>
          <span className="min-w-0 flex-1 truncate">{client.clientEmail}</span>
        </a>
      </Paper>
    </div>
  );
}
