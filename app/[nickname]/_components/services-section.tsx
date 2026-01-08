"use client";

/**
 * Services Section with Selection
 *
 * Displays services grouped by category.
 * Each service row includes a checkbox for booking selection.
 */

import type { ProfileServiceGroup } from "@/lib/queries/beauty-page-profile";
import type { DurationLabels } from "@/lib/utils/price-range";
import { ServiceRow } from "./service-row";

// ============================================================================
// Types
// ============================================================================

interface ServicesSectionProps {
  serviceGroups: ProfileServiceGroup[];
  title: string;
  emptyMessage: string;
  currency?: string;
  locale?: string;
  durationLabels: DurationLabels;
}

// ============================================================================
// Component
// ============================================================================

export function ServicesSection({
  serviceGroups,
  title,
  emptyMessage,
  currency = "UAH",
  locale = "uk-UA",
  durationLabels,
}: ServicesSectionProps) {
  // Filter groups that have at least one service
  const groupsWithServices = serviceGroups.filter(
    (group) => group.services.length > 0,
  );

  const isEmpty = groupsWithServices.length === 0;

  return (
    <section>
      {/* Section header */}
      {title && <h2 className="mb-4 text-lg font-semibold">{title}</h2>}

      {/* Empty state */}
      {isEmpty && (
        <div className="rounded-2xl border border-border bg-surface px-4 py-8 text-center">
          <p className="text-muted">{emptyMessage}</p>
        </div>
      )}

      {/* Service groups */}
      {!isEmpty && (
        <div className="space-y-3">
          {groupsWithServices.map((group) => (
            <ServiceGroupCard
              key={group.id}
              group={group}
              currency={currency}
              locale={locale}
              durationLabels={durationLabels}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ============================================================================
// Service Group Card
// ============================================================================

interface ServiceGroupCardProps {
  group: ProfileServiceGroup;
  currency?: string;
  locale?: string;
  durationLabels: DurationLabels;
}

function ServiceGroupCard({
  group,
  currency = "UAH",
  locale = "uk-UA",
  durationLabels,
}: ServiceGroupCardProps) {
  if (group.services.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      {/* Group header */}
      <div className="px-4 py-3">
        <div className="font-semibold">{group.name}</div>
      </div>

      {/* Services list */}
      <div className="divide-y divide-border border-t border-border">
        {group.services.map((service) => (
          <ServiceRow
            key={service.id}
            service={service}
            currency={currency}
            locale={locale}
            durationLabels={durationLabels}
          />
        ))}
      </div>
    </div>
  );
}
