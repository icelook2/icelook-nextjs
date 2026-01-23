/**
 * Query functions for service bundles.
 *
 * Bundles are packages of multiple services sold at a discount.
 * They can be:
 * - Always available (no limits)
 * - Time-limited (valid_from / valid_until)
 * - Quantity-limited (max_quantity)
 */

import { createClient } from "@/lib/supabase/server";
import type {
  BundleService,
  DiscountType,
  PublicBundle,
  ServiceBundleWithServices,
} from "@/lib/types/bundles";
import {
  calculateBundlePrice,
  calculateEffectiveDiscountPercentage,
  checkBundleAvailability,
} from "@/lib/types/bundles";

// ============================================================================
// Internal Helpers
// ============================================================================

type RawBundleItem = {
  service_id: string;
  display_order: number;
  services: {
    id: string;
    name: string;
    price_cents: number;
    duration_minutes: number;
  } | null;
};

type RawBundle = {
  id: string;
  beauty_page_id: string;
  name: string;
  description: string | null;
  /** @deprecated Use discount_type and discount_value */
  discount_percentage: number;
  discount_type: string;
  discount_value: number;
  valid_from: string | null;
  valid_until: string | null;
  max_quantity: number | null;
  booked_count: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  service_bundle_items: RawBundleItem[];
};

/** Common select fields for bundle queries */
const BUNDLE_SELECT_FIELDS = `
  id,
  beauty_page_id,
  name,
  description,
  discount_percentage,
  discount_type,
  discount_value,
  valid_from,
  valid_until,
  max_quantity,
  booked_count,
  is_active,
  display_order,
  created_at,
  updated_at,
  service_bundle_items (
    service_id,
    display_order,
    services (
      id,
      name,
      price_cents,
      duration_minutes
    )
  )
`;

/**
 * Transforms raw database bundle data into ServiceBundleWithServices
 *
 * @param raw - Raw bundle data from database
 * @param forDate - Optional appointment date for availability check (defaults to today)
 */
function transformBundle(
  raw: RawBundle,
  forDate?: string,
): ServiceBundleWithServices {
  // Sort and extract services (filter out any null services from deleted records)
  const services: BundleService[] = raw.service_bundle_items
    .filter((item) => item.services !== null)
    .sort((a, b) => a.display_order - b.display_order)
    .map((item) => ({
      id: item.services!.id,
      name: item.services!.name,
      price_cents: item.services!.price_cents,
      duration_minutes: item.services!.duration_minutes,
      display_order: item.display_order,
    }));

  // Calculate totals
  const original_total_cents = services.reduce(
    (sum, s) => sum + s.price_cents,
    0,
  );
  const total_duration_minutes = services.reduce(
    (sum, s) => sum + s.duration_minutes,
    0,
  );

  // Get discount type (default to 'percentage' for backwards compatibility)
  const discountType = (raw.discount_type || "percentage") as DiscountType;
  // Get discount value (fall back to discount_percentage for old records)
  const discountValue = raw.discount_value || raw.discount_percentage;

  // Calculate discounted price using the new discount system
  const discounted_total_cents = calculateBundlePrice(
    original_total_cents,
    discountType,
    discountValue,
  );

  // Calculate effective percentage for display
  const discount_percentage = calculateEffectiveDiscountPercentage(
    original_total_cents,
    discountType,
    discountValue,
  );

  // Check availability
  const today = forDate ?? new Date().toISOString().split("T")[0];
  const availability = checkBundleAvailability(
    {
      is_active: raw.is_active,
      valid_from: raw.valid_from,
      valid_until: raw.valid_until,
      max_quantity: raw.max_quantity,
      booked_count: raw.booked_count,
    },
    today,
  );

  return {
    id: raw.id,
    beauty_page_id: raw.beauty_page_id,
    name: raw.name,
    description: raw.description,
    discount_type: discountType,
    discount_value: discountValue,
    discount_percentage,
    valid_from: raw.valid_from,
    valid_until: raw.valid_until,
    max_quantity: raw.max_quantity,
    booked_count: raw.booked_count,
    is_active: raw.is_active,
    display_order: raw.display_order,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    services,
    original_total_cents,
    discounted_total_cents,
    total_duration_minutes,
    availability,
  };
}

/**
 * Converts ServiceBundleWithServices to PublicBundle
 */
function toPublicBundle(bundle: ServiceBundleWithServices): PublicBundle {
  return {
    id: bundle.id,
    name: bundle.name,
    description: bundle.description,
    discount_type: bundle.discount_type,
    discount_value: bundle.discount_value,
    discount_percentage: bundle.discount_percentage,
    valid_from: bundle.valid_from,
    valid_until: bundle.valid_until,
    max_quantity: bundle.max_quantity,
    booked_count: bundle.booked_count,
    services: bundle.services,
    original_total_cents: bundle.original_total_cents,
    discounted_total_cents: bundle.discounted_total_cents,
    total_duration_minutes: bundle.total_duration_minutes,
    availability: bundle.availability,
    serviceIds: new Set(bundle.services.map((s) => s.id)),
  };
}

// ============================================================================
// Public Queries
// ============================================================================

/**
 * Fetches active bundles for public display on a beauty page.
 * Used by clients viewing the beauty page.
 *
 * @param beautyPageId - The beauty page ID
 * @param forDate - Optional appointment date to filter availability (defaults to today)
 * @param includeUnavailable - If true, returns all active bundles regardless of availability
 * @returns Array of active bundles with services and computed totals
 */
export async function getActiveBundles(
  beautyPageId: string,
  forDate?: string,
  includeUnavailable = false,
): Promise<PublicBundle[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("service_bundles")
    .select(BUNDLE_SELECT_FIELDS)
    .eq("beauty_page_id", beautyPageId)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching active bundles:", error);
    return [];
  }

  const bundles = (data as unknown as RawBundle[]).map((bundle) => {
    const transformed = transformBundle(bundle, forDate);
    return toPublicBundle(transformed);
  });

  // Filter out unavailable bundles unless includeUnavailable is true
  if (includeUnavailable) {
    return bundles;
  }

  return bundles.filter((bundle) => bundle.availability.isAvailable);
}

/**
 * Fetches all bundles for creator settings (includes inactive).
 * Used by beauty page owner to manage bundles.
 *
 * @param beautyPageId - The beauty page ID
 * @returns Array of all bundles with services and computed totals
 */
export async function getAllBundles(
  beautyPageId: string,
): Promise<ServiceBundleWithServices[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("service_bundles")
    .select(BUNDLE_SELECT_FIELDS)
    .eq("beauty_page_id", beautyPageId)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching all bundles:", error);
    return [];
  }

  return (data as unknown as RawBundle[]).map((bundle) =>
    transformBundle(bundle),
  );
}

/**
 * Fetches a single bundle by ID.
 *
 * @param bundleId - The bundle ID
 * @returns Bundle with services or null if not found
 */
export async function getBundleById(
  bundleId: string,
): Promise<ServiceBundleWithServices | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("service_bundles")
    .select(BUNDLE_SELECT_FIELDS)
    .eq("id", bundleId)
    .single();

  if (error) {
    console.error("Error fetching bundle:", error);
    return null;
  }

  return transformBundle(data as unknown as RawBundle);
}

/**
 * Fetches all bundles that contain a specific service.
 * Used in service details page to show which bundles include this service.
 *
 * @param serviceId - The service ID
 * @returns Array of bundles containing this service
 */
export async function getBundlesForService(
  serviceId: string,
): Promise<ServiceBundleWithServices[]> {
  const supabase = await createClient();

  // First get all bundle IDs that contain this service
  const { data: bundleItems, error: itemsError } = await supabase
    .from("service_bundle_items")
    .select("bundle_id")
    .eq("service_id", serviceId);

  if (itemsError || !bundleItems || bundleItems.length === 0) {
    return [];
  }

  const bundleIds = bundleItems.map((item) => item.bundle_id);

  // Then fetch the full bundles
  const { data, error } = await supabase
    .from("service_bundles")
    .select(BUNDLE_SELECT_FIELDS)
    .in("id", bundleIds)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching bundles for service:", error);
    return [];
  }

  return (data as unknown as RawBundle[]).map((bundle) =>
    transformBundle(bundle),
  );
}

/**
 * Checks if a bundle with the given name already exists for a beauty page.
 * Used to prevent duplicate bundle names.
 *
 * @param beautyPageId - The beauty page ID
 * @param name - The bundle name to check
 * @param excludeBundleId - Optional bundle ID to exclude (for updates)
 * @returns true if a bundle with this name exists
 */
export async function checkBundleNameExists(
  beautyPageId: string,
  name: string,
  excludeBundleId?: string,
): Promise<boolean> {
  const supabase = await createClient();

  let query = supabase
    .from("service_bundles")
    .select("id", { count: "exact", head: true })
    .eq("beauty_page_id", beautyPageId)
    .ilike("name", name);

  if (excludeBundleId) {
    query = query.neq("id", excludeBundleId);
  }

  const { count, error } = await query;

  if (error) {
    console.error("Error checking bundle name:", error);
    return false;
  }

  return (count ?? 0) > 0;
}

/**
 * Gets the next display order for a new bundle.
 *
 * @param beautyPageId - The beauty page ID
 * @returns Next display order value
 */
export async function getNextBundleDisplayOrder(
  beautyPageId: string,
): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("service_bundles")
    .select("display_order")
    .eq("beauty_page_id", beautyPageId)
    .order("display_order", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return 0;
  }

  return data.display_order + 1;
}

/**
 * Fetches bundle data needed for booking validation.
 * Returns minimal data for server-side validation.
 *
 * @param bundleId - The bundle ID
 * @returns Bundle validation data or null if not found
 */
export async function getBundleForBookingValidation(bundleId: string): Promise<{
  id: string;
  name: string;
  is_active: boolean;
  discount_type: DiscountType;
  discount_value: number;
  valid_from: string | null;
  valid_until: string | null;
  max_quantity: number | null;
  booked_count: number;
} | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("service_bundles")
    .select(
      `
      id, name, is_active,
      discount_type, discount_value,
      valid_from, valid_until,
      max_quantity, booked_count
    `,
    )
    .eq("id", bundleId)
    .single();

  if (error) {
    console.error("Error fetching bundle for validation:", error);
    return null;
  }

  return {
    ...data,
    discount_type: (data.discount_type || "percentage") as DiscountType,
  };
}
