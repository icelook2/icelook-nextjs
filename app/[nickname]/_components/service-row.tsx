"use client";

/**
 * Service Row with Checkbox Selection
 *
 * Displays a single service with its name, duration, and price.
 * Includes a checkbox for selection in the booking flow.
 */

import { Check } from "lucide-react";
import type { ProfileService } from "@/lib/queries/beauty-page-profile";
import { cn } from "@/lib/utils/cn";
import {
  type DurationLabels,
  formatDuration,
  formatPrice,
} from "@/lib/utils/price-range";
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
  const { isServiceSelected, toggleService } = useServiceSelection();

  const isSelected = isServiceSelected(service.id);
  const priceDisplay = formatPrice(service.price_cents, currency, locale);
  const durationDisplay = formatDuration(
    service.duration_minutes,
    durationLabels,
  );

  function handleClick() {
    toggleService(service);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "group flex w-full items-center gap-3 px-4 py-3 text-left",
        isSelected && "border-l-2 border-l-accent bg-accent/5",
        !isSelected && "hover:bg-surface-hover",
      )}
    >
      {/* Selection checkbox */}
      <div
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2",
          isSelected
            ? "border-accent bg-accent text-white"
            : "border-border bg-transparent",
        )}
      >
        {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
      </div>

      {/* Service name */}
      <div className="min-w-0 flex-1">
        <div className="font-medium">{service.name}</div>
      </div>

      {/* Duration */}
      <div className="shrink-0 text-sm text-muted">{durationDisplay}</div>

      {/* Price */}
      <div className="shrink-0 text-sm font-medium">{priceDisplay}</div>
    </button>
  );
}
