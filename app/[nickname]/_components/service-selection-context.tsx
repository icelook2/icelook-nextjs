"use client";

/**
 * Service Selection Context (Solo Creator Model)
 *
 * Manages the selection of services AND bundles on a beauty page profile.
 *
 * Users can combine:
 * - Multiple individual services
 * - One bundle (optionally with additional services)
 *
 * When a bundle is selected:
 * - Bundle price and duration are added to the total
 * - User can also add individual services on top
 * - Only one bundle can be selected at a time
 */

import { createContext, type ReactNode, useContext, useState } from "react";
import type { ProfileService } from "@/lib/queries/beauty-page-profile";
import type { PublicBundle } from "@/lib/types/bundles";

// ============================================================================
// Types
// ============================================================================

interface ServiceSelectionContextValue {
  // State
  selectedServices: ProfileService[];
  selectedBundle: PublicBundle | null;

  // Derived values
  selectedServiceIds: Set<string>;
  totalPriceCents: number;
  totalDurationMinutes: number;
  /** Count of selected items (services + bundle as 1 item) */
  itemCount: number;
  /** Whether anything is selected (services or bundle) */
  hasSelection: boolean;

  // Service actions
  toggleService: (service: ProfileService) => void;
  clearSelection: () => void;
  isServiceSelected: (serviceId: string) => boolean;

  // Bundle actions
  selectBundle: (bundle: PublicBundle) => void;
  clearBundle: () => void;
  isBundleSelected: (bundleId: string) => boolean;
}

// ============================================================================
// Context
// ============================================================================

const ServiceSelectionContext =
  createContext<ServiceSelectionContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface ServiceSelectionProviderProps {
  children: ReactNode;
}

export function ServiceSelectionProvider({
  children,
}: ServiceSelectionProviderProps) {
  const [selectedServices, setSelectedServices] = useState<ProfileService[]>(
    [],
  );
  const [selectedBundle, setSelectedBundle] = useState<PublicBundle | null>(
    null,
  );

  // Compute derived state (React Compiler handles optimization)
  const selectedServiceIds = new Set(selectedServices.map((s) => s.id));

  // Calculate totals - combine bundle + individual services
  let totalPriceCents = 0;
  let totalDurationMinutes = 0;

  // Add bundle totals if selected
  if (selectedBundle) {
    totalPriceCents += selectedBundle.discounted_total_cents;
    totalDurationMinutes += selectedBundle.total_duration_minutes;
  }

  // Add individual services totals
  for (const service of selectedServices) {
    totalPriceCents += service.price_cents;
    totalDurationMinutes += service.duration_minutes;
  }

  // Item count: services + bundle (bundle counts as 1 item)
  const itemCount = selectedServices.length + (selectedBundle ? 1 : 0);
  const hasSelection = itemCount > 0;

  // Service actions
  function toggleService(service: ProfileService) {
    setSelectedServices((prev) => {
      const isSelected = prev.some((s) => s.id === service.id);
      if (isSelected) {
        return prev.filter((s) => s.id !== service.id);
      }
      return [...prev, service];
    });
  }

  function clearSelection() {
    setSelectedServices([]);
    setSelectedBundle(null);
  }

  function isServiceSelected(serviceId: string) {
    return selectedServiceIds.has(serviceId);
  }

  // Bundle actions
  function selectBundle(bundle: PublicBundle) {
    // Toggle bundle selection (only one bundle at a time)
    if (selectedBundle?.id === bundle.id) {
      setSelectedBundle(null);
    } else {
      setSelectedBundle(bundle);
    }
  }

  function clearBundle() {
    setSelectedBundle(null);
  }

  function isBundleSelected(bundleId: string) {
    return selectedBundle?.id === bundleId;
  }

  const value: ServiceSelectionContextValue = {
    selectedServices,
    selectedBundle,
    selectedServiceIds,
    totalPriceCents,
    totalDurationMinutes,
    itemCount,
    hasSelection,
    toggleService,
    clearSelection,
    isServiceSelected,
    selectBundle,
    clearBundle,
    isBundleSelected,
  };

  return (
    <ServiceSelectionContext.Provider value={value}>
      {children}
    </ServiceSelectionContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useServiceSelection() {
  const context = useContext(ServiceSelectionContext);
  if (!context) {
    throw new Error(
      "useServiceSelection must be used within ServiceSelectionProvider",
    );
  }
  return context;
}
