/**
 * Query functions for service bundles.
 *
 * Bundles are packages of multiple services sold at a discount.
 * They are always available (not time-limited like special offers).
 */

import { createClient } from "@/lib/supabase/server";
import type {
  BundleService,
  PublicBundle,
  ServiceBundleWithServices,
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
  discount_percentage: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  service_bundle_items: RawBundleItem[];
};

/**
 * Transforms raw database bundle data into ServiceBundleWithServices
 */
function transformBundle(raw: RawBundle): ServiceBundleWithServices {
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
  const discounted_total_cents = Math.round(
    original_total_cents * (1 - raw.discount_percentage / 100),
  );

  return {
    id: raw.id,
    beauty_page_id: raw.beauty_page_id,
    name: raw.name,
    description: raw.description,
    discount_percentage: raw.discount_percentage,
    is_active: raw.is_active,
    display_order: raw.display_order,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    services,
    original_total_cents,
    discounted_total_cents,
    total_duration_minutes,
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
 * @returns Array of active bundles with services and computed totals
 */
export async function getActiveBundles(
  beautyPageId: string,
): Promise<PublicBundle[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("service_bundles")
    .select(
      `
      id,
      beauty_page_id,
      name,
      description,
      discount_percentage,
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
    `,
    )
    .eq("beauty_page_id", beautyPageId)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching active bundles:", error);
    return [];
  }

  return (data as unknown as RawBundle[]).map((bundle) => {
    const transformed = transformBundle(bundle);
    return {
      id: transformed.id,
      name: transformed.name,
      description: transformed.description,
      discount_percentage: transformed.discount_percentage,
      services: transformed.services,
      original_total_cents: transformed.original_total_cents,
      discounted_total_cents: transformed.discounted_total_cents,
      total_duration_minutes: transformed.total_duration_minutes,
    };
  });
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
    .select(
      `
      id,
      beauty_page_id,
      name,
      description,
      discount_percentage,
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
    `,
    )
    .eq("beauty_page_id", beautyPageId)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching all bundles:", error);
    return [];
  }

  return (data as unknown as RawBundle[]).map(transformBundle);
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
    .select(
      `
      id,
      beauty_page_id,
      name,
      description,
      discount_percentage,
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
    `,
    )
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
    .select(
      `
      id,
      beauty_page_id,
      name,
      description,
      discount_percentage,
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
    `,
    )
    .in("id", bundleIds)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching bundles for service:", error);
    return [];
  }

  return (data as unknown as RawBundle[]).map(transformBundle);
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
