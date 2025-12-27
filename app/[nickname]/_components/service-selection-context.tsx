"use client";

/**
 * Service Selection Context
 *
 * Manages the selection of services on a beauty page profile.
 * Handles specialist collision prevention by filtering services
 * to only show those that share at least one specialist with
 * the current selection.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  ProfileService,
  SpecialistAssignment,
} from "@/lib/queries/beauty-page-profile";
import type { AvailableSpecialist } from "./booking/_lib/booking-types";

// ============================================================================
// Types
// ============================================================================

interface ServiceSelectionContextValue {
  // State
  selectedServices: ProfileService[];

  // Derived values
  selectedServiceIds: Set<string>;
  /** Specialists who can perform ALL selected services */
  availableSpecialistIds: Set<string>;
  /** Full specialist info with total price/duration for booking dialog */
  availableSpecialists: AvailableSpecialist[];
  /** Services that share at least 1 specialist with current selection */
  compatibleServiceIds: Set<string>;
  /** Auto-selected specialist when only one can do all services */
  autoSelectedSpecialist: SpecialistAssignment | null;
  /** Total price range for selected services (considering available specialists) */
  totalPriceRange: { min: number; max: number };
  /** Total duration range for selected services (considering available specialists) */
  totalDurationRange: { min: number; max: number };

  // Actions
  toggleService: (service: ProfileService) => void;
  clearSelection: () => void;
  isServiceSelected: (serviceId: string) => boolean;
  isServiceCompatible: (service: ProfileService) => boolean;
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
  /** Flat list of all services for compatibility checking */
  allServices: ProfileService[];
}

export function ServiceSelectionProvider({
  children,
  allServices,
}: ServiceSelectionProviderProps) {
  const [selectedServices, setSelectedServices] = useState<ProfileService[]>(
    [],
  );

  // Compute derived state
  const derivedState = useMemo(() => {
    const selectedServiceIds = new Set(selectedServices.map((s) => s.id));

    // No selection - all services are compatible
    if (selectedServices.length === 0) {
      return {
        selectedServiceIds,
        availableSpecialistIds: new Set<string>(),
        availableSpecialists: [] as AvailableSpecialist[],
        compatibleServiceIds: new Set(allServices.map((s) => s.id)),
        autoSelectedSpecialist: null,
        totalPriceRange: { min: 0, max: 0 },
        totalDurationRange: { min: 0, max: 0 },
      };
    }

    // Find intersection of specialists across all selected services
    // Start with specialists from first service
    let availableSpecialistIds: Set<string> = new Set(
      selectedServices[0].assignments.map((a) => a.member_id),
    );

    // Intersect with each subsequent service's specialists
    for (const service of selectedServices.slice(1)) {
      const serviceSpecialistIds = new Set(
        service.assignments.map((a) => a.member_id),
      );
      availableSpecialistIds = new Set(
        [...availableSpecialistIds].filter((id) =>
          serviceSpecialistIds.has(id),
        ),
      );
    }

    // Find compatible services (share at least one specialist with available specialists)
    const compatibleServiceIds = new Set<string>();
    for (const service of allServices) {
      // Selected services are always compatible
      if (selectedServiceIds.has(service.id)) {
        compatibleServiceIds.add(service.id);
        continue;
      }

      // Check if adding this service would still have at least one specialist
      const wouldBeAvailable = service.assignments.some((a) =>
        availableSpecialistIds.has(a.member_id),
      );

      if (wouldBeAvailable) {
        compatibleServiceIds.add(service.id);
      }
    }

    // Auto-select specialist if only one can do all services
    let autoSelectedSpecialist: SpecialistAssignment | null = null;
    if (availableSpecialistIds.size === 1) {
      const specialistId = [...availableSpecialistIds][0];
      // Get the assignment from the first service
      autoSelectedSpecialist =
        selectedServices[0].assignments.find(
          (a) => a.member_id === specialistId,
        ) ?? null;
    }

    // Calculate total price/duration ranges (only from available specialists)
    let minPrice = 0;
    let maxPrice = 0;
    let minDuration = 0;
    let maxDuration = 0;

    for (const service of selectedServices) {
      // Only consider assignments from available specialists
      const validAssignments = service.assignments.filter((a) =>
        availableSpecialistIds.has(a.member_id),
      );

      if (validAssignments.length > 0) {
        const prices = validAssignments.map((a) => a.price_cents);
        const durations = validAssignments.map((a) => a.duration_minutes);
        minPrice += Math.min(...prices);
        maxPrice += Math.max(...prices);
        minDuration += Math.min(...durations);
        maxDuration += Math.max(...durations);
      }
    }

    // Build availableSpecialists array with total price/duration for each
    const availableSpecialists: AvailableSpecialist[] = [];
    for (const specialistId of availableSpecialistIds) {
      // Get specialist info from first service's assignment
      const firstAssignment = selectedServices[0].assignments.find(
        (a) => a.member_id === specialistId,
      );
      if (!firstAssignment) continue;

      // Calculate total price and duration for this specialist
      let totalPriceCents = 0;
      let totalDurationMinutes = 0;
      for (const service of selectedServices) {
        const assignment = service.assignments.find(
          (a) => a.member_id === specialistId,
        );
        if (assignment) {
          totalPriceCents += assignment.price_cents;
          totalDurationMinutes += assignment.duration_minutes;
        }
      }

      availableSpecialists.push({
        memberId: specialistId,
        specialistId: firstAssignment.specialist.id,
        displayName: firstAssignment.specialist.display_name ?? firstAssignment.specialist.full_name ?? "Specialist",
        avatarUrl: firstAssignment.specialist.avatar_url,
        totalPriceCents,
        totalDurationMinutes,
      });
    }

    return {
      selectedServiceIds,
      availableSpecialistIds,
      availableSpecialists,
      compatibleServiceIds,
      autoSelectedSpecialist,
      totalPriceRange: { min: minPrice, max: maxPrice },
      totalDurationRange: { min: minDuration, max: maxDuration },
    };
  }, [selectedServices, allServices]);

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

  const isServiceCompatible = useCallback(
    (service: ProfileService) =>
      derivedState.compatibleServiceIds.has(service.id),
    [derivedState.compatibleServiceIds],
  );

  const value: ServiceSelectionContextValue = useMemo(
    () => ({
      selectedServices,
      ...derivedState,
      toggleService,
      clearSelection,
      isServiceSelected,
      isServiceCompatible,
    }),
    [
      selectedServices,
      derivedState,
      toggleService,
      clearSelection,
      isServiceSelected,
      isServiceCompatible,
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
