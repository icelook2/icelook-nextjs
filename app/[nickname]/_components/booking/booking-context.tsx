"use client";

/**
 * Booking Context
 *
 * Manages state for the multi-step booking dialog flow.
 * Handles step navigation, selections, and booking submission.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ProfileService } from "@/lib/queries/beauty-page-profile";
import { createBooking } from "./_actions/booking.actions";
import { calculateEndTime } from "./_lib/slot-generation";
import type {
  AvailableSpecialist,
  BookingResult,
  BookingState,
  BookingStep,
  CurrentUserProfile,
  GuestInfo,
} from "./_lib/booking-types";

// ============================================================================
// Types
// ============================================================================

interface BookingContextValue extends BookingState {
  // Navigation
  goToStep: (step: BookingStep) => void;
  goBack: () => void;
  canGoBack: boolean;

  // Selections
  selectSpecialist: (specialist: AvailableSpecialist) => void;
  selectDate: (date: Date) => void;
  selectTime: (time: string) => void;
  setGuestInfo: (info: GuestInfo) => void;

  // Submission
  submitBooking: () => Promise<void>;

  // Reset
  reset: () => void;

  // Derived from props
  beautyPageId: string;
  selectedServices: ProfileService[];
  availableSpecialists: AvailableSpecialist[];
  timezone: string;
  currency: string;
  locale: string;
  currentUserId?: string;
  currentUserProfile?: CurrentUserProfile;
}

/** Initial state for starting at a specific step */
export interface BookingInitialState {
  /** Skip to this step */
  step: BookingStep;
  /** Pre-selected specialist */
  specialist: AvailableSpecialist;
  /** Pre-selected date */
  date: Date;
  /** Pre-selected time */
  time: string;
}

interface BookingProviderProps {
  children: ReactNode;
  beautyPageId: string;
  selectedServices: ProfileService[];
  availableSpecialists: AvailableSpecialist[];
  timezone: string;
  currency: string;
  locale: string;
  currentUserId?: string;
  currentUserProfile?: CurrentUserProfile;
  onClose: () => void;
  /** Optional initial state for skipping to a specific step */
  initialState?: BookingInitialState;
}

// ============================================================================
// Context
// ============================================================================

const BookingContext = createContext<BookingContextValue | null>(null);

// ============================================================================
// Hook
// ============================================================================

export function useBooking(): BookingContextValue {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
}

// ============================================================================
// Provider
// ============================================================================

export function BookingProvider({
  children,
  beautyPageId,
  selectedServices,
  availableSpecialists,
  timezone,
  currency,
  locale,
  currentUserId,
  currentUserProfile,
  onClose,
  initialState,
}: BookingProviderProps) {
  // Determine initial step based on initialState or number of specialists
  const computedInitialStep: BookingStep = initialState
    ? initialState.step
    : availableSpecialists.length > 1
      ? "specialist"
      : "date";

  // Initial specialist from initialState or if only one available
  const computedInitialSpecialist: AvailableSpecialist | null = initialState
    ? initialState.specialist
    : availableSpecialists.length === 1
      ? availableSpecialists[0]
      : null;

  // Initial date and time from initialState
  const computedInitialDate = initialState?.date ?? null;
  const computedInitialTime = initialState?.time ?? null;

  // State
  const [step, setStep] = useState<BookingStep>(computedInitialStep);
  const [specialist, setSpecialist] = useState<AvailableSpecialist | null>(
    computedInitialSpecialist,
  );
  const [date, setDate] = useState<Date | null>(computedInitialDate);
  const [time, setTime] = useState<string | null>(computedInitialTime);
  const [guestInfo, setGuestInfoState] = useState<GuestInfo | null>(null);
  const [result, setResult] = useState<BookingResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step order for navigation
  const stepOrder: BookingStep[] = useMemo(() => {
    if (availableSpecialists.length > 1) {
      return ["specialist", "date", "time", "confirm", "success"];
    }
    return ["date", "time", "confirm", "success"];
  }, [availableSpecialists.length]);

  // Navigation
  const goToStep = useCallback((newStep: BookingStep) => {
    setStep(newStep);
    setError(null);
  }, []);

  const canGoBack = useMemo(() => {
    const currentIndex = stepOrder.indexOf(step);
    return currentIndex > 0 && step !== "success";
  }, [step, stepOrder]);

  const goBack = useCallback(() => {
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex > 0) {
      setStep(stepOrder[currentIndex - 1]);
      setError(null);
    }
  }, [step, stepOrder]);

  // Selections
  const selectSpecialist = useCallback((selected: AvailableSpecialist) => {
    setSpecialist(selected);
    setDate(null); // Reset subsequent selections
    setTime(null);
    setStep("date");
    setError(null);
  }, []);

  const selectDate = useCallback((selected: Date) => {
    setDate(selected);
    setTime(null); // Reset time when date changes
    setStep("time");
    setError(null);
  }, []);

  const selectTime = useCallback((selected: string) => {
    setTime(selected);
    setStep("confirm");
    setError(null);
  }, []);

  const setGuestInfo = useCallback((info: GuestInfo) => {
    setGuestInfoState(info);
  }, []);

  // Submission
  const submitBooking = useCallback(async () => {
    if (!specialist || !date || !time) {
      setError("Missing required booking information");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Format date as YYYY-MM-DD
      const dateStr = formatDateToYYYYMMDD(date);

      // Calculate end time based on total duration
      const endTime = calculateEndTime(time, specialist.totalDurationMinutes);

      // Prepare client info
      const clientInfo = guestInfo ?? {
        name: "",
        phone: "",
      };

      const bookingResult = await createBooking({
        beautyPageId,
        specialistMemberId: specialist.memberId,
        serviceIds: selectedServices.map((s) => s.id),
        date: dateStr,
        startTime: time,
        endTime,
        clientInfo,
        clientId: currentUserId,
      });

      setResult(bookingResult);

      if (bookingResult.success) {
        setStep("success");
      } else {
        setError(bookingResult.message);
      }
    } catch (err) {
      console.error("Booking submission error:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    specialist,
    date,
    time,
    guestInfo,
    beautyPageId,
    selectedServices,
    currentUserId,
  ]);

  // Reset
  const reset = useCallback(() => {
    setStep(computedInitialStep);
    setSpecialist(computedInitialSpecialist);
    setDate(computedInitialDate);
    setTime(computedInitialTime);
    setGuestInfoState(null);
    setResult(null);
    setIsSubmitting(false);
    setError(null);
  }, [computedInitialStep, computedInitialSpecialist, computedInitialDate, computedInitialTime]);

  // Context value
  const value: BookingContextValue = useMemo(
    () => ({
      // State
      step,
      specialist,
      date,
      time,
      guestInfo,
      result,
      isSubmitting,
      error,

      // Navigation
      goToStep,
      goBack,
      canGoBack,

      // Selections
      selectSpecialist,
      selectDate,
      selectTime,
      setGuestInfo,

      // Submission
      submitBooking,

      // Reset
      reset,

      // Props
      beautyPageId,
      selectedServices,
      availableSpecialists,
      timezone,
      currency,
      locale,
      currentUserId,
      currentUserProfile,
    }),
    [
      step,
      specialist,
      date,
      time,
      guestInfo,
      result,
      isSubmitting,
      error,
      goToStep,
      goBack,
      canGoBack,
      selectSpecialist,
      selectDate,
      selectTime,
      setGuestInfo,
      submitBooking,
      reset,
      beautyPageId,
      selectedServices,
      availableSpecialists,
      timezone,
      currency,
      locale,
      currentUserId,
      currentUserProfile,
    ],
  );

  return (
    <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
  );
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format Date to YYYY-MM-DD string
 */
function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
