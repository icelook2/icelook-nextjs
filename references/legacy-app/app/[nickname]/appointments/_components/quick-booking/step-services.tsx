"use client";

import { Check } from "lucide-react";
import type { ServiceGroupWithServices } from "@/lib/queries/services";
import { formatPrice } from "@/lib/utils/price-range";

interface StepServicesProps {
  serviceGroups: ServiceGroupWithServices[];
  selectedServiceIds: string[];
  currency: string;
  onToggleService: (serviceId: string) => void;
  searchQuery: string;
}

export function StepServices({
  serviceGroups,
  selectedServiceIds,
  currency,
  onToggleService,
  searchQuery,
}: StepServicesProps) {
  // Filter services based on search
  const filteredServiceGroups = serviceGroups
    .map((group) => ({
      ...group,
      services: group.services.filter((service) => {
        if (!searchQuery) {
          return true;
        }
        const searchLower = searchQuery.toLowerCase();
        return service.name.toLowerCase().includes(searchLower);
      }),
    }))
    .filter((group) => group.services.length > 0);

  return (
    <div>
      {/* Service groups */}
      <div className="pb-4">
        {filteredServiceGroups.length === 0 && searchQuery && (
          <p className="py-4 text-center text-sm text-muted">
            No services found
          </p>
        )}
        {filteredServiceGroups.map((group) => (
          <div key={group.id}>
            <h3 className="sticky top-0 bg-surface px-4 py-2 text-sm font-medium text-muted">
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
                        isSelected ? "border-accent bg-accent" : "border-border"
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
    </div>
  );
}
