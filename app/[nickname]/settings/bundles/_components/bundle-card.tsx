"use client";

import { CalendarDays, Clock, Hash, Package, Scissors, Trash2 } from "lucide-react";
import type { ServiceBundleWithServices } from "@/lib/types/bundles";
import { Button } from "@/lib/ui/button";
import { SettingsRow } from "@/lib/ui/settings-group";
import { cn } from "@/lib/utils/cn";
import { formatDuration, formatPrice } from "../_lib/bundles-constants";

interface BundleCardProps {
  bundle: ServiceBundleWithServices;
  variant: "active" | "inactive";
  noBorder?: boolean;
  onToggleActive: (bundle: ServiceBundleWithServices) => void;
  onDelete: (bundle: ServiceBundleWithServices) => void;
  isPending: boolean;
  translations: {
    services: string;
    activate: string;
    deactivate: string;
    inactive: string;
    daysRemaining: string;
    quantityRemaining: string;
    expired: string;
    soldOut: string;
  };
  locale: string;
  currency: string;
}

export function BundleCard({
  bundle,
  variant,
  noBorder,
  onToggleActive,
  onDelete,
  isPending,
  translations: t,
  locale,
  currency,
}: BundleCardProps) {
  // Calculate availability badges
  const hasTimeLimit = bundle.valid_from || bundle.valid_until;
  const hasQuantityLimit = bundle.max_quantity !== null;
  const remainingQuantity =
    hasQuantityLimit && bundle.max_quantity
      ? bundle.max_quantity - bundle.booked_count
      : null;

  if (variant === "active") {
    return (
      <SettingsRow noBorder={noBorder}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{bundle.name}</p>
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-500/20 dark:text-violet-400">
                  {bundle.discount_type === "fixed"
                    ? `-${formatPrice(bundle.discount_value, locale, currency)}`
                    : `-${bundle.discount_percentage}%`}
                </span>
                {/* Time limit badge */}
                {hasTimeLimit && bundle.availability.daysRemaining !== undefined && (
                  <span
                    className={cn(
                      "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      bundle.availability.daysRemaining <= 3
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
                    )}
                  >
                    <CalendarDays className="h-3 w-3" />
                    {t.daysRemaining.replace(
                      "{days}",
                      String(bundle.availability.daysRemaining),
                    )}
                  </span>
                )}
                {/* Quantity limit badge */}
                {hasQuantityLimit && remainingQuantity !== null && (
                  <span
                    className={cn(
                      "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      remainingQuantity <= 3
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
                    )}
                  >
                    <Hash className="h-3 w-3" />
                    {t.quantityRemaining
                      .replace("{remaining}", String(remainingQuantity))
                      .replace("{total}", String(bundle.max_quantity))}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted">
                <Scissors className="h-3.5 w-3.5" />
                <span>
                  {bundle.services.length} {t.services}
                </span>
                <Clock className="ml-1 h-3.5 w-3.5" />
                <span>{formatDuration(bundle.total_duration_minutes)}</span>
              </div>
              <p className="mt-0.5 text-sm">
                <span className="text-muted line-through">
                  {formatPrice(bundle.original_total_cents, locale, currency)}
                </span>{" "}
                <span className="font-medium text-violet-600 dark:text-violet-400">
                  {formatPrice(bundle.discounted_total_cents, locale, currency)}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleActive(bundle)}
              disabled={isPending}
            >
              {t.deactivate}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-danger hover:bg-danger/10"
              onClick={() => onDelete(bundle)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SettingsRow>
    );
  }

  // Inactive variant
  return (
    <SettingsRow noBorder={noBorder}>
      <div className="flex items-center justify-between opacity-60">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/20">
            <Package className="h-5 w-5 text-muted" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{bundle.name}</p>
              <span className="rounded-full bg-muted/20 px-2 py-0.5 text-xs font-medium text-muted">
                {t.inactive}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted">
              <Scissors className="h-3.5 w-3.5" />
              <span>
                {bundle.services.length} {t.services}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleActive(bundle)}
            disabled={isPending}
          >
            {t.activate}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-danger hover:bg-danger/10"
            onClick={() => onDelete(bundle)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </SettingsRow>
  );
}
