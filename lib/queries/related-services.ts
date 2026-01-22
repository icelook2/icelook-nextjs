/**
 * Query functions for related services.
 *
 * Related services are bi-directional associations between services
 * that help with cross-selling during the booking flow.
 */

import type { ProfileService } from "@/lib/queries/beauty-page-profile";
import { createClient } from "@/lib/supabase/server";

// ============================================================================
// Types
// ============================================================================

/** Related service pair as stored in the database */
export type RelatedServicePair = {
  id: string;
  beauty_page_id: string;
  service_a_id: string;
  service_b_id: string;
  created_at: string;
};

/** Service with its related services */
export type ServiceWithRelated = {
  id: string;
  name: string;
  price_cents: number;
  duration_minutes: number;
  relatedServices: ProfileService[];
};

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Gets related services for a specific service.
 * Queries both directions since relationships are bi-directional.
 *
 * @param serviceId - The service ID to find related services for
 * @param beautyPageId - The beauty page ID for authorization
 * @returns Array of related services
 */
export async function getRelatedServices(
  serviceId: string,
  beautyPageId: string,
): Promise<ProfileService[]> {
  const supabase = await createClient();

  // Query relationships where this service is service_a
  const { data: relatedA } = await supabase
    .from("related_services")
    .select(
      `
      services:service_b_id (
        id, name, price_cents, duration_minutes, display_order
      )
    `,
    )
    .eq("service_a_id", serviceId)
    .eq("beauty_page_id", beautyPageId);

  // Query relationships where this service is service_b
  const { data: relatedB } = await supabase
    .from("related_services")
    .select(
      `
      services:service_a_id (
        id, name, price_cents, duration_minutes, display_order
      )
    `,
    )
    .eq("service_b_id", serviceId)
    .eq("beauty_page_id", beautyPageId);

  // Combine and transform results
  const servicesA = (relatedA ?? [])
    .map((r) => r.services as unknown as ProfileService)
    .filter(Boolean);
  const servicesB = (relatedB ?? [])
    .map((r) => r.services as unknown as ProfileService)
    .filter(Boolean);

  // Deduplicate by id
  const seen = new Set<string>();
  const combined: ProfileService[] = [];

  for (const service of [...servicesA, ...servicesB]) {
    if (!seen.has(service.id)) {
      seen.add(service.id);
      combined.push(service);
    }
  }

  return combined.sort((a, b) => a.display_order - b.display_order);
}

/**
 * Gets all related service pairs for a beauty page.
 * Used in settings to display and manage relationships.
 *
 * @param beautyPageId - The beauty page ID
 * @returns Array of related service pairs with full service data
 */
export async function getAllRelatedServicePairs(beautyPageId: string): Promise<
  Array<{
    id: string;
    serviceA: ProfileService;
    serviceB: ProfileService;
  }>
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("related_services")
    .select(
      `
      id,
      service_a:service_a_id (
        id, name, price_cents, duration_minutes, display_order
      ),
      service_b:service_b_id (
        id, name, price_cents, duration_minutes, display_order
      )
    `,
    )
    .eq("beauty_page_id", beautyPageId);

  if (error) {
    console.error("Error fetching related service pairs:", error);
    return [];
  }

  return (data ?? [])
    .filter((pair) => pair.service_a && pair.service_b)
    .map((pair) => ({
      id: pair.id,
      serviceA: pair.service_a as unknown as ProfileService,
      serviceB: pair.service_b as unknown as ProfileService,
    }));
}

/**
 * Checks if two services are already linked as related.
 *
 * @param beautyPageId - The beauty page ID
 * @param serviceAId - First service ID
 * @param serviceBId - Second service ID
 * @returns true if the services are already linked
 */
export async function areServicesLinked(
  beautyPageId: string,
  serviceAId: string,
  serviceBId: string,
): Promise<boolean> {
  const supabase = await createClient();

  // Normalize order (service_a_id < service_b_id)
  const [a, b] = [serviceAId, serviceBId].sort();

  const { count, error } = await supabase
    .from("related_services")
    .select("*", { count: "exact", head: true })
    .eq("beauty_page_id", beautyPageId)
    .eq("service_a_id", a)
    .eq("service_b_id", b);

  if (error) {
    console.error("Error checking service link:", error);
    return false;
  }

  return (count ?? 0) > 0;
}

/**
 * Gets related services for multiple services at once.
 * Optimized for batch fetching during booking flow.
 *
 * @param serviceIds - Array of service IDs
 * @param beautyPageId - The beauty page ID
 * @returns Map of service ID to related services
 */
export async function getRelatedServicesForMultiple(
  serviceIds: string[],
  beautyPageId: string,
): Promise<Map<string, ProfileService[]>> {
  const result = new Map<string, ProfileService[]>();

  if (serviceIds.length === 0) {
    return result;
  }

  const supabase = await createClient();

  // Query all relationships involving these services
  const { data: pairsA } = await supabase
    .from("related_services")
    .select(
      `
      service_a_id,
      services:service_b_id (
        id, name, price_cents, duration_minutes, display_order
      )
    `,
    )
    .eq("beauty_page_id", beautyPageId)
    .in("service_a_id", serviceIds);

  const { data: pairsB } = await supabase
    .from("related_services")
    .select(
      `
      service_b_id,
      services:service_a_id (
        id, name, price_cents, duration_minutes, display_order
      )
    `,
    )
    .eq("beauty_page_id", beautyPageId)
    .in("service_b_id", serviceIds);

  // Initialize result map
  for (const id of serviceIds) {
    result.set(id, []);
  }

  // Add related services from A side
  for (const pair of pairsA ?? []) {
    if (pair.services) {
      const related = result.get(pair.service_a_id) ?? [];
      related.push(pair.services as unknown as ProfileService);
      result.set(pair.service_a_id, related);
    }
  }

  // Add related services from B side
  for (const pair of pairsB ?? []) {
    if (pair.services) {
      const related = result.get(pair.service_b_id) ?? [];
      related.push(pair.services as unknown as ProfileService);
      result.set(pair.service_b_id, related);
    }
  }

  return result;
}
