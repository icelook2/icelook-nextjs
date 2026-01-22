/**
 * Types for service bundles - packages of multiple services with a discount.
 *
 * Bundle Structure:
 * - A bundle contains 2+ services
 * - Discount is applied as a percentage off the total
 * - Bundles are always available (not time-limited like special offers)
 */

import type { ProfileService } from "@/lib/queries/beauty-page-profile";

// ============================================================================
// Database Types
// ============================================================================

/** Service bundle as stored in the database */
export type ServiceBundle = {
  id: string;
  beauty_page_id: string;
  name: string;
  description: string | null;
  discount_percentage: number;
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

// ============================================================================
// Application Types
// ============================================================================

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
  discount_percentage: number;
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
};

/** Bundle for public display (minimal data needed for booking) */
export type PublicBundle = {
  id: string;
  name: string;
  description: string | null;
  discount_percentage: number;
  services: BundleService[];
  original_total_cents: number;
  discounted_total_cents: number;
  total_duration_minutes: number;
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
  discountPercentage: number;
  serviceIds: string[];
};

/** Input for updating an existing bundle */
export type UpdateBundleInput = {
  bundleId: string;
  nickname: string;
  name?: string;
  description?: string;
  discountPercentage?: number;
  serviceIds?: string[];
  isActive?: boolean;
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
 * Calculates the discounted price for a bundle
 */
export function calculateBundlePrice(
  originalTotalCents: number,
  discountPercentage: number,
): number {
  return Math.round(originalTotalCents * (1 - discountPercentage / 100));
}

/**
 * Converts bundle services to ProfileService format with discounted prices
 * for use in the service selection context.
 */
export function bundleServicesToProfileServices(
  services: BundleService[],
  discountPercentage: number,
): ProfileService[] {
  const discountMultiplier = 1 - discountPercentage / 100;

  return services.map((service) => ({
    id: service.id,
    name: service.name,
    display_order: service.display_order,
    price_cents: Math.round(service.price_cents * discountMultiplier),
    duration_minutes: service.duration_minutes,
    available_from_time: null,
    available_to_time: null,
  }));
}
