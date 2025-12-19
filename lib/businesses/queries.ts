import { createClient } from "@/lib/supabase/server";
import type {
  BusinessType,
  Organization,
  Salon,
  SalonWithOrganization,
  BusinessOwner,
  SalonSpecialist,
  BusinessContact,
  UserBusiness,
} from "./types";

/**
 * Get all businesses owned/administered by a user.
 * Uses the database function get_user_businesses for efficiency.
 */
export async function getUserBusinesses(
  userId: string,
): Promise<UserBusiness[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_user_businesses", {
    p_user_id: userId,
  });

  if (error) {
    console.error("Failed to fetch user businesses:", error);
    return [];
  }

  return data ?? [];
}

/**
 * Get an organization by its slug.
 */
export async function getOrganizationBySlug(
  slug: string,
): Promise<Organization | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Get a salon by its slug.
 */
export async function getSalonBySlug(slug: string): Promise<Salon | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("salons")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Get a salon by its slug with organization data.
 */
export async function getSalonWithOrganization(
  slug: string,
): Promise<SalonWithOrganization | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("salons")
    .select(
      `
      *,
      organization:organizations(*)
    `,
    )
    .eq("slug", slug)
    .single();

  if (error) {
    return null;
  }

  return data as SalonWithOrganization;
}

/**
 * Get all salons belonging to an organization.
 */
export async function getOrganizationSalons(
  organizationId: string,
): Promise<Salon[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("salons")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("Failed to fetch organization salons:", error);
    return [];
  }

  return data ?? [];
}

/**
 * Get business contacts for a specific entity.
 */
export async function getBusinessContacts(
  entityType: BusinessType,
  entityId: string,
): Promise<BusinessContact | null> {
  const supabase = await createClient();

  const column =
    entityType === "specialist"
      ? "specialist_id"
      : entityType === "salon"
        ? "salon_id"
        : "organization_id";

  const { data, error } = await supabase
    .from("business_contacts")
    .select("*")
    .eq(column, entityId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Get all specialists in a salon (accepted invitations only).
 */
export async function getSalonSpecialists(
  salonId: string,
): Promise<SalonSpecialist[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("salon_specialists")
    .select("*")
    .eq("salon_id", salonId)
    .not("accepted_at", "is", null)
    .order("display_order");

  if (error) {
    console.error("Failed to fetch salon specialists:", error);
    return [];
  }

  return data ?? [];
}

/**
 * Get pending invitations for a specialist.
 */
export async function getSpecialistInvitations(
  specialistId: string,
): Promise<SalonSpecialist[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("salon_specialists")
    .select("*")
    .eq("specialist_id", specialistId)
    .is("accepted_at", null)
    .order("invited_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch specialist invitations:", error);
    return [];
  }

  return data ?? [];
}

/**
 * Get owners/admins of an organization.
 */
export async function getOrganizationOwners(
  organizationId: string,
): Promise<BusinessOwner[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("business_owners")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at");

  if (error) {
    console.error("Failed to fetch organization owners:", error);
    return [];
  }

  return data ?? [];
}

/**
 * Get owners/admins of a salon.
 */
export async function getSalonOwners(salonId: string): Promise<BusinessOwner[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("business_owners")
    .select("*")
    .eq("salon_id", salonId)
    .order("created_at");

  if (error) {
    console.error("Failed to fetch salon owners:", error);
    return [];
  }

  return data ?? [];
}

/**
 * Check if a slug is available for a specific entity type.
 */
export async function isSlugAvailable(
  slug: string,
  entityType: "salon" | "organization",
): Promise<boolean> {
  const supabase = await createClient();

  const table = entityType === "salon" ? "salons" : "organizations";

  const { data, error } = await supabase
    .from(table)
    .select("id")
    .eq("slug", slug)
    .single();

  // If error is "no rows", slug is available
  if (error) {
    return true;
  }

  return data === null;
}

/**
 * Check if a slug is available, excluding a specific entity (for updates).
 */
export async function isSlugAvailableExcluding(
  slug: string,
  entityType: "salon" | "organization",
  excludeId: string,
): Promise<boolean> {
  const supabase = await createClient();

  const table = entityType === "salon" ? "salons" : "organizations";

  const { data, error } = await supabase
    .from(table)
    .select("id")
    .eq("slug", slug)
    .neq("id", excludeId)
    .single();

  if (error) {
    return true;
  }

  return data === null;
}
