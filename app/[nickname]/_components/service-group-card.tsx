"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { ChevronDown } from "lucide-react";
import type { ProfileServiceGroup } from "@/lib/queries/beauty-page-profile";
import type { DurationLabels } from "@/lib/utils/price-range";
import { ServiceRow } from "./service-row";

interface ServiceGroupCardProps {
  group: ProfileServiceGroup;
  defaultOpen?: boolean;
  currency?: string;
  locale?: string;
  durationLabels: DurationLabels;
}

export function ServiceGroupCard({
  group,
  defaultOpen = false,
  currency = "UAH",
  locale = "uk-UA",
  durationLabels,
}: ServiceGroupCardProps) {
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
            <ServiceRow
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
