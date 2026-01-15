"use client";

import { Check, Search } from "lucide-react";
import { useDeferredValue, useState } from "react";
import type { ServiceGroupWithServices } from "@/lib/queries/services";
import { formatPrice } from "@/lib/utils/price-range";

interface StepServicesProps {
  serviceGroups: ServiceGroupWithServices[];
  selectedServiceIds: string[];
  currency: string;
  onToggleService: (serviceId: string) => void;
  showSearch: boolean;
}

export function StepServices({
  serviceGroups,
  selectedServiceIds,
  currency,
  onToggleService,
  showSearch,
}: StepServicesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);

  // Clear search when hiding
  const effectiveSearch = showSearch ? deferredSearch : "";

  // Filter services based on search
  const filteredServiceGroups = serviceGroups
    .map((group) => ({
      ...group,
      services: group.services.filter((service) => {
        if (!effectiveSearch) {
          return true;
        }
        const searchLower = effectiveSearch.toLowerCase();
        return service.name.toLowerCase().includes(searchLower);
      }),
    }))
    .filter((group) => group.services.length > 0);

  return (
    <div className={showSearch ? "flex flex-col-reverse" : ""}>
      {/* Service groups */}
      <div className="pb-4">
        {filteredServiceGroups.length === 0 && effectiveSearch && (
          <p className="py-4 text-center text-sm text-muted">
            No services found
          </p>
        )}
        {filteredServiceGroups.map((group) => (
          <div key={group.id}>
            <h3
              className={`sticky bg-surface px-4 py-2 text-sm font-medium text-muted ${
                showSearch ? "top-[68px]" : "top-0"
              }`}
            >
              {group.name}
            </h3>
            <div>
              {group.services.map((service) => {
                const isSelected = selectedServiceIds.includes(service.id);

                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => onToggleService(service.id)}
                    className={`flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition-colors ${
                      isSelected
                        ? "border-l-accent bg-accent/5"
                        : "border-l-transparent hover:bg-surface-hover"
                    }`}
                  >
                    {/* Checkbox */}
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                        isSelected
                          ? "border-accent bg-accent"
                          : "border-border"
                      }`}
                    >
                      {isSelected && (
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      )}
                    </div>

                    {/* Service name */}
                    <div className="min-w-0 flex-1">
                      <span className="font-medium">{service.name}</span>
                    </div>

                    {/* Price */}
                    <span className="shrink-0 text-sm font-medium">
                      {formatPrice(service.price_cents, currency)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Search - rendered after content in DOM so it stacks on top, but appears first due to flex-col-reverse */}
      {showSearch && (
        <div className="sticky top-0 bg-surface px-4 pb-2 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-4 text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>
      )}
    </div>
  );
}
