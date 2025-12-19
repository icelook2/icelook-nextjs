/**
 * Appointment system types matching the database schema.
 */

// ============================================================================
// Constants as Types
// ============================================================================

export const APPOINTMENT_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export type Currency = "UAH" | "USD" | "EUR";

// ============================================================================
// Database Row Types (matching appointments-schema.md)
// ============================================================================

/**
 * Complete appointment record from database (with snapshot data).
 * Snapshot fields preserve data at booking time - original records can be deleted.
 */
export interface Appointment {
  id: string;

  // References (nullable - original records can be deleted)
  specialist_id: string | null;
  service_id: string | null;
  client_id: string | null;

  // Snapshot: Specialist data at booking time
  specialist_username: string;
  specialist_display_name: string;

  // Snapshot: Service data at booking time
  service_name: string;
  service_price: number;
  service_currency: Currency;
  service_duration_minutes: number;

  // Snapshot: Client data at booking time
  client_name: string;
  client_phone: string;
  client_email: string | null;

  // Booking details
  date: string; // "YYYY-MM-DD"
  start_time: string; // "HH:MM:SS"
  end_time: string; // "HH:MM:SS"
  timezone: string; // IANA timezone

  // Status
  status: AppointmentStatus;

  // Notes
  client_notes: string | null;
  specialist_notes: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
}

/**
 * Specialist booking settings.
 */
export interface SpecialistBookingSettings {
  specialist_id: string;
  auto_confirm: boolean;
  min_booking_notice_hours: number;
  max_booking_days_ahead: number;
  allow_client_cancellation: boolean;
  cancellation_notice_hours: number;
  created_at: string;
  updated_at: string;
}

/**
 * Time slot for availability display.
 */
export interface TimeSlot {
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  available: boolean;
  blockedReason?: "break" | "booked";
}

// ============================================================================
// Booking Wizard Types
// ============================================================================

/**
 * Service data for booking (subset of full Service type).
 */
export interface BookingService {
  id: string;
  name: string;
  price: number;
  currency: Currency;
  duration_minutes: number;
}

/**
 * Specialist data for booking context.
 */
export interface BookingSpecialist {
  id: string;
  username: string;
  display_name: string;
  timezone: string;
}

/**
 * Booking wizard steps.
 */
export type BookingStep = "datetime" | "guest-info" | "confirmation";

/**
 * Computed totals for multiple services.
 */
export interface BookingTotals {
  totalPrice: number;
  totalDurationMinutes: number;
  currency: Currency;
}

/**
 * Complete booking form data (accumulated across wizard steps).
 */
export interface BookingFormData {
  // Pre-selected from profile (supports multiple services)
  services: BookingService[];

  // Step 1: Date & Time
  date: string | null; // "YYYY-MM-DD"
  timeSlot: { start: string; end: string } | null; // "HH:MM"

  // Step 2: Guest Info (only if not logged in)
  guestName: string;
  guestPhone: string;

  // Step 3: Confirmation
  clientNotes: string;
}

// ============================================================================
// Server Action Input Types
// ============================================================================

/**
 * Input for creating an appointment (sent to server action).
 */
export interface CreateAppointmentInput {
  specialist_id: string;
  service_id: string;
  date: string; // "YYYY-MM-DD"
  start_time: string; // "HH:MM"
  client_notes?: string;

  // Guest booking fields (required if not logged in)
  guest_name?: string;
  guest_phone?: string;
}

/**
 * Input for updating booking settings.
 */
export interface UpdateBookingSettingsInput {
  auto_confirm: boolean;
  min_booking_notice_hours: number;
  max_booking_days_ahead: number;
  allow_client_cancellation: boolean;
  cancellation_notice_hours: number;
}

/**
 * Input for creating a multi-service appointment.
 */
export interface CreateMultiServiceAppointmentInput {
  specialist_id: string;
  service_ids: string[];
  date: string; // "YYYY-MM-DD"
  start_time: string; // "HH:MM"
  client_notes?: string;

  // Guest booking fields (required if not logged in)
  guest_name?: string;
  guest_phone?: string;
}
