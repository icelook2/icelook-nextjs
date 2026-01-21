"use client";

import { Clock, Package } from "lucide-react";
import type { PublicBundle } from "@/lib/types/bundles";
import { cn } from "@/lib/utils/cn";
import { useServiceSelection } from "./service-selection-context";

interface BundlesSectionProps {
  bundles: PublicBundle[];
  currency: string;
  locale: string;
  translations: {
    title: string;
    selectPackage: string;
    services: string;
  };
}

export function BundlesSection({
  bundles,
  currency,
  locale,
  translations: t,
}: BundlesSectionProps) {
  const { toggleService, selectedServiceIds, clearSelection } =
    useServiceSelection();

  if (bundles.length === 0) {
    return null;
  }

  function formatPrice(cents: number) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  }

  function formatDuration(minutes: number) {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  function handleBundleClick(bundle: PublicBundle) {
    // Clear current selection and add all bundle services with discounted prices
    clearSelection();

    const discountMultiplier = 1 - bundle.discount_percentage / 100;

    // Add each service from the bundle with its proportional discounted price
    bundle.services.forEach((service) => {
      toggleService({
        id: service.id,
        name: service.name,
        price_cents: Math.round(service.price_cents * discountMultiplier),
        duration_minutes: service.duration_minutes,
        display_order: service.display_order,
      });
    });
  }

  // Check if a bundle is currently selected (all its services are selected)
  function isBundleSelected(bundle: PublicBundle) {
    return bundle.services.every((service) =>
      selectedServiceIds.has(service.id),
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5 text-violet-600 dark:text-violet-400" />
        <h2 className="text-lg font-semibold">{t.title}</h2>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {bundles.map((bundle) => {
          const isSelected = isBundleSelected(bundle);

          return (
            <button
              key={bundle.id}
              type="button"
              onClick={() => handleBundleClick(bundle)}
              className={cn(
                "relative flex min-w-[220px] flex-col rounded-2xl border p-4 text-left transition-all",
                "bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/30 dark:to-violet-900/20",
                isSelected
                  ? "border-violet-500 ring-2 ring-violet-500/30"
                  : "border-violet-200 hover:border-violet-300 dark:border-violet-800 dark:hover:border-violet-700",
              )}
            >
              {/* Discount badge */}
              <div className="absolute -right-1 -top-1 flex items-center gap-1 rounded-full bg-violet-600 px-2 py-1 text-xs font-bold text-white">
                <span>-{bundle.discount_percentage}%</span>
              </div>

              {/* Bundle name */}
              <p className="pr-12 font-medium leading-tight">{bundle.name}</p>

              {/* Services list */}
              <div className="mt-2 space-y-0.5">
                {bundle.services.map((service) => (
                  <p key={service.id} className="text-xs text-muted">
                    {service.name}
                  </p>
                ))}
              </div>

              {/* Duration */}
              <div className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatDuration(bundle.total_duration_minutes)}</span>
              </div>

              {/* Price */}
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-lg font-semibold text-violet-600 dark:text-violet-400">
                  {formatPrice(bundle.discounted_total_cents)}
                </span>
                <span className="text-sm text-muted line-through">
                  {formatPrice(bundle.original_total_cents)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
