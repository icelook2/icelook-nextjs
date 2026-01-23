/**
 * Types for service bundles - packages of multiple services with a discount.
 *
 * Bundle Structure:
 * - A bundle contains 2+ services
 * - Discount can be percentage OR fixed amount
 * - Bundles can be time-limited (valid date range for appointments)
 * - Bundles can be quantity-limited (max bookings)
 */

import type { ProfileService } from "@/lib/queries/beauty-page-profile";

// ============================================================================
// Enums
// ============================================================================

/** Type of discount applied to a bundle */
export type DiscountType = "percentage" | "fixed";

/** Reason why a bundle is unavailable */
export type BundleUnavailableReason =
  | "expired"
  | "not_started"
  | "sold_out"
  | "inactive";

// ============================================================================
// Database Types
// ============================================================================

/** Service bundle as stored in the database */
export type ServiceBundle = {
  id: string;
  beauty_page_id: string;
  name: string;
  description: string | null;
  /** @deprecated Use discount_type and discount_value instead */
  discount_percentage: number;
  /** Type of discount: 'percentage' or 'fixed' */
  discount_type: DiscountType;
  /** Discount value: percentage (1-90) or fixed cents */
  discount_value: number;
  /** Start date for time-limited bundles (appointments must be on/after) */
  valid_from: string | null;
  /** End date for time-limited bundles (appointments must be on/before) */
  valid_until: string | null;
  /** Maximum number of bookings for quantity-limited bundles */
  max_quantity: number | null;
  /** Current number of bookings for this bundle */
  booked_count: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

/** Junction table for bundle -> service relationship */
export type ServiceBundleItem = {
  id: string;
  bundle_id: string;
  service_id: string;
  display_order: number;
  created_at: string;
};

/** Record of a bundle used in an appointment (for quantity tracking) */
export type AppointmentBundle = {
  id: string;
  appointment_id: string;
  bundle_id: string | null;
  bundle_name: string;
  discount_type: DiscountType;
  discount_value: number;
  original_total_cents: number;
  discounted_total_cents: number;
  created_at: string;
};

// ============================================================================
// Application Types
// ============================================================================

/** Bundle availability status for display */
export type BundleAvailability = {
  isAvailable: boolean;
  reason?: BundleUnavailableReason;
  /** For time-limited: days remaining until expiry */
  daysRemaining?: number;
  /** For quantity-limited: remaining slots */
  remainingQuantity?: number;
};

/** Service within a bundle (includes price/duration for calculations) */
export type BundleService = {
  id: string;
  name: string;
  price_cents: number;
  duration_minutes: number;
  display_order: number;
};

/** Bundle with all services and computed totals for display */
export type ServiceBundleWithServices = {
  id: string;
  beauty_page_id: string;
  name: string;
  description: string | null;
  /** Type of discount: 'percentage' or 'fixed' */
  discount_type: DiscountType;
  /** Discount value: percentage (1-90) or fixed cents */
  discount_value: number;
  /** Effective percentage (computed for fixed discounts) */
  discount_percentage: number;
  /** Start date for time-limited bundles */
  valid_from: string | null;
  /** End date for time-limited bundles */
  valid_until: string | null;
  /** Maximum number of bookings */
  max_quantity: number | null;
  /** Current number of bookings */
  booked_count: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  /** Services included in this bundle */
  services: BundleService[];
  /** Sum of all service prices (before discount) */
  original_total_cents: number;
  /** Price after discount applied */
  discounted_total_cents: number;
  /** Sum of all service durations */
  total_duration_minutes: number;
  /** Availability status */
  availability: BundleAvailability;
};

/** Bundle for public display (minimal data needed for booking) */
export type PublicBundle = {
  id: string;
  name: string;
  description: string | null;
  /** Type of discount: 'percentage' or 'fixed' */
  discount_type: DiscountType;
  /** Discount value: percentage (1-90) or fixed cents */
  discount_value: number;
  /** Effective percentage (for display badges) */
  discount_percentage: number;
  /** Start date for time-limited bundles */
  valid_from: string | null;
  /** End date for time-limited bundles */
  valid_until: string | null;
  /** Maximum number of bookings */
  max_quantity: number | null;
  /** Current number of bookings */
  booked_count: number;
  services: BundleService[];
  original_total_cents: number;
  discounted_total_cents: number;
  total_duration_minutes: number;
  /** Availability status */
  availability: BundleAvailability;
  /** Service IDs for overlap detection with individual selections */
  serviceIds: Set<string>;
};

// ============================================================================
// Input Types
// ============================================================================

/** Input for creating a new bundle */
export type CreateBundleInput = {
  beautyPageId: string;
  nickname: string;
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  serviceIds: string[];
  /** Optional: start date for time-limited bundle */
  validFrom?: string;
  /** Optional: end date for time-limited bundle */
  validUntil?: string;
  /** Optional: max bookings for quantity-limited bundle */
  maxQuantity?: number;
};

/** Input for updating an existing bundle */
export type UpdateBundleInput = {
  bundleId: string;
  nickname: string;
  name?: string;
  description?: string;
  discountType?: DiscountType;
  discountValue?: number;
  serviceIds?: string[];
  isActive?: boolean;
  /** Set to string to update, null to remove limit */
  validFrom?: string | null;
  /** Set to string to update, null to remove limit */
  validUntil?: string | null;
  /** Set to number to update, null to remove limit */
  maxQuantity?: number | null;
};

/** Input for deleting a bundle */
export type DeleteBundleInput = {
  bundleId: string;
  nickname: string;
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculates the discounted price for a bundle based on discount type.
 */
export function calculateBundlePrice(
  originalTotalCents: number,
  discountType: DiscountType,
  discountValue: number,
): number {
  if (discountType === "percentage") {
    return Math.round(originalTotalCents * (1 - discountValue / 100));
  }
  // Fixed discount - subtract the fixed amount (but don't go below 0)
  return Math.max(0, originalTotalCents - discountValue);
}

/**
 * Calculates effective discount percentage (for display).
 * For percentage discounts, returns the value directly.
 * For fixed discounts, calculates what percentage the fixed amount represents.
 */
export function calculateEffectiveDiscountPercentage(
  originalTotalCents: number,
  discountType: DiscountType,
  discountValue: number,
): number {
  if (discountType === "percentage") {
    return discountValue;
  }
  // For fixed: calculate what percentage the fixed amount represents
  if (originalTotalCents <= 0) return 0;
  return Math.round((discountValue / originalTotalCents) * 100);
}

/**
 * Checks bundle availability based on appointment date and quantity.
 *
 * @param bundle - Bundle to check
 * @param appointmentDate - The date of the appointment (YYYY-MM-DD)
 * @returns Availability status with reason if unavailable
 */
export function checkBundleAvailability(
  bundle: {
    is_active: boolean;
    valid_from: string | null;
    valid_until: string | null;
    max_quantity: number | null;
    booked_count: number;
  },
  appointmentDate: string,
): BundleAvailability {
  // Check if active
  if (!bundle.is_active) {
    return { isAvailable: false, reason: "inactive" };
  }

  // Check time limits (appointment date must be within range)
  if (bundle.valid_from && appointmentDate < bundle.valid_from) {
    return { isAvailable: false, reason: "not_started" };
  }

  if (bundle.valid_until && appointmentDate > bundle.valid_until) {
    return { isAvailable: false, reason: "expired" };
  }

  // Check quantity limits
  if (
    bundle.max_quantity !== null &&
    bundle.booked_count >= bundle.max_quantity
  ) {
    return { isAvailable: false, reason: "sold_out" };
  }

  // Calculate remaining info for display
  let daysRemaining: number | undefined;
  if (bundle.valid_until) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const until = new Date(bundle.valid_until);
    daysRemaining = Math.ceil(
      (until.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  let remainingQuantity: number | undefined;
  if (bundle.max_quantity !== null) {
    remainingQuantity = bundle.max_quantity - bundle.booked_count;
  }

  return {
    isAvailable: true,
    daysRemaining,
    remainingQuantity,
  };
}

/**
 * Converts bundle services to ProfileService format with discounted prices
 * for use in the service selection context.
 */
export function bundleServicesToProfileServices(
  services: BundleService[],
  discountType: DiscountType,
  discountValue: number,
): ProfileService[] {
  const originalTotal = services.reduce((sum, s) => sum + s.price_cents, 0);
  const discountedTotal = calculateBundlePrice(
    originalTotal,
    discountType,
    discountValue,
  );
  const discountMultiplier =
    originalTotal > 0 ? discountedTotal / originalTotal : 1;

  return services.map((service) => ({
    id: service.id,
    name: service.name,
    description: null,
    display_order: service.display_order,
    price_cents: Math.round(service.price_cents * discountMultiplier),
    duration_minutes: service.duration_minutes,
    available_from_time: null,
    available_to_time: null,
  }));
}
