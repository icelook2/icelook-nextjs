"use client";

/**
 * Booking Context (Solo Creator Model)
 *
 * Manages state for the multi-step booking dialog flow.
 * Simplified for solo creator - no specialist selection step.
 *
 * Flow: date → time → confirm → success
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
import { createBooking } from "./_actions/booking.actions";
import type {
  BookingResult,
  BookingState,
  BookingStep,
  CurrentUserProfile,
  GuestInfo,
} from "./_lib/booking-types";
import { calculateEndTime } from "./_lib/slot-generation";

// ============================================================================
// Types
// ============================================================================

/** Creator info for display in booking flow */
export interface CreatorInfo {
  displayName: string;
  avatarUrl: string | null;
}

interface BookingContextValue extends BookingState {
  // Navigation
  goToStep: (step: BookingStep) => void;
  goBack: () => void;
  canGoBack: boolean;

  // Selections
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
  /** Total price for all selected services */
  totalPriceCents: number;
  /** Total duration for all selected services */
  totalDurationMinutes: number;
  timezone: string;
  currency: string;
  locale: string;
  currentUserId?: string;
  currentUserProfile?: CurrentUserProfile;
  creatorInfo: CreatorInfo;
}

interface BookingProviderProps {
  children: ReactNode;
  beautyPageId: string;
  selectedServices: ProfileService[];
  totalPriceCents: number;
  totalDurationMinutes: number;
  timezone: string;
  currency: string;
  locale: string;
  currentUserId?: string;
  currentUserProfile?: CurrentUserProfile;
  creatorInfo: CreatorInfo;
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
  totalPriceCents,
  totalDurationMinutes,
  timezone,
  currency,
  locale,
  currentUserId,
  currentUserProfile,
  creatorInfo,
}: BookingProviderProps) {
  // State - starts at date selection (no specialist step)
  const [step, setStep] = useState<BookingStep>("date");
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [guestInfo, setGuestInfoState] = useState<GuestInfo | null>(null);
  const [result, setResult] = useState<BookingResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step order for navigation (no specialist step)
  const stepOrder: BookingStep[] = ["date", "time", "confirm", "success"];

  // Navigation
  const goToStep = useCallback((newStep: BookingStep) => {
    setStep(newStep);
    setError(null);
  }, []);

  const canGoBack = useMemo(() => {
    const currentIndex = stepOrder.indexOf(step);
    return currentIndex > 0 && step !== "success";
  }, [step]);

  const goBack = useCallback(() => {
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex > 0) {
      setStep(stepOrder[currentIndex - 1]);
      setError(null);
    }
  }, [step]);

  // Selections
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
    if (!date || !time) {
      setError("Missing required booking information");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Format date as YYYY-MM-DD
      const dateStr = formatDateToYYYYMMDD(date);

      // Calculate end time based on total duration
      const endTime = calculateEndTime(time, totalDurationMinutes);

      // Prepare client info
      const clientInfo = guestInfo ?? {
        name: "",
        phone: "",
      };

      const bookingResult = await createBooking({
        beautyPageId,
        serviceIds: selectedServices.map((s) => s.id),
        date: dateStr,
        startTime: time,
        endTime,
        clientInfo,
        clientId: currentUserId,
        visitPreferences: guestInfo?.visitPreferences,
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
    date,
    time,
    guestInfo,
    beautyPageId,
    selectedServices,
    totalDurationMinutes,
    currentUserId,
  ]);

  // Reset
  const reset = useCallback(() => {
    setStep("date");
    setDate(null);
    setTime(null);
    setGuestInfoState(null);
    setResult(null);
    setIsSubmitting(false);
    setError(null);
  }, []);

  // Context value
  const value: BookingContextValue = useMemo(
    () => ({
      // State
      step,
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
      totalPriceCents,
      totalDurationMinutes,
      timezone,
      currency,
      locale,
      currentUserId,
      currentUserProfile,
      creatorInfo,
    }),
    [
      step,
      date,
      time,
      guestInfo,
      result,
      isSubmitting,
      error,
      goToStep,
      goBack,
      canGoBack,
      selectDate,
      selectTime,
      setGuestInfo,
      submitBooking,
      reset,
      beautyPageId,
      selectedServices,
      totalPriceCents,
      totalDurationMinutes,
      timezone,
      currency,
      locale,
      currentUserId,
      currentUserProfile,
      creatorInfo,
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
