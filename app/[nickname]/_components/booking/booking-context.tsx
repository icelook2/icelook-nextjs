"use client";

/**
 * Booking Context (Solo Creator Model)
 *
 * Manages state for the multi-step booking dialog flow.
 * Simplified for solo creator - no specialist selection step.
 *
 * Flow: date → time → confirm → success
 *
 * Performance optimizations:
 * - Fetches 6 months of working days upfront (no loading on month navigation)
 * - Prefetches time slots when date is selected (instant time step)
 */

import { format } from "date-fns";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { rescheduleAppointment } from "@/app/[nickname]/appointments/_actions/appointment.actions";
import type { ProfileService } from "@/lib/queries/beauty-page-profile";
import type { PublicBundle } from "@/lib/types/bundles";
import {
  getAvailabilityData,
  getWorkingDaysForRange,
} from "./_actions/availability.actions";
import { createBooking } from "./_actions/booking.actions";
import type {
  BookingResult,
  BookingState,
  BookingStep,
  CreatorInfo,
  CurrentUserProfile,
  GuestInfo,
  RescheduleData,
  TimeSlot,
  TimeSlotsCache,
} from "./_lib/booking-types";
import {
  calculateEndTime,
  generateAvailableSlots,
} from "./_lib/slot-generation";

// ============================================================================
// Types
// ============================================================================

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

  // Form readiness (for confirm step)
  isConfirmFormReady: boolean;
  setConfirmFormReady: (ready: boolean) => void;

  // Reset
  reset: () => void;

  // Working days (prefetched for smooth navigation)
  workingDays: Set<string>;
  isWorkingDaysLoading: boolean;

  // Time slots (prefetched when date is selected)
  getTimeSlotsForDate: (dateStr: string) => {
    slots: TimeSlot[];
    status: "loading" | "success" | "error";
  } | null;
  prefetchTimeSlotsForDate: (date: Date) => void;

  // Derived from props
  beautyPageId: string;
  selectedServices: ProfileService[];
  /** Selected bundle (if booking a bundle instead of individual services) */
  selectedBundle?: PublicBundle | null;
  /** Whether we're in bundle booking mode */
  isBundleMode: boolean;
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
  /** Original price from previous booking (for rebooking when price changed) */
  originalPriceCents?: number;
  /** Reschedule mode data - when set, we're rescheduling an existing appointment */
  rescheduleData?: RescheduleData;
  /** Whether we're in reschedule mode */
  isRescheduleMode: boolean;
}

interface BookingProviderProps {
  children: ReactNode;
  beautyPageId: string;
  selectedServices: ProfileService[];
  /** Selected bundle (if booking a bundle instead of individual services) */
  selectedBundle?: PublicBundle | null;
  totalPriceCents: number;
  totalDurationMinutes: number;
  timezone: string;
  currency: string;
  locale: string;
  currentUserId?: string;
  currentUserProfile?: CurrentUserProfile;
  creatorInfo: CreatorInfo;
  /** Called when booking is successfully completed */
  onBookingSuccess?: () => void;
  /** Original price from previous booking (for rebooking when price changed) */
  originalPriceCents?: number;
  /** Reschedule mode data - when set, we're rescheduling an existing appointment */
  rescheduleData?: RescheduleData;
}

// ============================================================================
// Constants
// ============================================================================

/** Number of months to prefetch working days for */
const PREFETCH_MONTHS = 6;

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
  selectedBundle,
  totalPriceCents,
  totalDurationMinutes,
  timezone,
  currency,
  locale,
  currentUserId,
  currentUserProfile,
  creatorInfo,
  onBookingSuccess,
  originalPriceCents,
  rescheduleData,
}: BookingProviderProps) {
  // Determine modes
  const isRescheduleMode = !!rescheduleData;
  const isBundleMode = !!selectedBundle;
  // -------------------------------------------------------------------------
  // Core booking state
  // -------------------------------------------------------------------------
  const [step, setStep] = useState<BookingStep>("date");
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [guestInfo, setGuestInfoState] = useState<GuestInfo | null>(null);
  const [result, setResult] = useState<BookingResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmFormReady, setConfirmFormReady] = useState(false);

  // -------------------------------------------------------------------------
  // Working days (prefetched for 6 months)
  // -------------------------------------------------------------------------
  const [workingDays, setWorkingDays] = useState<Set<string>>(new Set());
  const [isWorkingDaysLoading, setIsWorkingDaysLoading] = useState(true);

  // -------------------------------------------------------------------------
  // Time slots cache (prefetched when date is selected)
  // -------------------------------------------------------------------------
  const [timeSlotsCache, setTimeSlotsCache] = useState<TimeSlotsCache>({});
  const prefetchingDatesRef = useRef<Set<string>>(new Set());

  // -------------------------------------------------------------------------
  // Prefetch working days on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    const fetchWorkingDays = async () => {
      setIsWorkingDaysLoading(true);

      const today = new Date();
      const endDate = new Date(today);
      endDate.setMonth(endDate.getMonth() + PREFETCH_MONTHS);

      const startDateStr = format(today, "yyyy-MM-dd");
      const endDateStr = format(endDate, "yyyy-MM-dd");

      const result = await getWorkingDaysForRange(
        beautyPageId,
        startDateStr,
        endDateStr,
      );

      if (result.success) {
        setWorkingDays(new Set(result.data));
      }

      setIsWorkingDaysLoading(false);
    };

    fetchWorkingDays();
  }, [beautyPageId]);

  // -------------------------------------------------------------------------
  // Time slots prefetching
  // -------------------------------------------------------------------------
  const prefetchTimeSlotsForDate = (prefetchDate: Date) => {
    const dateStr = format(prefetchDate, "yyyy-MM-dd");

    // Skip if already cached or currently prefetching
    if (timeSlotsCache[dateStr] || prefetchingDatesRef.current.has(dateStr)) {
      return;
    }

    // Mark as prefetching
    prefetchingDatesRef.current.add(dateStr);

    // Set loading state
    setTimeSlotsCache((prev) => ({
      ...prev,
      [dateStr]: { slots: [], status: "loading" },
    }));

    // Fetch in background
    // In reschedule mode, exclude the appointment being rescheduled so it doesn't block itself
    getAvailabilityData({
      beautyPageId,
      startDate: dateStr,
      endDate: dateStr,
      excludeAppointmentId: rescheduleData?.appointmentId,
    }).then((result) => {
      prefetchingDatesRef.current.delete(dateStr);

      if (!result.success) {
        setTimeSlotsCache((prev) => ({
          ...prev,
          [dateStr]: { slots: [], status: "error" },
        }));
        return;
      }

      const {
        workingDays: workingDaysData,
        appointments,
        bookingSettings,
      } = result.data;

      // Find working day for selected date
      const workingDay =
        workingDaysData.find((wd) => wd.date === dateStr) ?? null;

      // Extract service time windows for filtering
      // Only individual services have time windows (bundles use full working hours)
      // If user selects bundle + services, we respect the services' time windows
      const serviceTimeWindows = selectedServices.map((s) => ({
        availableFromTime: s.available_from_time,
        availableToTime: s.available_to_time,
      }));

      // Generate slots
      const slots = generateAvailableSlots({
        workingDay,
        appointments,
        serviceDurationMinutes: totalDurationMinutes,
        slotIntervalMinutes: 30,
        minNoticeHours: bookingSettings?.minBookingNoticeHours ?? 0,
        date: prefetchDate,
        timezone,
        serviceTimeWindows,
      });

      setTimeSlotsCache((prev) => ({
        ...prev,
        [dateStr]: { slots, status: "success" },
      }));
    });
  };

  const getTimeSlotsForDate = (dateStr: string) => {
    return timeSlotsCache[dateStr] ?? null;
  };

  // -------------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------------
  const stepOrder: BookingStep[] = ["date", "time", "confirm", "success"];

  const goToStep = (newStep: BookingStep) => {
    setStep(newStep);
    setError(null);
  };

  const currentIndex = stepOrder.indexOf(step);
  const canGoBack = currentIndex > 0 && step !== "success";

  const goBack = () => {
    if (currentIndex > 0) {
      setStep(stepOrder[currentIndex - 1]);
      setError(null);
    }
  };

  // -------------------------------------------------------------------------
  // Selections
  // -------------------------------------------------------------------------
  const selectDate = (selected: Date) => {
    setDate(selected);
    setTime(null); // Reset time when date changes
    setStep("time");
    setError(null);
  };

  const selectTime = (selected: string) => {
    setTime(selected);
    setStep("confirm");
    setError(null);
  };

  const setGuestInfo = (info: GuestInfo) => {
    setGuestInfoState(info);
  };

  // -------------------------------------------------------------------------
  // Submission
  // -------------------------------------------------------------------------
  const submitBooking = async () => {
    if (!date || !time) {
      setError("Missing required booking information");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Format date as YYYY-MM-DD
      const dateStr = format(date, "yyyy-MM-dd");

      // Calculate end time based on total duration
      const endTime = calculateEndTime(time, totalDurationMinutes);

      // Handle reschedule mode differently
      if (isRescheduleMode && rescheduleData) {
        const rescheduleResult = await rescheduleAppointment({
          appointmentId: rescheduleData.appointmentId,
          beautyPageId,
          nickname: rescheduleData.nickname,
          newDate: dateStr,
          newStartTime: time,
          newEndTime: endTime,
        });

        if (rescheduleResult.success) {
          // Create a success result compatible with BookingResult
          setResult({
            success: true,
            appointmentId: rescheduleData.appointmentId,
            status: "confirmed", // Rescheduled appointments keep their status
          });
          setStep("success");
          onBookingSuccess?.();
        } else {
          setError(rescheduleResult.error);
        }
      } else {
        // Regular booking flow
        const clientInfo = guestInfo ?? {
          name: "",
          phone: "",
        };

        // Get service IDs - combine bundle services + individual selected services
        const bundleServiceIds = selectedBundle
          ? selectedBundle.services.map((s) => s.id)
          : [];
        const individualServiceIds = selectedServices.map((s) => s.id);
        const serviceIdsToBook = [...bundleServiceIds, ...individualServiceIds];

        const bookingResult = await createBooking({
          beautyPageId,
          serviceIds: serviceIdsToBook,
          date: dateStr,
          startTime: time,
          endTime,
          clientInfo,
          clientId: currentUserId,
          visitPreferences: guestInfo?.visitPreferences,
          // Bundle booking information (if bundle selected)
          ...(selectedBundle
            ? {
                bundleId: selectedBundle.id,
                bundlePriceCents: selectedBundle.discounted_total_cents,
                bundleDurationMinutes: selectedBundle.total_duration_minutes,
                bundleName: selectedBundle.name,
              }
            : {}),
        });

        setResult(bookingResult);

        if (bookingResult.success) {
          setStep("success");
          // Clear selected services on success
          onBookingSuccess?.();
        } else {
          setError(bookingResult.message);
        }
      }
    } catch (err) {
      console.error("Booking submission error:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------------------
  // Reset
  // -------------------------------------------------------------------------
  const reset = () => {
    setStep("date");
    setDate(null);
    setTime(null);
    setGuestInfoState(null);
    setResult(null);
    setIsSubmitting(false);
    setError(null);
    setConfirmFormReady(false);
    // Note: We don't reset workingDays or timeSlotsCache to preserve prefetched data
  };

  // -------------------------------------------------------------------------
  // Context value
  // -------------------------------------------------------------------------
  const value: BookingContextValue = {
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

    // Form readiness
    isConfirmFormReady,
    setConfirmFormReady,

    // Reset
    reset,

    // Working days
    workingDays,
    isWorkingDaysLoading,

    // Time slots
    getTimeSlotsForDate,
    prefetchTimeSlotsForDate,

    // Props
    beautyPageId,
    selectedServices,
    selectedBundle,
    isBundleMode,
    totalPriceCents,
    totalDurationMinutes,
    timezone,
    currency,
    locale,
    currentUserId,
    currentUserProfile,
    creatorInfo,
    originalPriceCents,
    rescheduleData,
    isRescheduleMode,
  };

  return (
    <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
  );
}
