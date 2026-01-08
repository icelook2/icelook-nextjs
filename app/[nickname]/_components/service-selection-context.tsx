"use client";

/**
 * Service Selection Context (Solo Creator Model)
 *
 * Manages the selection of services on a beauty page profile.
 * Simplified from the multi-specialist model - no need for
 * specialist intersection since there's only one creator.
 */

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ProfileService } from "@/lib/queries/beauty-page-profile";

// ============================================================================
// Types
// ============================================================================

interface ServiceSelectionContextValue {
  // State
  selectedServices: ProfileService[];

  // Derived values
  selectedServiceIds: Set<string>;
  /** Total price for selected services */
  totalPriceCents: number;
  /** Total duration for selected services */
  totalDurationMinutes: number;

  // Actions
  toggleService: (service: ProfileService) => void;
  clearSelection: () => void;
  isServiceSelected: (serviceId: string) => boolean;
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

  // Compute derived state
  const derivedState = useMemo(() => {
    const selectedServiceIds = new Set(selectedServices.map((s) => s.id));

    // Calculate totals from selected services
    const totalPriceCents = selectedServices.reduce(
      (sum, s) => sum + s.price_cents,
      0,
    );
    const totalDurationMinutes = selectedServices.reduce(
      (sum, s) => sum + s.duration_minutes,
      0,
    );

    return {
      selectedServiceIds,
      totalPriceCents,
      totalDurationMinutes,
    };
  }, [selectedServices]);

  const toggleService = useCallback((service: ProfileService) => {
    setSelectedServices((prev) => {
      const isSelected = prev.some((s) => s.id === service.id);
      if (isSelected) {
        return prev.filter((s) => s.id !== service.id);
      }
      return [...prev, service];
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedServices([]);
  }, []);

  const isServiceSelected = useCallback(
    (serviceId: string) => derivedState.selectedServiceIds.has(serviceId),
    [derivedState.selectedServiceIds],
  );

  const value: ServiceSelectionContextValue = useMemo(
    () => ({
      selectedServices,
      ...derivedState,
      toggleService,
      clearSelection,
      isServiceSelected,
    }),
    [
      selectedServices,
      derivedState,
      toggleService,
      clearSelection,
      isServiceSelected,
    ],
  );

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
