import { createClient } from "@/lib/supabase/server";

export type ServiceGroup = {
  id: string;
  beauty_page_id: string;
  name: string;
  description?: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type Service = {
  id: string;
  service_group_id: string;
  name: string;
  description?: string | null;
  price_cents: number;
  duration_minutes: number;
  display_order: number;
  available_from_time: string | null;
  available_to_time: string | null;
  created_at: string;
  updated_at: string;
};

export type ServiceGroupWithServices = ServiceGroup & {
  services: Service[];
};

/**
 * Fetches all service groups with their services for a beauty page
 */
export async function getServiceGroupsWithServices(
  beautyPageId: string,
): Promise<ServiceGroupWithServices[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("service_groups")
    .select("*, services (*)")
    .eq("beauty_page_id", beautyPageId)
    .order("display_order", { ascending: true })
    .order("display_order", { referencedTable: "services", ascending: true });

  if (error) {
    console.error("Error fetching service groups:", error);
    return [];
  }

  return data as ServiceGroupWithServices[];
}

/**
 * Fetches a single service group with its services
 */
export async function getServiceGroupById(
  groupId: string,
): Promise<ServiceGroupWithServices | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("service_groups")
    .select("*, services (*)")
    .eq("id", groupId)
    .order("display_order", { referencedTable: "services", ascending: true })
    .single();

  if (error) {
    console.error("Error fetching service group:", error);
    return null;
  }

  return data as ServiceGroupWithServices;
}

/**
 * Fetches a single service
 */
export async function getServiceById(
  serviceId: string,
): Promise<Service | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("id", serviceId)
    .single();

  if (error) {
    console.error("Error fetching service:", error);
    return null;
  }

  return data as Service;
}

/**
 * Gets the count of services in a service group
 */
export async function getServiceGroupServiceCount(
  serviceGroupId: string,
): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("services")
    .select("*", { count: "exact", head: true })
    .eq("service_group_id", serviceGroupId);

  if (error) {
    console.error("Error counting services:", error);
    return 0;
  }

  return count ?? 0;
}

// ============================================================================
// Rebooking Query
// ============================================================================

/** Data needed to rebook a service */
export type RebookingData = {
  /** Service info for booking */
  service: {
    id: string;
    name: string;
    price_cents: number;
    duration_minutes: number;
    display_order: number;
    available_from_time: string | null;
    available_to_time: string | null;
  };
  /** Beauty page info for booking context */
  beautyPage: {
    id: string;
    slug: string;
    name: string;
    address: string | null;
    avatar_url: string | null;
    timezone: string;
    currency: string;
    locale: string;
  };
  /** Creator info for display */
  creator: {
    display_name: string;
    avatar_url: string | null;
  };
};

/**
 * Fetches all data needed to rebook a service.
 * Used by the "Book Again" feature on the appointments page.
 *
 * @param serviceId - The service ID to rebook
 * @returns RebookingData or null if service not found
 */
export async function getServiceForRebooking(
  serviceId: string,
): Promise<RebookingData | null> {
  const supabase = await createClient();

  // Fetch service with service_group -> beauty_page -> owner (creator)
  const { data, error } = await supabase
    .from("services")
    .select(
      `
      id,
      name,
      price_cents,
      duration_minutes,
      display_order,
      available_from_time,
      available_to_time,
      service_groups!inner (
        beauty_pages!inner (
          id,
          slug,
          name,
          address,
          avatar_url,
          timezone,
          currency,
          profiles!beauty_pages_owner_id_fkey (
            full_name,
            avatar_url
          )
        )
      )
    `,
    )
    .eq("id", serviceId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned - service not found
      return null;
    }
    console.error("Error fetching service for rebooking:", error);
    return null;
  }

  // Extract nested data - Supabase returns arrays for nested relations
  const serviceGroupData = data.service_groups;
  const serviceGroup = Array.isArray(serviceGroupData)
    ? serviceGroupData[0]
    : serviceGroupData;

  const beautyPageData = serviceGroup?.beauty_pages;
  const beautyPage = Array.isArray(beautyPageData)
    ? beautyPageData[0]
    : beautyPageData;

  const creatorData = beautyPage?.profiles;
  const creator = Array.isArray(creatorData) ? creatorData[0] : creatorData;

  if (!beautyPage || !creator) {
    console.error("Missing beauty page or creator data for rebooking");
    return null;
  }

  // Derive locale from currency (UAH -> uk, else default to en)
  const locale = beautyPage.currency === "UAH" ? "uk" : "en";

  return {
    service: {
      id: data.id,
      name: data.name,
      price_cents: data.price_cents,
      duration_minutes: data.duration_minutes,
      display_order: data.display_order,
      available_from_time: data.available_from_time,
      available_to_time: data.available_to_time,
    },
    beautyPage: {
      id: beautyPage.id,
      slug: beautyPage.slug,
      name: beautyPage.name,
      address: beautyPage.address,
      avatar_url: beautyPage.avatar_url,
      timezone: beautyPage.timezone,
      currency: beautyPage.currency,
      locale,
    },
    creator: {
      display_name: creator.full_name ?? beautyPage.name,
      avatar_url: creator.avatar_url ?? beautyPage.avatar_url,
    },
  };
}
