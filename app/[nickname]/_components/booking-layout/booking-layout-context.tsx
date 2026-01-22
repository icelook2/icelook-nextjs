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

import { format } from "date-fns";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
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
  // Source Data
  allServices: ProfileService[];
  creator: ProfileSpecialist | null;
  beautyPageId: string;

  // Selections
  selectedServiceIds: Set<string>;
  selectedDate: Date | null;
  selectedTime: string | null;

  // Derived State
  selectedServices: ProfileService[];
  totalPriceCents: number;
  totalDurationMinutes: number;

  // Calendar State
  workingDays: Set<string>;
  currentMonth: Date;
  timeSlots: TimeSlot[];
  isLoadingCalendar: boolean;
  isLoadingSlots: boolean;

  // Ready State
  isReadyToBook: boolean;

  // Actions
  toggleService: (service: ProfileService) => void;
  selectDate: (date: Date | null) => void;
  selectTime: (time: string | null) => void;
  setCurrentMonth: (month: Date) => void;
  clearAll: () => void;

  // Helpers
  isServiceSelected: (serviceId: string) => boolean;
}

// ============================================================================
// Context
// ============================================================================

const BookingLayoutContext = createContext<BookingLayoutContextValue | null>(
  null,
);

// ============================================================================
// Provider
// ============================================================================

interface BookingLayoutProviderProps {
  children: ReactNode;
  allServices: ProfileService[];
  allSpecialists: ProfileSpecialist[];
  beautyPageId: string;
  timezone: string;
}

export function BookingLayoutProvider({
  children,
  allServices,
  allSpecialists,
  beautyPageId,
  timezone,
}: BookingLayoutProviderProps) {
  const creator = allSpecialists[0] ?? null;

  // Selection State
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [workingDays, setWorkingDays] = useState<Set<string>>(new Set());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Derived values (React Compiler handles optimization)
  const selectedServices = allServices.filter((s) =>
    selectedServiceIds.has(s.id),
  );

  let totalPriceCents = 0;
  let totalDurationMinutes = 0;
  for (const service of selectedServices) {
    totalPriceCents += service.price_cents;
    totalDurationMinutes += service.duration_minutes;
  }

  const isReadyToBook =
    selectedServiceIds.size > 0 &&
    selectedDate !== null &&
    selectedTime !== null;

  // Effect: Fetch working days when month changes
  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = format(firstDay, "yyyy-MM-dd");
    const endDate = format(lastDay, "yyyy-MM-dd");

    const fetchWorkingDays = async () => {
      setIsLoadingCalendar(true);

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

  // Effect: Auto-select today if available and no date selected
  useEffect(() => {
    if (selectedDate) {
      return;
    }

    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");

    if (workingDays.has(todayStr)) {
      setSelectedDate(today);
    }
  }, [workingDays, selectedDate]);

  // Effect: Fetch time slots when date changes
  useEffect(() => {
    if (!selectedDate) {
      setTimeSlots([]);
      return;
    }

    const dateStr = format(selectedDate, "yyyy-MM-dd");

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

  // Actions (React Compiler handles optimization - no useCallback needed)
  function toggleService(service: ProfileService) {
    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(service.id)) {
        next.delete(service.id);
      } else {
        next.add(service.id);
      }
      return next;
    });
    setSelectedTime(null);
  }

  function selectDate(date: Date | null) {
    setSelectedDate(date);
    setSelectedTime(null);
    setTimeSlots([]);
  }

  function selectTime(time: string | null) {
    setSelectedTime(time);
  }

  function clearAll() {
    setSelectedServiceIds(new Set());
    setSelectedDate(null);
    setSelectedTime(null);
    setWorkingDays(new Set());
    setTimeSlots([]);
  }

  function isServiceSelected(serviceId: string) {
    return selectedServiceIds.has(serviceId);
  }

  // Context value (React Compiler handles optimization - no useMemo needed)
  const value: BookingLayoutContextValue = {
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
    setCurrentMonth,
    clearAll,
    isServiceSelected,
  };

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
