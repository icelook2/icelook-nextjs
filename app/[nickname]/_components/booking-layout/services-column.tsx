"use client";

/**
 * Services Column
 *
 * Displays services in the horizontal booking layout.
 * Uses BookingLayoutContext for selection and compatibility.
 * Incompatible services are grayed out but remain in place.
 */

import { Collapsible } from "@base-ui/react/collapsible";
import { Check, ChevronDown } from "lucide-react";
import type { ProfileService, ProfileServiceGroup } from "@/lib/queries/beauty-page-profile";
import {
  calculateServicePriceInfo,
  type DurationLabels,
  formatDurationRange,
  formatPriceRange,
} from "@/lib/utils/price-range";
import { cn } from "@/lib/utils/cn";
import { useBookingLayout } from "./booking-layout-context";

// ============================================================================
// Types
// ============================================================================

interface ServicesColumnProps {
  serviceGroups: ProfileServiceGroup[];
  title: string;
  currency?: string;
  locale?: string;
  durationLabels: DurationLabels;
}

// ============================================================================
// Component
// ============================================================================

export function ServicesColumn({
  serviceGroups,
  title,
  currency = "UAH",
  locale = "uk-UA",
  durationLabels,
}: ServicesColumnProps) {
  // Filter groups that have at least one service with assignments
  const groupsWithServices = serviceGroups.filter((group) =>
    group.services.some((s) => s.assignments.length > 0),
  );

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="pb-3">
        <h3 className="text-base font-semibold">{title}</h3>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {groupsWithServices.map((group, index) => (
          <ServiceGroupCardLayout
            key={group.id}
            group={group}
            defaultOpen={index === 0}
            currency={currency}
            locale={locale}
            durationLabels={durationLabels}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Service Group Card (for layout)
// ============================================================================

interface ServiceGroupCardLayoutProps {
  group: ProfileServiceGroup;
  defaultOpen?: boolean;
  currency?: string;
  locale?: string;
  durationLabels: DurationLabels;
}

function ServiceGroupCardLayout({
  group,
  defaultOpen = false,
  currency = "UAH",
  locale = "uk-UA",
  durationLabels,
}: ServiceGroupCardLayoutProps) {
  // Filter services that have at least one specialist assigned
  const servicesWithAssignments = group.services.filter(
    (s) => s.assignments.length > 0,
  );

  // Don't render if no services with assignments
  if (servicesWithAssignments.length === 0) {
    return null;
  }

  return (
    <Collapsible.Root defaultOpen={defaultOpen}>
      <Collapsible.Trigger className="group flex w-full items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-left transition-colors hover:bg-surface-hover data-[panel-open]:rounded-b-none data-[panel-open]:border-b-0">
        <div className="min-w-0 flex-1">
          <div className="font-semibold">{group.name}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">
            {servicesWithAssignments.length}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform duration-200 group-data-[panel-open]:rotate-180" />
        </div>
      </Collapsible.Trigger>

      <Collapsible.Panel className="overflow-hidden rounded-b-2xl border border-t-0 border-border bg-surface transition-all duration-200 data-[ending-style]:h-0 data-[starting-style]:h-0">
        <div className="divide-y divide-border">
          {servicesWithAssignments.map((service) => (
            <ServiceRowLayout
              key={service.id}
              service={service}
              currency={currency}
              locale={locale}
              durationLabels={durationLabels}
            />
          ))}
        </div>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}

// ============================================================================
// Service Row (for layout)
// ============================================================================

interface ServiceRowLayoutProps {
  service: ProfileService;
  currency?: string;
  locale?: string;
  durationLabels: DurationLabels;
}

function ServiceRowLayout({
  service,
  currency = "UAH",
  locale = "uk-UA",
  durationLabels,
}: ServiceRowLayoutProps) {
  const { isServiceSelected, isServiceCompatible, toggleService } =
    useBookingLayout();

  const priceInfo = calculateServicePriceInfo(service.assignments);

  // Don't show services with no specialists assigned
  if (priceInfo.specialistCount === 0) {
    return null;
  }

  const isSelected = isServiceSelected(service.id);
  const isCompatible = isServiceCompatible(service.id);
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
