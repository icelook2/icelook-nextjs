"use client";

import { Scissors } from "lucide-react";
import type { Service } from "@/lib/queries";
import { SettingsRow } from "@/lib/ui/settings-group";
import { formatDuration, formatPrice } from "./constants";
import { ServiceMenu } from "./service-menu";

interface ServiceRowProps {
  service: Service;
  nickname: string;
  isLast: boolean;
}

export function ServiceRow({ service, nickname, isLast }: ServiceRowProps) {
  return (
    <SettingsRow
      noBorder={isLast}
      className="flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400">
          <Scissors className="h-4 w-4" />
        </div>
        <div>
          <p className="font-medium">{service.name}</p>
          <p className="text-sm text-muted">
            {formatPrice(service.price_cents)} ₴ •{" "}
            {formatDuration(service.duration_minutes)}
          </p>
        </div>
      </div>
      <ServiceMenu service={service} nickname={nickname} />
    </SettingsRow>
  );
}
