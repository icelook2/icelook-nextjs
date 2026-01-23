/**
 * Booking Restrictions Types
 *
 * Types for the booking abuse prevention system.
 * These supplement the auto-generated database.types.ts until
 * the Supabase migrations are applied and types are regenerated.
 */

// ============================================================================
// Database Table Types (matches SQL schema)
// ============================================================================

export interface BookingRestrictionDefaults {
  id: string;
  max_future_appointments: number;
  max_bookings_per_hour: number;
  max_bookings_per_day: number;
  booking_cooldown_seconds: number;
  no_show_strikes_for_temp_block: number;
  temp_block_duration_days: number;
  created_at: string;
  updated_at: string;
}

export interface UserBookingLimits {
  id: string;
  user_id: string | null;
  client_phone: string | null;
  client_email: string | null;
  max_future_appointments: number | null;
  max_bookings_per_hour: number | null;
  max_bookings_per_day: number | null;
  booking_cooldown_seconds: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientNoShow {
  id: string;
  beauty_page_id: string;
  client_id: string | null;
  client_phone: string | null;
  client_email: string | null;
  no_show_count: number;
  is_blocked: boolean;
  blocked_at: string | null;
  blocked_until: string | null;
  last_no_show_appointment_id: string | null;
  last_no_show_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlockedClient {
  id: string;
  beauty_page_id: string;
  client_id: string | null;
  client_phone: string | null;
  client_email: string | null;
  reason: string | null;
  blocked_by: string;
  created_at: string;
}

// ============================================================================
// Booking Restriction Check Result
// ============================================================================

export type BookingRestrictionReason =
  | "blocked"
  | "not_authenticated"
  | "overlapping"
  | "max_future_reached"
  | "hourly_limit"
  | "daily_limit"
  | "cooldown";

export interface BookingRestrictionCheckResult {
  allowed: boolean;
  reason?: BookingRestrictionReason;
  message?: string;
  // Additional context depending on reason
  blocked_until?: string;
  current_count?: number;
  max_allowed?: number;
  wait_seconds?: number;
}

// ============================================================================
// Client Identifier (for queries)
// ============================================================================

export interface ClientIdentifier {
  clientId?: string | null;
  clientEmail?: string | null;
}

// ============================================================================
// Blocked Client with Beauty Page Info (for UI)
// ============================================================================

export interface BlockedClientWithDetails extends BlockedClient {
  client_name?: string;
  appointment_count?: number;
  last_appointment_date?: string;
}
