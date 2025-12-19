"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { BookingService, Currency } from "@/lib/appointments";

interface ServiceSelectionTotals {
  totalPrice: number;
  totalDurationMinutes: number;
  currency: Currency;
}

interface ServiceSelectionContextValue {
  selectedServices: BookingService[];
  isSelected: (serviceId: string) => boolean;
  toggleService: (service: BookingService) => void;
  clearSelection: () => void;
  totals: ServiceSelectionTotals | null;
}

const ServiceSelectionContext =
  createContext<ServiceSelectionContextValue | null>(null);

interface ServiceSelectionProviderProps {
  children: ReactNode;
}

export function ServiceSelectionProvider({
  children,
}: ServiceSelectionProviderProps) {
  const [selectedServices, setSelectedServices] = useState<BookingService[]>(
    [],
  );

  const isSelected = useCallback(
    (serviceId: string) => {
      return selectedServices.some((s) => s.id === serviceId);
    },
    [selectedServices],
  );

  const toggleService = useCallback((service: BookingService) => {
    setSelectedServices((prev) => {
      const exists = prev.some((s) => s.id === service.id);
      if (exists) {
        return prev.filter((s) => s.id !== service.id);
      }
      return [...prev, service];
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedServices([]);
  }, []);

  const totals = useMemo<ServiceSelectionTotals | null>(() => {
    if (selectedServices.length === 0) {
      return null;
    }

    const currency = selectedServices[0].currency;
    // Check if all services have same currency
    const hasMixedCurrencies = selectedServices.some(
      (s) => s.currency !== currency,
    );
    if (hasMixedCurrencies) {
      // Return null or handle mixed currencies case
      return null;
    }

    return {
      totalPrice: selectedServices.reduce((sum, s) => sum + s.price, 0),
      totalDurationMinutes: selectedServices.reduce(
        (sum, s) => sum + s.duration_minutes,
        0,
      ),
      currency: currency as Currency,
    };
  }, [selectedServices]);

  const value = useMemo<ServiceSelectionContextValue>(
    () => ({
      selectedServices,
      isSelected,
      toggleService,
      clearSelection,
      totals,
    }),
    [selectedServices, isSelected, toggleService, clearSelection, totals],
  );

  return (
    <ServiceSelectionContext.Provider value={value}>
      {children}
    </ServiceSelectionContext.Provider>
  );
}

export function useServiceSelection() {
  const context = useContext(ServiceSelectionContext);
  if (!context) {
    throw new Error(
      "useServiceSelection must be used within ServiceSelectionProvider",
    );
  }
  return context;
}
