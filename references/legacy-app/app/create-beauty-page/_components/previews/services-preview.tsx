"use client";

import { Clock, Scissors } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatDuration, formatPrice } from "../../_lib/constants";
import type { ServiceData } from "../../_lib/types";

interface ServicesPreviewProps {
  services: ServiceData[];
}

/**
 * Preview component for the Services step.
 * Shows a list of service cards or an empty state.
 */
export function ServicesPreview({ services }: ServicesPreviewProps) {
  const t = useTranslations("create_beauty_page.services");

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-hover">
          <Scissors className="h-6 w-6 text-muted" />
        </div>
        <p className="text-sm text-muted">{t("preview_empty")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        {t("preview_count", { count: services.length })}
      </p>

      <div className="space-y-2">
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    </div>
  );
}

function ServiceCard({ service }: { service: ServiceData }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
      {/* Icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-500/20">
        <Scissors className="h-5 w-5 text-violet-700 dark:text-violet-400" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{service.name}</p>
        <p className="flex items-center gap-2 text-sm text-muted">
          <span>{formatPrice(service.priceCents)} UAH</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatDuration(service.durationMinutes)}
          </span>
        </p>
      </div>
    </div>
  );
}
