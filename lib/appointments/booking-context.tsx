"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  BookingFormData,
  BookingService,
  BookingSpecialist,
  BookingStep,
  BookingTotals,
} from "./types";
import { calculateBookingTotals } from "./utils";

// ============================================================================
// Context Types
// ============================================================================

interface BookingContextValue {
  // Specialist and services info
  specialist: BookingSpecialist;
  services: BookingService[];
  totals: BookingTotals;

  // Current step
  step: BookingStep;

  // Form data (accumulated across steps)
  formData: BookingFormData;

  // User state
  isAuthenticated: boolean;
  userName: string | null;

  // Actions
  setDateTime: (date: string, timeSlot: { start: string; end: string }) => void;
  setGuestInfo: (name: string, phone: string) => void;
  setClientNotes: (notes: string) => void;
  goToStep: (step: BookingStep) => void;
  goBack: () => void;
  reset: () => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface BookingProviderProps {
  children: ReactNode;
  specialist: BookingSpecialist;
  services: BookingService[];
  isAuthenticated: boolean;
  userName: string | null;
}

export function BookingProvider({
  children,
  specialist,
  services,
  isAuthenticated,
  userName,
}: BookingProviderProps) {
  const [step, setStep] = useState<BookingStep>("datetime");

  const [formData, setFormData] = useState<BookingFormData>({
    services,
    date: null,
    timeSlot: null,
    guestName: "",
    guestPhone: "",
    clientNotes: "",
  });

  // Calculate totals from services
  const totals = useMemo(() => calculateBookingTotals(services), [services]);

  const setDateTime = useCallback(
    (date: string, timeSlot: { start: string; end: string }) => {
      setFormData((prev) => ({ ...prev, date, timeSlot }));
    },
    [],
  );

  const setGuestInfo = useCallback((name: string, phone: string) => {
    setFormData((prev) => ({ ...prev, guestName: name, guestPhone: phone }));
  }, []);

  const setClientNotes = useCallback((notes: string) => {
    setFormData((prev) => ({ ...prev, clientNotes: notes }));
  }, []);

  const goToStep = useCallback((newStep: BookingStep) => {
    setStep(newStep);
  }, []);

  const goBack = useCallback(() => {
    if (step === "confirmation") {
      // If authenticated, skip guest-info and go back to datetime
      if (isAuthenticated) {
        setStep("datetime");
      } else {
        setStep("guest-info");
      }
    } else if (step === "guest-info") {
      setStep("datetime");
    }
  }, [step, isAuthenticated]);

  const reset = useCallback(() => {
    setStep("datetime");
    setFormData({
      services,
      date: null,
      timeSlot: null,
      guestName: "",
      guestPhone: "",
      clientNotes: "",
    });
  }, [services]);

  const value = useMemo(
    () => ({
      specialist,
      services,
      totals,
      step,
      formData,
      isAuthenticated,
      userName,
      setDateTime,
      setGuestInfo,
      setClientNotes,
      goToStep,
      goBack,
      reset,
    }),
    [
      specialist,
      services,
      totals,
      step,
      formData,
      isAuthenticated,
      userName,
      setDateTime,
      setGuestInfo,
      setClientNotes,
      goToStep,
      goBack,
      reset,
    ],
  );

  return (
    <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useBooking() {
  const context = useContext(BookingContext);

  if (!context) {
    throw new Error("useBooking must be used within a BookingProvider");
  }

  return context;
}
