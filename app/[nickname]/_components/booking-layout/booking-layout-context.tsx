"use client";

/**
 * Booking Layout Context
 *
 * Unified state management for the 3-column horizontal booking layout.
 * Manages bi-directional filtering between Services, Specialists, and Date/Time.
 *
 * Key features:
 * - Service selection with specialist intersection calculation
 * - Specialist selection with service compatibility filtering
 * - Calendar/time slot fetching based on selected specialist
 * - Ready state when all selections are complete
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  ProfileService,
  ProfileSpecialist,
} from "@/lib/queries/beauty-page-profile";
import {
  getAvailabilityData,
  getWorkingDaysForRange,
  getWorkingDaysForAllSpecialists,
  getAvailabilityForMultipleSpecialists,
} from "../booking/_actions/availability.actions";
import type { AggregatedTimeSlot, TimeSlot } from "../booking/_lib/booking-types";
import { generateAvailableSlots } from "../booking/_lib/slot-generation";

// ============================================================================
// Types
// ============================================================================

/** Specialist with computed price for selected services */
export interface SpecialistWithPrice extends ProfileSpecialist {
  /** Total price for all selected services (cents) */
  totalPriceCents: number;
  /** Total duration for all selected services (minutes) */
  totalDurationMinutes: number;
  /** Whether this specialist can do ALL selected services */
  isAvailable: boolean;
}

interface BookingLayoutContextValue {
  // ─────────────────────────────────────────────────────────────────────────
  // Source Data
  // ─────────────────────────────────────────────────────────────────────────
  allServices: ProfileService[];
  allSpecialists: ProfileSpecialist[];

  // ─────────────────────────────────────────────────────────────────────────
  // Selections
  // ─────────────────────────────────────────────────────────────────────────
  selectedServiceIds: Set<string>;
  selectedSpecialistId: string | null;
  selectedDate: Date | null;
  selectedTime: string | null;

  // ─────────────────────────────────────────────────────────────────────────
  // Derived State
  // ─────────────────────────────────────────────────────────────────────────
  /** IDs of specialists who can do ALL selected services */
  availableSpecialistIds: Set<string>;
  /** IDs of services the selected specialist can do */
  compatibleServiceIds: Set<string>;
  /** Specialists with computed prices, sorted by price */
  specialistsWithPrices: SpecialistWithPrice[];
  /** Selected services array */
  selectedServices: ProfileService[];
  /** Total price range for selected services */
  totalPriceRange: { min: number; max: number };
  /** Total duration range for selected services */
  totalDurationRange: { min: number; max: number };
  /** Specialist IDs working on the selected date (for date-first flow) */
  specialistsOnSelectedDate: Set<string>;

  // ─────────────────────────────────────────────────────────────────────────
  // Calendar State
  // ─────────────────────────────────────────────────────────────────────────
  workingDays: Set<string>;
  /** Map of date string -> specialist IDs working that day (for date-first flow) */
  dateSpecialistMap: Map<string, string[]>;
  currentMonth: Date;
  /** Time slots (aggregated from all specialists when none selected) */
  timeSlots: AggregatedTimeSlot[];
  /** Specialist IDs available at the selected time */
  specialistsAtSelectedTime: Set<string>;
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
  selectSpecialist: (specialistId: string | null) => void;
  selectDate: (date: Date | null) => void;
  selectTime: (time: string | null) => void;
  setCurrentMonth: (month: Date) => void;
  clearAll: () => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────
  isServiceSelected: (serviceId: string) => boolean;
  isServiceCompatible: (serviceId: string) => boolean;
  isSpecialistAvailable: (specialistId: string) => boolean;
  /** Whether specialist works on the selected date */
  isSpecialistWorkingOnDate: (specialistId: string) => boolean;
  /** Whether specialist is available at the selected time */
  isSpecialistAvailableAtTime: (specialistId: string) => boolean;
  getSpecialistPrice: (specialistId: string) => number;
  getSpecialistDuration: (specialistId: string) => number;
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
  /** All specialists from the beauty page */
  allSpecialists: ProfileSpecialist[];
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
  timezone,
}: BookingLayoutProviderProps) {
  // ─────────────────────────────────────────────────────────────────────────
  // Selection State
  // ─────────────────────────────────────────────────────────────────────────
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedSpecialistId, setSelectedSpecialistId] = useState<
    string | null
  >(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // Calendar State
  // ─────────────────────────────────────────────────────────────────────────
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [workingDays, setWorkingDays] = useState<Set<string>>(new Set());
  /** Maps date -> specialist IDs working that day (for date-first flow) */
  const [dateSpecialistMap, setDateSpecialistMap] = useState<Map<string, string[]>>(
    new Map(),
  );
  const [timeSlots, setTimeSlots] = useState<AggregatedTimeSlot[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Derived: Selected Services Array
  // ─────────────────────────────────────────────────────────────────────────
  const selectedServices = useMemo(() => {
    return allServices.filter((s) => selectedServiceIds.has(s.id));
  }, [allServices, selectedServiceIds]);

  // ─────────────────────────────────────────────────────────────────────────
  // Derived: Available Specialists (can do ALL selected services)
  // ─────────────────────────────────────────────────────────────────────────
  const availableSpecialistIds = useMemo(() => {
    if (selectedServiceIds.size === 0) {
      // All specialists available when no services selected
      return new Set(allSpecialists.map((s) => s.member_id));
    }

    // Start with specialists from first selected service
    const firstService = selectedServices[0];
    if (!firstService) return new Set<string>();

    let available = new Set(
      firstService.assignments.map((a) => a.member_id),
    );

    // Intersect with each subsequent service
    for (const service of selectedServices.slice(1)) {
      const serviceSpecialistIds = new Set(
        service.assignments.map((a) => a.member_id),
      );
      available = new Set(
        [...available].filter((id) => serviceSpecialistIds.has(id)),
      );
    }

    return available;
  }, [selectedServiceIds, selectedServices, allSpecialists]);

  // ─────────────────────────────────────────────────────────────────────────
  // Derived: Compatible Services (selected specialist can do)
  // ─────────────────────────────────────────────────────────────────────────
  const compatibleServiceIds = useMemo(() => {
    if (!selectedSpecialistId) {
      // All services compatible when no specialist selected
      return new Set(allServices.map((s) => s.id));
    }

    const compatible = new Set<string>();
    for (const service of allServices) {
      if (service.assignments.some((a) => a.member_id === selectedSpecialistId)) {
        compatible.add(service.id);
      }
    }

    return compatible;
  }, [selectedSpecialistId, allServices]);

  // ─────────────────────────────────────────────────────────────────────────
  // Derived: Specialists with computed prices
  // ─────────────────────────────────────────────────────────────────────────
  const specialistsWithPrices = useMemo(() => {
    return allSpecialists.map((specialist) => {
      let totalPriceCents = 0;
      let totalDurationMinutes = 0;

      // Calculate total for all selected services
      for (const service of selectedServices) {
        const assignment = service.assignments.find(
          (a) => a.member_id === specialist.member_id,
        );
        if (assignment) {
          totalPriceCents += assignment.price_cents;
          totalDurationMinutes += assignment.duration_minutes;
        }
      }

      return {
        ...specialist,
        totalPriceCents,
        totalDurationMinutes,
        isAvailable: availableSpecialistIds.has(specialist.member_id),
      };
    });
  }, [allSpecialists, selectedServices, availableSpecialistIds]);

  // ─────────────────────────────────────────────────────────────────────────
  // Derived: Total price/duration ranges
  // ─────────────────────────────────────────────────────────────────────────
  const { totalPriceRange, totalDurationRange } = useMemo(() => {
    if (selectedServices.length === 0) {
      return {
        totalPriceRange: { min: 0, max: 0 },
        totalDurationRange: { min: 0, max: 0 },
      };
    }

    let minPrice = 0;
    let maxPrice = 0;
    let minDuration = 0;
    let maxDuration = 0;

    for (const service of selectedServices) {
      // Only consider available specialists
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

    return {
      totalPriceRange: { min: minPrice, max: maxPrice },
      totalDurationRange: { min: minDuration, max: maxDuration },
    };
  }, [selectedServices, availableSpecialistIds]);

  // ─────────────────────────────────────────────────────────────────────────
  // Derived: Specialists working on selected date (for date-first flow)
  // ─────────────────────────────────────────────────────────────────────────
  const specialistsOnSelectedDate = useMemo(() => {
    if (!selectedDate) {
      return new Set<string>();
    }

    const dateStr = formatDateToYYYYMMDD(selectedDate);
    const specialistIds = dateSpecialistMap.get(dateStr) ?? [];

    // Convert specialist.id to member_id for consistent lookup
    const memberIds = new Set<string>();
    for (const specId of specialistIds) {
      const specialist = allSpecialists.find((s) => s.id === specId);
      if (specialist) {
        memberIds.add(specialist.member_id);
      }
    }

    return memberIds;
  }, [selectedDate, dateSpecialistMap, allSpecialists]);

  // ─────────────────────────────────────────────────────────────────────────
  // Derived: Specialists available at selected time (for time-first flow)
  // ─────────────────────────────────────────────────────────────────────────
  const specialistsAtSelectedTime = useMemo(() => {
    if (!selectedTime) {
      return new Set<string>();
    }

    // Find the time slot and get its available specialists
    const slot = timeSlots.find((s) => s.time === selectedTime);
    if (!slot?.availableSpecialistIds) {
      return new Set<string>();
    }

    // Convert specialist.id to member_id
    const memberIds = new Set<string>();
    for (const specId of slot.availableSpecialistIds) {
      const specialist = allSpecialists.find((s) => s.id === specId);
      if (specialist) {
        memberIds.add(specialist.member_id);
      }
    }

    return memberIds;
  }, [selectedTime, timeSlots, allSpecialists]);

  // ─────────────────────────────────────────────────────────────────────────
  // Derived: Ready to book
  // ─────────────────────────────────────────────────────────────────────────
  const isReadyToBook = useMemo(() => {
    return (
      selectedServiceIds.size > 0 &&
      selectedSpecialistId !== null &&
      selectedDate !== null &&
      selectedTime !== null
    );
  }, [selectedServiceIds.size, selectedSpecialistId, selectedDate, selectedTime]);

  // ─────────────────────────────────────────────────────────────────────────
  // Effect: Fetch working days when specialist/month changes
  // Supports both single-specialist and all-specialists (date-first) modes
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

      if (selectedSpecialistId) {
        // Single specialist mode: fetch only their working days
        const specialist = allSpecialists.find(
          (s) => s.member_id === selectedSpecialistId,
        );
        if (!specialist) {
          setIsLoadingCalendar(false);
          return;
        }

        const result = await getWorkingDaysForRange(
          specialist.id,
          startDate,
          endDate,
        );

        if (result.success) {
          setWorkingDays(new Set(result.data));
          // Don't clear dateSpecialistMap - we still need it for showing
          // which OTHER specialists work on the selected date
        }
      } else {
        // Date-first mode: fetch working days for ALL active specialists
        const activeSpecialistIds = allSpecialists
          .filter((s) => s.is_active && s.service_count > 0)
          .map((s) => s.id);

        if (activeSpecialistIds.length === 0) {
          setWorkingDays(new Set());
          setDateSpecialistMap(new Map());
          setIsLoadingCalendar(false);
          return;
        }

        const result = await getWorkingDaysForAllSpecialists(
          activeSpecialistIds,
          startDate,
          endDate,
        );

        if (result.success) {
          setWorkingDays(new Set(result.data.dates));
          setDateSpecialistMap(result.data.dateSpecialistMap);
        }
      }

      setIsLoadingCalendar(false);
    };

    fetchWorkingDays();
  }, [selectedSpecialistId, currentMonth, allSpecialists]);

  // ─────────────────────────────────────────────────────────────────────────
  // Effect: Auto-select today if available and no date selected
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Only auto-select if no date is currently selected
    if (selectedDate) return;

    // Check if today is in the working days
    const today = new Date();
    const todayStr = formatDateToYYYYMMDD(today);

    if (workingDays.has(todayStr)) {
      setSelectedDate(today);
    }
  }, [workingDays, selectedDate]);

  // ─────────────────────────────────────────────────────────────────────────
  // Effect: Fetch time slots when date changes
  // Supports both single-specialist and all-specialists (date-first) modes
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedDate) {
      setTimeSlots([]);
      return;
    }

    const dateStr = formatDateToYYYYMMDD(selectedDate);

    const fetchSlots = async () => {
      setIsLoadingSlots(true);

      if (selectedSpecialistId) {
        // Single specialist mode
        const specialist = allSpecialists.find(
          (s) => s.member_id === selectedSpecialistId,
        );
        if (!specialist) {
          setTimeSlots([]);
          setIsLoadingSlots(false);
          return;
        }

        const specialistData = specialistsWithPrices.find(
          (s) => s.member_id === selectedSpecialistId,
        );
        const totalDuration = specialistData?.totalDurationMinutes ?? 60;

        const result = await getAvailabilityData({
          specialistId: specialist.id,
          startDate: dateStr,
          endDate: dateStr,
        });

        if (!result.success) {
          setTimeSlots([]);
          setIsLoadingSlots(false);
          return;
        }

        const { workingDays: workingDaysData, appointments, bookingSettings } =
          result.data;

        const workingDay = workingDaysData.find((wd) => wd.date === dateStr) ?? null;

        const slots = generateAvailableSlots({
          workingDay,
          appointments,
          serviceDurationMinutes: totalDuration,
          slotIntervalMinutes: 30,
          minNoticeHours: bookingSettings?.minBookingNoticeHours ?? 0,
          date: selectedDate,
          timezone,
        });

        // Convert to AggregatedTimeSlot with single specialist
        const aggregatedSlots: AggregatedTimeSlot[] = slots.map((slot) => ({
          ...slot,
          availableSpecialistIds: slot.available ? [specialist.id] : [],
        }));

        setTimeSlots(aggregatedSlots);
      } else {
        // All-specialists mode (date-first flow)
        // Get specialist IDs working on this date
        const specialistIdsOnDate = dateSpecialistMap.get(dateStr) ?? [];
        if (specialistIdsOnDate.length === 0) {
          setTimeSlots([]);
          setIsLoadingSlots(false);
          return;
        }

        const result = await getAvailabilityForMultipleSpecialists(
          specialistIdsOnDate,
          dateStr,
        );

        if (!result.success) {
          setTimeSlots([]);
          setIsLoadingSlots(false);
          return;
        }

        // Generate slots for each specialist and merge them
        const slotMap = new Map<string, AggregatedTimeSlot>();

        for (const availData of result.data) {
          const specId = availData.specialistId!;
          const workingDay = availData.workingDays[0] ?? null;

          // Calculate duration for this specialist based on selected services
          // If no services selected, use 0 to show all possible time slots
          const specialist = allSpecialists.find((s) => s.id === specId);
          const specialistWithPrice = specialist
            ? specialistsWithPrices.find((s) => s.id === specialist.id)
            : null;
          const serviceDuration = specialistWithPrice?.totalDurationMinutes ?? 0;

          const slots = generateAvailableSlots({
            workingDay,
            appointments: availData.appointments,
            serviceDurationMinutes: serviceDuration,
            slotIntervalMinutes: 30,
            minNoticeHours: availData.bookingSettings?.minBookingNoticeHours ?? 0,
            date: selectedDate,
            timezone,
          });

          // Merge into slotMap
          for (const slot of slots) {
            const existing = slotMap.get(slot.time);
            if (existing) {
              // Merge: slot is available if ANY specialist has it available
              if (slot.available) {
                existing.available = true;
                existing.reason = undefined;
                existing.availableSpecialistIds.push(specId);
              }
            } else {
              slotMap.set(slot.time, {
                ...slot,
                availableSpecialistIds: slot.available ? [specId] : [],
              });
            }
          }
        }

        // Sort by time and convert to array
        const aggregatedSlots = Array.from(slotMap.values()).sort((a, b) =>
          a.time.localeCompare(b.time),
        );

        setTimeSlots(aggregatedSlots);
      }

      setIsLoadingSlots(false);
    };

    fetchSlots();
  }, [selectedSpecialistId, selectedDate, allSpecialists, specialistsWithPrices, selectedServices, timezone, dateSpecialistMap]);

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
    // Don't clear specialist or date - let user see if they become unavailable
    // Only clear time as slot availability may change with service duration
    setSelectedTime(null);
  }, []);

  const selectSpecialist = useCallback((specialistId: string | null) => {
    setSelectedSpecialistId(specialistId);
    // Don't clear date when specialist changes - preserve date-first selection
    // Only clear time as availability may differ for different specialists
    setSelectedTime(null);
    setTimeSlots([]);
  }, []);

  const selectDate = useCallback((date: Date | null) => {
    setSelectedDate(date);
    // Clear time when date changes
    setSelectedTime(null);
    setTimeSlots([]);
  }, []);

  const selectTime = useCallback((time: string | null) => {
    setSelectedTime(time);
  }, []);

  const clearAll = useCallback(() => {
    setSelectedServiceIds(new Set());
    setSelectedSpecialistId(null);
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

  const isServiceCompatible = useCallback(
    (serviceId: string) => compatibleServiceIds.has(serviceId),
    [compatibleServiceIds],
  );

  const isSpecialistAvailable = useCallback(
    (specialistId: string) => availableSpecialistIds.has(specialistId),
    [availableSpecialistIds],
  );

  const isSpecialistWorkingOnDate = useCallback(
    (specialistId: string) => {
      if (!selectedDate) return true; // No date selected, all are "available"
      return specialistsOnSelectedDate.has(specialistId);
    },
    [selectedDate, specialistsOnSelectedDate],
  );

  const isSpecialistAvailableAtTime = useCallback(
    (specialistId: string) => {
      if (!selectedTime) return true; // No time selected, all are "available"
      return specialistsAtSelectedTime.has(specialistId);
    },
    [selectedTime, specialistsAtSelectedTime],
  );

  const getSpecialistPrice = useCallback(
    (specialistId: string) => {
      const specialist = specialistsWithPrices.find(
        (s) => s.member_id === specialistId,
      );
      return specialist?.totalPriceCents ?? 0;
    },
    [specialistsWithPrices],
  );

  const getSpecialistDuration = useCallback(
    (specialistId: string) => {
      const specialist = specialistsWithPrices.find(
        (s) => s.member_id === specialistId,
      );
      return specialist?.totalDurationMinutes ?? 0;
    },
    [specialistsWithPrices],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Context Value
  // ─────────────────────────────────────────────────────────────────────────
  const value: BookingLayoutContextValue = useMemo(
    () => ({
      // Source data
      allServices,
      allSpecialists,

      // Selections
      selectedServiceIds,
      selectedSpecialistId,
      selectedDate,
      selectedTime,

      // Derived
      availableSpecialistIds,
      compatibleServiceIds,
      specialistsWithPrices,
      selectedServices,
      totalPriceRange,
      totalDurationRange,
      specialistsOnSelectedDate,

      // Calendar
      workingDays,
      dateSpecialistMap,
      currentMonth,
      timeSlots,
      specialistsAtSelectedTime,
      isLoadingCalendar,
      isLoadingSlots,

      // Ready state
      isReadyToBook,

      // Actions
      toggleService,
      selectSpecialist,
      selectDate,
      selectTime,
      setCurrentMonth,
      clearAll,

      // Helpers
      isServiceSelected,
      isServiceCompatible,
      isSpecialistAvailable,
      isSpecialistWorkingOnDate,
      isSpecialistAvailableAtTime,
      getSpecialistPrice,
      getSpecialistDuration,
    }),
    [
      allServices,
      allSpecialists,
      selectedServiceIds,
      selectedSpecialistId,
      selectedDate,
      selectedTime,
      availableSpecialistIds,
      compatibleServiceIds,
      specialistsWithPrices,
      selectedServices,
      totalPriceRange,
      totalDurationRange,
      specialistsOnSelectedDate,
      workingDays,
      dateSpecialistMap,
      currentMonth,
      timeSlots,
      specialistsAtSelectedTime,
      isLoadingCalendar,
      isLoadingSlots,
      isReadyToBook,
      toggleService,
      selectSpecialist,
      selectDate,
      selectTime,
      clearAll,
      isServiceSelected,
      isServiceCompatible,
      isSpecialistAvailable,
      isSpecialistWorkingOnDate,
      isSpecialistAvailableAtTime,
      getSpecialistPrice,
      getSpecialistDuration,
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
