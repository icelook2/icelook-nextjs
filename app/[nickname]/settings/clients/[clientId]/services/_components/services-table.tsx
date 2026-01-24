"use client";

import { ArrowDown, ArrowUp, ChevronRight, Scissors } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type {
  ServicePreference,
  ServicePreferencesSortField,
  SortOrder,
} from "@/lib/queries/clients";
import { Paper } from "@/lib/ui/paper";
import { formatCurrency } from "../../../_lib/utils";

interface ServicesTableProps {
  services: ServicePreference[];
  currency: string;
  nickname: string;
  clientId: string;
  sort: ServicePreferencesSortField;
  order: SortOrder;
  search: string;
  /** Base path for service detail links (defaults to /nickname/settings/clients/clientId) */
  basePath?: string;
}

export function ServicesTable({
  services,
  currency,
  nickname,
  clientId,
  sort,
  order,
  search,
  basePath,
}: ServicesTableProps) {
  const effectiveBasePath =
    basePath ?? `/${nickname}/settings/clients/${clientId}`;
  const t = useTranslations("clients.services_page");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handler (React Compiler handles optimization)
  function handleSort(field: ServicePreferencesSortField) {
    const params = new URLSearchParams(searchParams.toString());

    if (sort === field) {
      // Toggle order if same field
      params.set("order", order === "desc" ? "asc" : "desc");
    } else {
      // New field, default to desc
      params.set("sort", field);
      params.set("order", "desc");
    }

    // Reset to page 1 when sorting changes
    params.delete("page");

    router.push(`?${params.toString()}`);
  }

  const SortIcon = ({ field }: { field: ServicePreferencesSortField }) => {
    if (sort !== field) {
      return null;
    }
    return order === "asc" ? (
      <ArrowUp className="h-3 w-3" />
    ) : (
      <ArrowDown className="h-3 w-3" />
    );
  };

  if (services.length === 0) {
    return (
      <Paper className="px-4 py-8 text-center">
        <p className="text-sm text-muted">
          {search ? t("no_results", { search }) : t("empty")}
        </p>
      </Paper>
    );
  }

  return (
    <Paper className="overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 border-b border-border bg-surface-muted px-4 py-2">
        {/* Icon column spacer */}
        <div className="h-8 w-8" />

        {/* Name - sortable */}
        <button
          type="button"
          onClick={() => handleSort("name")}
          className="flex items-center gap-1 text-left text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          {t("columns.name")}
          <SortIcon field="name" />
        </button>

        {/* Count - sortable */}
        <button
          type="button"
          onClick={() => handleSort("count")}
          className="flex w-20 items-center justify-end gap-1 text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          {t("columns.count")}
          <SortIcon field="count" />
        </button>

        {/* Total - sortable */}
        <button
          type="button"
          onClick={() => handleSort("total")}
          className="flex w-24 items-center justify-end gap-1 text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          {t("columns.total")}
          <SortIcon field="total" />
        </button>

        {/* Chevron column spacer */}
        <div className="h-4 w-4" />
      </div>

      {/* Table Body */}
      <div className="divide-y divide-border">
        {services.map((service) => (
          <Link
            key={service.serviceName}
            href={`${effectiveBasePath}/services/${encodeURIComponent(service.serviceName)}`}
            className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-muted"
          >
            {/* Service Icon */}
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400">
              <Scissors className="h-4 w-4" />
            </div>

            {/* Service Name */}
            <span className="truncate font-medium">{service.serviceName}</span>

            {/* Count */}
            <span className="w-20 text-right text-muted">{service.count}x</span>

            {/* Total */}
            <span className="w-24 text-right">
              {formatCurrency(service.totalCents, currency)}
            </span>

            {/* Chevron */}
            <ChevronRight className="h-4 w-4 text-muted" />
          </Link>
        ))}
      </div>
    </Paper>
  );
}
