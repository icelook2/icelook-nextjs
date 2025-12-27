/**
 * Booking Flow Types
 *
 * Type definitions for the multi-step booking dialog.
 */

import type {
  ProfileService,
  SpecialistAssignment,
} from "@/lib/queries/beauty-page-profile";

// ============================================================================
// Booking Steps
// ============================================================================

/** All possible steps in the booking flow */
export type BookingStep =
  | "specialist" // Optional: shown only when multiple specialists available
  | "date" // Step 1: Select date
  | "time" // Step 2: Select time slot
  | "confirm" // Step 3: Review + guest info form
  | "success"; // Final: Booking confirmed

// ============================================================================
// Specialist Types
// ============================================================================

/** Specialist available for booking with aggregated service info */
export interface AvailableSpecialist {
  memberId: string;
  specialistId: string;
  displayName: string;
  avatarUrl: string | null;
  /** Total price for all selected services (in cents) */
  totalPriceCents: number;
  /** Total duration for all selected services (in minutes) */
  totalDurationMinutes: number;
}

// ============================================================================
// Time Slot Types
// ============================================================================

/** Individual time slot with availability info */
export interface TimeSlot {
  /** Time in "HH:MM" format */
  time: string;
  /** Whether the slot is available for booking */
  available: boolean;
  /** Reason if not available */
  reason?: "past" | "break" | "booked" | "outside_hours";
}

// ============================================================================
// Guest Info Types
// ============================================================================

/** Guest information for booking without authentication */
export interface GuestInfo {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}

// ============================================================================
// Booking State Types
// ============================================================================

/** Complete booking state managed by BookingContext */
export interface BookingState {
  /** Current step in the flow */
  step: BookingStep;
  /** Selected specialist (required before date selection) */
  specialist: AvailableSpecialist | null;
  /** Selected date */
  date: Date | null;
  /** Selected time in "HH:MM" format */
  time: string | null;
  /** Guest info (for unauthenticated users) */
  guestInfo: GuestInfo | null;
  /** Booking result after submission */
  result: BookingResult | null;
  /** Whether booking is in progress */
  isSubmitting: boolean;
  /** Error message if booking failed */
  error: string | null;
}

// ============================================================================
// Server Action Types
// ============================================================================

/** Input for fetching availability data */
export interface GetAvailabilityInput {
  specialistId: string;
  /** Date in YYYY-MM-DD format */
  startDate: string;
  /** Date in YYYY-MM-DD format */
  endDate: string;
}

/** Booking settings for a specialist */
export interface SpecialistBookingSettings {
  /** Whether bookings are auto-confirmed */
  autoConfirm: boolean;
  /** Minimum hours before appointment for booking */
  minBookingNoticeHours: number;
  /** Maximum days ahead for booking */
  maxDaysAhead: number;
  /** Minimum hours before appointment for cancellation */
  cancellationNoticeHours: number;
}

/** Working day data for availability calculation */
export interface WorkingDayData {
  date: string;
  startTime: string;
  endTime: string;
  breaks: Array<{
    startTime: string;
    endTime: string;
  }>;
}

/** Appointment data for conflict detection */
export interface AppointmentData {
  id: string;
  startTime: string;
  endTime: string;
  status: "pending" | "confirmed";
}

/** Response from getAvailabilityData */
export interface AvailabilityData {
  workingDays: WorkingDayData[];
  appointments: AppointmentData[];
  bookingSettings: SpecialistBookingSettings | null;
}

/** Input for creating a booking */
export interface CreateBookingInput {
  beautyPageId: string;
  specialistMemberId: string;
  serviceIds: string[];
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Time in HH:MM format */
  startTime: string;
  /** Time in HH:MM format */
  endTime: string;
  clientInfo: {
    name: string;
    phone: string;
    email?: string;
    notes?: string;
  };
  /** User ID if authenticated */
  clientId?: string;
}

/** Successful booking result */
export interface BookingSuccess {
  success: true;
  appointmentId: string;
  /** Status depends on specialist's auto_confirm setting */
  status: "pending" | "confirmed";
}

/** Failed booking result */
export interface BookingError {
  success: false;
  error: "slot_taken" | "not_working" | "validation" | "unknown";
  message: string;
}

/** Combined booking result type */
export type BookingResult = BookingSuccess | BookingError;

// ============================================================================
// Props Types
// ============================================================================

/** Props for the main booking dialog */
export interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  beautyPageId: string;
  nickname: string;
  timezone: string;
  currency: string;
  locale: string;
  /** Selected services from ServiceSelectionContext */
  selectedServices: ProfileService[];
  /** Specialists who can do all selected services */
  availableSpecialists: AvailableSpecialist[];
  /** Current user ID if authenticated */
  currentUserId?: string;
}
