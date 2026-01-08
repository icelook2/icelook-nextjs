"use client";

/**
 * Booking Layout Context (Solo Creator Model)
 *
 * Simplified state management for the 3-column horizontal booking layout.
 * Manages: Services → Date/Time → Confirmation
 *
 * Key changes from multi-specialist model:
 * - No specialist selection (creator IS the specialist)
 * - Prices and durations are directly on services
 * - Calendar shows creator's working days
 * - Time slots are for the single creator
 */

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  ProfileService,
  ProfileSpecialist,
} from "@/lib/queries/beauty-page-profile";
import {
  getAvailabilityData,
  getWorkingDaysForRange,
} from "../booking/_actions/availability.actions";
import type { TimeSlot } from "../booking/_lib/booking-types";
import { generateAvailableSlots } from "../booking/_lib/slot-generation";

// ============================================================================
// Types
// ============================================================================

interface BookingLayoutContextValue {
  // ─────────────────────────────────────────────────────────────────────────
  // Source Data
  // ─────────────────────────────────────────────────────────────────────────
  allServices: ProfileService[];
  /** The creator (single specialist) for this beauty page */
  creator: ProfileSpecialist | null;
  beautyPageId: string;

  // ─────────────────────────────────────────────────────────────────────────
  // Selections
  // ─────────────────────────────────────────────────────────────────────────
  selectedServiceIds: Set<string>;
  selectedDate: Date | null;
  selectedTime: string | null;

  // ─────────────────────────────────────────────────────────────────────────
  // Derived State
  // ─────────────────────────────────────────────────────────────────────────
  /** Selected services array */
  selectedServices: ProfileService[];
  /** Total price for selected services (cents) */
  totalPriceCents: number;
  /** Total duration for selected services (minutes) */
  totalDurationMinutes: number;

  // ─────────────────────────────────────────────────────────────────────────
  // Calendar State
  // ─────────────────────────────────────────────────────────────────────────
  workingDays: Set<string>;
  currentMonth: Date;
  timeSlots: TimeSlot[];
  isLoadingCalendar: boolean;
  isLoadingSlots: boolean;

  // ─────────────────────────────────────────────────────────────────────────
  // Ready State
  // ─────────────────────────────────────────────────────────────────────────
  isReadyToBook: boolean;

  // ─────────────────────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────────────────────
  toggleService: (service: ProfileService) => void;
  selectDate: (date: Date | null) => void;
  selectTime: (time: string | null) => void;
  setCurrentMonth: (month: Date) => void;
  clearAll: () => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────
  isServiceSelected: (serviceId: string) => boolean;
}

// ============================================================================
// Context
// ============================================================================

const BookingLayoutContext = createContext<BookingLayoutContextValue | null>(
  null,
);

// ============================================================================
// Provider Props
// ============================================================================

interface BookingLayoutProviderProps {
  children: ReactNode;
  /** All services from the beauty page */
  allServices: ProfileService[];
  /** The creator (single specialist array with one entry) */
  allSpecialists: ProfileSpecialist[];
  /** Beauty page ID for availability lookups */
  beautyPageId: string;
  /** Timezone of the beauty page */
  timezone: string;
}

// ============================================================================
// Provider
// ============================================================================

export function BookingLayoutProvider({
  children,
  allServices,
  allSpecialists,
  beautyPageId,
  timezone,
}: BookingLayoutProviderProps) {
  // The creator is the single specialist (or first in array)
  const creator = allSpecialists[0] ?? null;

  // ─────────────────────────────────────────────────────────────────────────
  // Selection State
  // ─────────────────────────────────────────────────────────────────────────
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // Calendar State
  // ─────────────────────────────────────────────────────────────────────────
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [workingDays, setWorkingDays] = useState<Set<string>>(new Set());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Derived: Selected Services Array
  // ─────────────────────────────────────────────────────────────────────────
  const selectedServices = useMemo(() => {
    return allServices.filter((s) => selectedServiceIds.has(s.id));
  }, [allServices, selectedServiceIds]);

  // ─────────────────────────────────────────────────────────────────────────
  // Derived: Total price and duration (from services directly)
  // ─────────────────────────────────────────────────────────────────────────
  const { totalPriceCents, totalDurationMinutes } = useMemo(() => {
    let price = 0;
    let duration = 0;

    for (const service of selectedServices) {
      price += service.price_cents;
      duration += service.duration_minutes;
    }

    return { totalPriceCents: price, totalDurationMinutes: duration };
  }, [selectedServices]);

  // ─────────────────────────────────────────────────────────────────────────
  // Derived: Ready to book
  // ─────────────────────────────────────────────────────────────────────────
  const isReadyToBook = useMemo(() => {
    return (
      selectedServiceIds.size > 0 &&
      selectedDate !== null &&
      selectedTime !== null
    );
  }, [selectedServiceIds.size, selectedDate, selectedTime]);

  // ─────────────────────────────────────────────────────────────────────────
  // Effect: Fetch working days when month changes
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = formatDateToYYYYMMDD(firstDay);
    const endDate = formatDateToYYYYMMDD(lastDay);

    const fetchWorkingDays = async () => {
      setIsLoadingCalendar(true);

      // Use beauty page ID for fetching working days
      const result = await getWorkingDaysForRange(
        beautyPageId,
        startDate,
        endDate,
      );

      if (result.success) {
        setWorkingDays(new Set(result.data));
      }

      setIsLoadingCalendar(false);
    };

    fetchWorkingDays();
  }, [currentMonth, beautyPageId]);

  // ─────────────────────────────────────────────────────────────────────────
  // Effect: Auto-select today if available and no date selected
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (selectedDate) return;

    const today = new Date();
    const todayStr = formatDateToYYYYMMDD(today);

    if (workingDays.has(todayStr)) {
      setSelectedDate(today);
    }
  }, [workingDays, selectedDate]);

  // ─────────────────────────────────────────────────────────────────────────
  // Effect: Fetch time slots when date changes
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedDate) {
      setTimeSlots([]);
      return;
    }

    const dateStr = formatDateToYYYYMMDD(selectedDate);

    const fetchSlots = async () => {
      setIsLoadingSlots(true);

      const result = await getAvailabilityData({
        beautyPageId,
        startDate: dateStr,
        endDate: dateStr,
      });

      if (!result.success) {
        setTimeSlots([]);
        setIsLoadingSlots(false);
        return;
      }

      const {
        workingDays: workingDaysData,
        appointments,
        bookingSettings,
      } = result.data;

      const workingDay =
        workingDaysData.find((wd) => wd.date === dateStr) ?? null;

      const slots = generateAvailableSlots({
        workingDay,
        appointments,
        serviceDurationMinutes: totalDurationMinutes || 60,
        slotIntervalMinutes: 30,
        minNoticeHours: bookingSettings?.minBookingNoticeHours ?? 0,
        date: selectedDate,
        timezone,
      });

      setTimeSlots(slots);
      setIsLoadingSlots(false);
    };

    fetchSlots();
  }, [selectedDate, beautyPageId, totalDurationMinutes, timezone]);

  // ─────────────────────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────────────────────
  const toggleService = useCallback((service: ProfileService) => {
    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(service.id)) {
        next.delete(service.id);
      } else {
        next.add(service.id);
      }
      return next;
    });
    // Clear time when services change (slot availability may change with duration)
    setSelectedTime(null);
  }, []);

  const selectDate = useCallback((date: Date | null) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setTimeSlots([]);
  }, []);

  const selectTime = useCallback((time: string | null) => {
    setSelectedTime(time);
  }, []);

  const clearAll = useCallback(() => {
    setSelectedServiceIds(new Set());
    setSelectedDate(null);
    setSelectedTime(null);
    setWorkingDays(new Set());
    setTimeSlots([]);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Helper Functions
  // ─────────────────────────────────────────────────────────────────────────
  const isServiceSelected = useCallback(
    (serviceId: string) => selectedServiceIds.has(serviceId),
    [selectedServiceIds],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Context Value
  // ─────────────────────────────────────────────────────────────────────────
  const value: BookingLayoutContextValue = useMemo(
    () => ({
      // Source data
      allServices,
      creator,
      beautyPageId,

      // Selections
      selectedServiceIds,
      selectedDate,
      selectedTime,

      // Derived
      selectedServices,
      totalPriceCents,
      totalDurationMinutes,

      // Calendar
      workingDays,
      currentMonth,
      timeSlots,
      isLoadingCalendar,
      isLoadingSlots,

      // Ready state
      isReadyToBook,

      // Actions
      toggleService,
      selectDate,
      selectTime,
      setCurrentMonth,
      clearAll,

      // Helpers
      isServiceSelected,
    }),
    [
      allServices,
      creator,
      beautyPageId,
      selectedServiceIds,
      selectedDate,
      selectedTime,
      selectedServices,
      totalPriceCents,
      totalDurationMinutes,
      workingDays,
      currentMonth,
      timeSlots,
      isLoadingCalendar,
      isLoadingSlots,
      isReadyToBook,
      toggleService,
      selectDate,
      selectTime,
      clearAll,
      isServiceSelected,
    ],
  );

  return (
    <BookingLayoutContext.Provider value={value}>
      {children}
    </BookingLayoutContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useBookingLayout(): BookingLayoutContextValue {
  const context = useContext(BookingLayoutContext);
  if (!context) {
    throw new Error(
      "useBookingLayout must be used within a BookingLayoutProvider",
    );
  }
  return context;
}

// ============================================================================
// Helpers
// ============================================================================

function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
