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
  duration_minutes: number;
  display_order: number;
  created_at: string;
  updated_at: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type BeautyPageMember = {
  id: string;
  beauty_page_id: string;
  user_id: string;
  roles: ("admin" | "specialist")[];
  created_at: string;
  updated_at: string;
};

export type SpecialistServiceAssignment = {
  id: string;
  member_id: string;
  service_id: string;
  price_cents: number;
  duration_minutes: number;
  currency?: string;
  created_at: string;
  updated_at: string;
};

export type ServiceWithAssignments = Service & {
  specialist_service_assignments: Array<
    SpecialistServiceAssignment & {
      beauty_page_members: BeautyPageMember & {
        profiles: Pick<ProfileRow, "id" | "full_name" | "avatar_url">;
      };
    }
  >;
};

export type ServiceGroupWithServices = ServiceGroup & {
  services: ServiceWithAssignments[];
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
    .select(
      `
 *,
 services (
 *,
 specialist_service_assignments (
 *,
 beauty_page_members (
 *,
 profiles (id, full_name, avatar_url)
 )
 )
 )
 `,
    )
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
 * Fetches all specialists (members) for a beauty page
 */
export async function getBeautyPageSpecialists(beautyPageId: string): Promise<
  Array<
    BeautyPageMember & {
      profiles: Pick<ProfileRow, "id" | "full_name" | "avatar_url">;
    }
  >
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("beauty_page_members")
    .select("*, profiles (id, full_name, avatar_url)")
    .eq("beauty_page_id", beautyPageId)
    .contains("roles", ["specialist"]);

  if (error) {
    console.error("Error fetching specialists:", error);
    return [];
  }

  return data as Array<
    BeautyPageMember & {
      profiles: Pick<ProfileRow, "id" | "full_name" | "avatar_url">;
    }
  >;
}

/**
 * Gets the count of specialist assignments for a service
 */
export async function getServiceAssignmentCount(
  serviceId: string,
): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("specialist_service_assignments")
    .select("*", { count: "exact", head: true })
    .eq("service_id", serviceId);

  if (error) {
    console.error("Error counting assignments:", error);
    return 0;
  }

  return count ?? 0;
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

/**
 * Gets the count of specialist assignments for all services in a service group
 */
export async function getServiceGroupAssignmentCount(
  serviceGroupId: string,
): Promise<number> {
  const supabase = await createClient();

  const { data: services, error: servicesError } = await supabase
    .from("services")
    .select("id")
    .eq("service_group_id", serviceGroupId);

  if (servicesError || !services.length) {
    return 0;
  }

  const serviceIds = services.map((s) => s.id);

  const { count, error } = await supabase
    .from("specialist_service_assignments")
    .select("*", { count: "exact", head: true })
    .in("service_id", serviceIds);

  if (error) {
    console.error("Error counting group assignments:", error);
    return 0;
  }

  return count ?? 0;
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
    .select(
      `
 *,
 services (
 *,
 specialist_service_assignments (
 *,
 beauty_page_members (
 *,
 profiles (id, full_name, avatar_url)
 )
 )
 )
 `,
    )
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
 * Fetches a single service with its assignments
 */
export async function getServiceById(
  serviceId: string,
): Promise<ServiceWithAssignments | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("services")
    .select(
      `
 *,
 specialist_service_assignments (
 *,
 beauty_page_members (
 *,
 profiles (id, full_name, avatar_url)
 )
 )
 `,
    )
    .eq("id", serviceId)
    .single();

  if (error) {
    console.error("Error fetching service:", error);
    return null;
  }

  return data as ServiceWithAssignments;
}

/**
 * Fetches a single specialist service assignment with specialist details
 */
export async function getSpecialistAssignmentById(
  assignmentId: string,
): Promise<
  | (SpecialistServiceAssignment & {
      beauty_page_members: {
        id: string;
        beauty_page_id: string;
        user_id: string;
        roles: ("admin" | "specialist")[];
        created_at: string;
        updated_at: string;
        profiles: Pick<ProfileRow, "id" | "full_name" | "avatar_url">;
      };
    })
  | null
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("specialist_service_assignments")
    .select(
      `
 *,
 beauty_page_members (
 *,
 profiles (id, full_name, avatar_url)
 )
 `,
    )
    .eq("id", assignmentId)
    .single();

  if (error) {
    console.error("Error fetching assignment:", error);
    return null;
  }

  return data as SpecialistServiceAssignment & {
    beauty_page_members: {
      id: string;
      beauty_page_id: string;
      user_id: string;
      roles: ("admin" | "specialist")[];
      created_at: string;
      updated_at: string;
      profiles: Pick<ProfileRow, "id" | "full_name" | "avatar_url">;
    };
  };
}
