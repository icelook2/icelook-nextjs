/**
 * Booking Flow Types (Solo Creator Model)
 *
 * Type definitions for the booking flow.
 *
 * Key changes from multi-specialist model:
 * - No specialist selection (creator IS the specialist)
 * - Removed AvailableSpecialist, SpecialistBookingSettings
 * - CreateBookingInput no longer requires specialistMemberId
 */

import type { ProfileService } from "@/lib/queries/beauty-page-profile";
import type { VisitPreferences } from "@/lib/types";

// ============================================================================
// Booking Steps
// ============================================================================

/** All possible steps in the booking flow */
export type BookingStep =
  | "date" // Step 1: Select date
  | "time" // Step 2: Select time slot
  | "confirm" // Step 3: Review + guest info form
  | "success"; // Final: Booking confirmed

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
  /** Phone is required for guests, optional for authenticated users */
  phone?: string;
  email?: string;
  notes?: string;
  /** Visit preferences (optional) */
  visitPreferences?: VisitPreferences;
}

/** Authenticated user profile for booking */
export interface CurrentUserProfile {
  name: string;
  email: string | null;
  /** Pre-fill visit preferences from user profile */
  visitPreferences?: VisitPreferences | null;
}

// ============================================================================
// Booking State Types
// ============================================================================

/** Complete booking state */
export interface BookingState {
  /** Current step in the flow */
  step: BookingStep;
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
  beautyPageId: string;
  /** Date in YYYY-MM-DD format */
  startDate: string;
  /** Date in YYYY-MM-DD format */
  endDate: string;
  /** Appointment ID to exclude from conflict detection (for rescheduling) */
  excludeAppointmentId?: string;
}

/** Booking settings for the beauty page */
export interface BookingSettings {
  /** Whether bookings are auto-confirmed */
  autoConfirm: boolean;
  /** Minimum hours before appointment for booking */
  minBookingNoticeHours: number;
  /** Maximum days ahead for booking */
  maxDaysAhead: number;
  /** Minimum hours before appointment for cancellation */
  cancellationNoticeHours: number;
  /** Default slot interval for new working days (in minutes) */
  slotIntervalMinutes: number;
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
  /** Slot interval for this specific day (in minutes) */
  slotIntervalMinutes: number;
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
  bookingSettings: BookingSettings | null;
}

/** Input for creating a booking */
export interface CreateBookingInput {
  beautyPageId: string;
  serviceIds: string[];
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Time in HH:MM format */
  startTime: string;
  /** Time in HH:MM format */
  endTime: string;
  clientInfo: {
    name: string;
    /** Phone is optional for authenticated users */
    phone?: string;
    email?: string;
    notes?: string;
  };
  /** User ID if authenticated */
  clientId?: string;
  /** Visit preferences for this appointment */
  visitPreferences?: VisitPreferences;
  /**
   * Bundle ID when booking a bundle instead of individual services.
   * When set, the bundle's discounted price is used instead of individual promotions.
   */
  bundleId?: string;
  /**
   * Bundle price in cents (discounted total).
   * Required when bundleId is provided.
   */
  bundlePriceCents?: number;
  /**
   * Bundle total duration in minutes.
   * Required when bundleId is provided.
   */
  bundleDurationMinutes?: number;
  /**
   * Bundle name for display.
   * Required when bundleId is provided.
   */
  bundleName?: string;
}

/** Successful booking result */
export interface BookingSuccess {
  success: true;
  appointmentId: string;
  /** Status depends on beauty page's auto_confirm setting */
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

/** Props for the main booking layout */
export interface BookingLayoutProps {
  beautyPageId: string;
  nickname: string;
  timezone: string;
  currency: string;
  locale: string;
  /** Selected services */
  selectedServices: ProfileService[];
  /** Current user ID if authenticated */
  currentUserId?: string;
}

// ============================================================================
// Booking Context Types
// ============================================================================

/** Creator info for display in booking flow */
export interface CreatorInfo {
  /** Beauty page name - used for consistent gradient calculation across the app */
  name: string;
  /** Display name for visual text (may differ from name) */
  displayName: string;
  avatarUrl: string | null;
}

/** Data for rescheduling an existing appointment */
export interface RescheduleData {
  /** The appointment ID being rescheduled */
  appointmentId: string;
  /** Beauty page nickname for revalidation */
  nickname: string;
  /** Client name for display */
  clientName: string;
  /** Original date (for display) */
  originalDate: string;
  /** Original start time (for display) */
  originalStartTime: string;
}

/** Cached time slots for a specific date */
export interface TimeSlotsCache {
  [dateStr: string]: {
    slots: TimeSlot[];
    status: "loading" | "success" | "error";
  };
}
