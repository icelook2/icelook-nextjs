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
