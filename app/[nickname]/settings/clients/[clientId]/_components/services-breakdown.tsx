import { ChevronRight, Scissors } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ClientDetails } from "@/lib/queries/clients";
import { Paper } from "@/lib/ui/paper";
import { formatCurrency } from "../../_lib/utils";

/** Maximum number of services to display */
const MAX_DISPLAY_COUNT = 5;

interface ServicesBreakdownProps {
  details: ClientDetails;
  nickname: string;
  clientId: string;
}

export function ServicesBreakdown({
  details,
  nickname,
  clientId,
}: ServicesBreakdownProps) {
  const t = useTranslations("clients.services");
  const { servicesBreakdown, client } = details;

  if (servicesBreakdown.length === 0) {
    return null;
  }

  // Show only top services (already sorted by count from query)
  const displayedServices = servicesBreakdown.slice(0, MAX_DISPLAY_COUNT);
  const hasMore = servicesBreakdown.length > MAX_DISPLAY_COUNT;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-on-surface-muted">{t("title")}</h3>

      <Paper className="overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 border-b border-border bg-surface-muted px-4 py-2">
          {/* Icon column spacer */}
          <div className="h-8 w-8" />

          {/* Name */}
          <span className="text-sm font-medium text-muted">
            {t("columns.name")}
          </span>

          {/* Count */}
          <span className="w-16 text-right text-sm font-medium text-muted">
            {t("columns.count")}
          </span>

          {/* Total */}
          <span className="w-24 text-right text-sm font-medium text-muted">
            {t("columns.total")}
          </span>

          {/* Chevron column spacer */}
          <div className="h-4 w-4" />
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border">
          {displayedServices.map((service) => (
            <Link
              key={service.serviceName}
              href={`/${nickname}/settings/clients/${clientId}/services/${encodeURIComponent(service.serviceName)}`}
              className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-muted"
            >
              {/* Service Icon */}
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400">
                <Scissors className="h-4 w-4" />
              </div>

              {/* Service Name */}
              <span className="truncate font-medium">{service.serviceName}</span>

              {/* Count */}
              <span className="w-16 text-right text-muted">{service.count}x</span>

              {/* Total */}
              <span className="w-24 text-right">
                {formatCurrency(service.totalCents, client.currency)}
              </span>

              {/* Chevron */}
              <ChevronRight className="h-4 w-4 text-muted" />
            </Link>
          ))}

          {/* Show All Link */}
          {hasMore && (
            <Link
              href={`/${nickname}/settings/clients/${clientId}/services`}
              className="flex items-center justify-center gap-1 px-4 py-3 text-sm text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              {t("show_all")}
              <span>({servicesBreakdown.length})</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </Paper>
    </div>
  );
}
