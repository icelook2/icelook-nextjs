"use client";

import { Check } from "lucide-react";
import type { ProfileService } from "@/lib/queries/beauty-page-profile";
import {
  calculateServicePriceInfo,
  type DurationLabels,
  formatDurationRange,
  formatPriceRange,
} from "@/lib/utils/price-range";
import { cn } from "@/lib/utils/cn";
import { useServiceSelection } from "./service-selection-context";

interface ServiceRowProps {
  service: ProfileService;
  currency?: string;
  locale?: string;
  durationLabels: DurationLabels;
}

export function ServiceRow({
  service,
  currency = "UAH",
  locale = "uk-UA",
  durationLabels,
}: ServiceRowProps) {
  const { isServiceSelected, isServiceCompatible, toggleService } =
    useServiceSelection();

  const priceInfo = calculateServicePriceInfo(service.assignments);

  // Don't show services with no specialists assigned
  if (priceInfo.specialistCount === 0) {
    return null;
  }

  const isSelected = isServiceSelected(service.id);
  const isCompatible = isServiceCompatible(service);
  const isDisabled = !isCompatible && !isSelected;

  const priceDisplay = formatPriceRange(priceInfo, currency, locale);
  const durationDisplay = formatDurationRange(priceInfo, durationLabels);

  function handleClick() {
    if (!isDisabled) {
      toggleService(service);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className={cn(
        "group flex w-full items-center gap-3 px-4 py-3 text-left transition-all",
        isSelected && "border-l-2 border-l-accent bg-accent/5",
        !isSelected && !isDisabled && "hover:bg-surface-hover",
        isDisabled && "cursor-not-allowed opacity-50",
      )}
    >
      {/* Selection checkbox */}
      <div
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
          isSelected
            ? "border-accent bg-accent text-white"
            : "border-border bg-transparent",
        )}
      >
        {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
      </div>

      {/* Service name */}
      <div className="min-w-0 flex-1">
        <div className={cn("font-medium", isDisabled && "text-muted")}>
          {service.name}
        </div>
      </div>

      {/* Duration */}
      <div className="shrink-0 text-sm text-muted">{durationDisplay}</div>

      {/* Price */}
      <div
        className={cn("shrink-0 text-sm font-medium", isDisabled && "text-muted")}
      >
        {priceDisplay}
      </div>
    </button>
  );
}
