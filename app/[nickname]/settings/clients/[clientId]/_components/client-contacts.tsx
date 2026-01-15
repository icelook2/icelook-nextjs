"use client";

import { Mail, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import type { BeautyPageClient } from "@/lib/queries/clients";
import { Paper } from "@/lib/ui/paper";

interface ClientContactsProps {
  client: BeautyPageClient;
}

export function ClientContacts({ client }: ClientContactsProps) {
  const t = useTranslations("clients.contacts");

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-on-surface-muted">
        {t("title")}
      </h3>

      <Paper className="divide-y divide-border overflow-hidden">
        {/* Phone */}
        <a
          href={`tel:${client.clientPhone}`}
          className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-hover"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">
            <Phone className="h-4 w-4" />
          </div>
          <span className="min-w-0 flex-1">{client.clientPhone}</span>
        </a>

        {/* Email */}
        {client.clientEmail && (
          <a
            href={`mailto:${client.clientEmail}`}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-hover"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
              <Mail className="h-4 w-4" />
            </div>
            <span className="min-w-0 flex-1 truncate">
              {client.clientEmail}
            </span>
          </a>
        )}
      </Paper>
    </div>
  );
}
