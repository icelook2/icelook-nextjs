/**
 * Query functions for resources (consumables/inventory tracking).
 *
 * Resources are consumable items used during services.
 * They can be:
 * - Linked to services with default usage amounts
 * - Automatically deducted on appointment completion
 * - Monitored with low stock alerts
 */

import { createClient } from "@/lib/supabase/server";
import type {
  Resource,
  ResourceWithStatus,
  ServiceResourceWithDetails,
  ResourceUsageWithDetails,
  ResourceForSelection,
} from "@/lib/types/resources";
import {
  checkStockStatus,
  calculateTotalValue,
  calculateAmountCost,
} from "@/lib/types/resources";

// ============================================================================
// Internal Helpers
// ============================================================================

type RawServiceResource = {
  id: string;
  service_id: string;
  resource_id: string;
  default_amount: number;
  resources: {
    id: string;
    name: string;
    unit: string;
    current_stock: number;
    cost_per_unit_cents: number;
    is_active: boolean;
  } | null;
};

type RawResourceUsage = {
  id: string;
  appointment_id: string;
  resource_id: string;
  amount_used: number;
  unit_cost_cents: number;
  auto_deducted: boolean;
  created_at: string;
  resources: {
    name: string;
    unit: string;
  } | null;
};

/**
 * Transforms raw database resource data into ResourceWithStatus
 */
function transformResource(raw: Resource): ResourceWithStatus {
  return {
    ...raw,
    stockStatus: checkStockStatus(raw),
    totalValueCents: calculateTotalValue(raw),
  };
}

/**
 * Transforms raw service-resource join data
 */
function transformServiceResource(
  raw: RawServiceResource,
): ServiceResourceWithDetails | null {
  if (!raw.resources) {
    return null;
  }

  return {
    id: raw.id,
    serviceId: raw.service_id,
    resourceId: raw.resource_id,
    defaultAmount: raw.default_amount,
    resource: {
      id: raw.resources.id,
      name: raw.resources.name,
      unit: raw.resources.unit,
      currentStock: raw.resources.current_stock,
      costPerUnitCents: raw.resources.cost_per_unit_cents,
      isActive: raw.resources.is_active,
    },
    defaultCostCents: calculateAmountCost(
      raw.default_amount,
      raw.resources.cost_per_unit_cents,
    ),
  };
}

/**
 * Transforms raw resource usage data
 */
function transformResourceUsage(
  raw: RawResourceUsage,
): ResourceUsageWithDetails | null {
  if (!raw.resources) {
    return null;
  }

  return {
    id: raw.id,
    appointment_id: raw.appointment_id,
    resource_id: raw.resource_id,
    amount_used: raw.amount_used,
    unit_cost_cents: raw.unit_cost_cents,
    auto_deducted: raw.auto_deducted,
    created_at: raw.created_at,
    resourceName: raw.resources.name,
    resourceUnit: raw.resources.unit,
    totalCostCents: Math.round(raw.amount_used * raw.unit_cost_cents),
  };
}

// ============================================================================
// Public Queries
// ============================================================================

/**
 * Fetches all resources for a beauty page (settings view).
 * Used by beauty page owner to manage resources.
 *
 * @param beautyPageId - The beauty page ID
 * @returns Array of all resources with computed status
 */
export async function getAllResources(
  beautyPageId: string,
): Promise<ResourceWithStatus[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("beauty_page_id", beautyPageId)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching resources:", error);
    return [];
  }

  return (data as Resource[]).map(transformResource);
}

/**
 * Fetches active resources for selection (when linking to services).
 *
 * @param beautyPageId - The beauty page ID
 * @returns Array of active resources for selection UI
 */
export async function getActiveResources(
  beautyPageId: string,
): Promise<ResourceForSelection[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("resources")
    .select("id, name, unit, current_stock, cost_per_unit_cents, is_active")
    .eq("beauty_page_id", beautyPageId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching active resources:", error);
    return [];
  }

  return data.map((r) => ({
    id: r.id,
    name: r.name,
    unit: r.unit,
    currentStock: r.current_stock,
    costPerUnitCents: r.cost_per_unit_cents,
    isActive: r.is_active,
  }));
}

/**
 * Fetches a single resource by ID.
 *
 * @param resourceId - The resource ID
 * @returns Resource with status or null if not found
 */
export async function getResourceById(
  resourceId: string,
): Promise<ResourceWithStatus | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("id", resourceId)
    .single();

  if (error) {
    console.error("Error fetching resource:", error);
    return null;
  }

  return transformResource(data as Resource);
}

/**
 * Fetches all resources linked to a specific service.
 * Used in service details page to show linked resources.
 *
 * @param serviceId - The service ID
 * @returns Array of linked resources with details
 */
export async function getResourcesForService(
  serviceId: string,
): Promise<ServiceResourceWithDetails[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("service_resources")
    .select(
      `
      id,
      service_id,
      resource_id,
      default_amount,
      resources (
        id,
        name,
        unit,
        current_stock,
        cost_per_unit_cents,
        is_active
      )
    `,
    )
    .eq("service_id", serviceId);

  if (error) {
    console.error("Error fetching service resources:", error);
    return [];
  }

  return (data as unknown as RawServiceResource[])
    .map(transformServiceResource)
    .filter((sr): sr is ServiceResourceWithDetails => sr !== null);
}

/**
 * Fetches all services linked to a specific resource.
 * Used in resource details to show which services use this resource.
 *
 * @param resourceId - The resource ID
 * @returns Array of service IDs that use this resource
 */
export async function getServicesForResource(
  resourceId: string,
): Promise<{ serviceId: string; defaultAmount: number }[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("service_resources")
    .select("service_id, default_amount")
    .eq("resource_id", resourceId);

  if (error) {
    console.error("Error fetching services for resource:", error);
    return [];
  }

  return data.map((r) => ({
    serviceId: r.service_id,
    defaultAmount: r.default_amount,
  }));
}

/**
 * Fetches resources with low stock for alerts.
 * Returns only active resources that are below threshold or out of stock.
 *
 * @param beautyPageId - The beauty page ID
 * @returns Array of low stock resources
 */
export async function getLowStockResources(
  beautyPageId: string,
): Promise<ResourceWithStatus[]> {
  const supabase = await createClient();

  // Get all active resources and filter in application code
  // (threshold comparison is easier to handle in JS)
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("beauty_page_id", beautyPageId)
    .eq("is_active", true);

  if (error) {
    console.error("Error fetching resources for low stock check:", error);
    return [];
  }

  return (data as Resource[])
    .map(transformResource)
    .filter((r) => r.stockStatus.isLow);
}

/**
 * Fetches resource usage history for an appointment.
 *
 * @param appointmentId - The appointment ID
 * @returns Array of resource usage records
 */
export async function getResourceUsageForAppointment(
  appointmentId: string,
): Promise<ResourceUsageWithDetails[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("resource_usage")
    .select(
      `
      id,
      appointment_id,
      resource_id,
      amount_used,
      unit_cost_cents,
      auto_deducted,
      created_at,
      resources (
        name,
        unit
      )
    `,
    )
    .eq("appointment_id", appointmentId);

  if (error) {
    console.error("Error fetching resource usage:", error);
    return [];
  }

  return (data as unknown as RawResourceUsage[])
    .map(transformResourceUsage)
    .filter((ru): ru is ResourceUsageWithDetails => ru !== null);
}

/**
 * Checks if a resource with the given name already exists for a beauty page.
 * Used to prevent duplicate resource names.
 *
 * @param beautyPageId - The beauty page ID
 * @param name - The resource name to check
 * @param excludeResourceId - Optional resource ID to exclude (for updates)
 * @returns true if a resource with this name exists
 */
export async function checkResourceNameExists(
  beautyPageId: string,
  name: string,
  excludeResourceId?: string,
): Promise<boolean> {
  const supabase = await createClient();

  let query = supabase
    .from("resources")
    .select("id", { count: "exact", head: true })
    .eq("beauty_page_id", beautyPageId)
    .ilike("name", name);

  if (excludeResourceId) {
    query = query.neq("id", excludeResourceId);
  }

  const { count, error } = await query;

  if (error) {
    console.error("Error checking resource name:", error);
    return false;
  }

  return (count ?? 0) > 0;
}

/**
 * Gets the count of resources for a beauty page.
 * Used for conditional UI display (show/hide resources section).
 *
 * @param beautyPageId - The beauty page ID
 * @returns Number of resources
 */
export async function getResourceCount(beautyPageId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("resources")
    .select("*", { count: "exact", head: true })
    .eq("beauty_page_id", beautyPageId);

  if (error) {
    console.error("Error counting resources:", error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Gets the next display order for a new resource.
 *
 * @param beautyPageId - The beauty page ID
 * @returns Next display order value
 */
export async function getNextResourceDisplayOrder(
  beautyPageId: string,
): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("resources")
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
 * Fetches resources linked to multiple services at once.
 * Used during appointment completion to get all resources to deduct.
 *
 * @param serviceIds - Array of service IDs
 * @returns Map of resource ID to total amount needed
 */
export async function getResourcesForServices(
  serviceIds: string[],
): Promise<
  Map<
    string,
    { resourceId: string; totalAmount: number; costPerUnitCents: number }
  >
> {
  if (serviceIds.length === 0) {
    return new Map();
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("service_resources")
    .select(
      `
      resource_id,
      default_amount,
      resources (
        id,
        cost_per_unit_cents
      )
    `,
    )
    .in("service_id", serviceIds);

  if (error) {
    console.error("Error fetching resources for services:", error);
    return new Map();
  }

  // Aggregate by resource ID (in case multiple services use same resource)
  const resourceMap = new Map<
    string,
    { resourceId: string; totalAmount: number; costPerUnitCents: number }
  >();

  for (const item of data) {
    const resource = item.resources as unknown as {
      id: string;
      cost_per_unit_cents: number;
    } | null;

    if (!resource) {
      continue;
    }

    const existing = resourceMap.get(item.resource_id);
    if (existing) {
      existing.totalAmount += item.default_amount;
    } else {
      resourceMap.set(item.resource_id, {
        resourceId: item.resource_id,
        totalAmount: item.default_amount,
        costPerUnitCents: resource.cost_per_unit_cents,
      });
    }
  }

  return resourceMap;
}
