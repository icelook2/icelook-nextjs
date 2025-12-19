import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { BusinessType, OwnerRole } from "./types";

/**
 * Check if a user is an owner/admin of a business.
 * Returns the role if they have access, null otherwise.
 */
export async function getBusinessRole(
  userId: string,
  entityType: "salon" | "organization",
  entityId: string,
): Promise<OwnerRole | null> {
  const supabase = await createClient();

  const column = entityType === "salon" ? "salon_id" : "organization_id";

  const { data, error } = await supabase
    .from("business_owners")
    .select("role")
    .eq("user_id", userId)
    .eq(column, entityId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.role as OwnerRole;
}

/**
 * Check if a user is an owner/admin of a business.
 */
export async function isBusinessOwner(
  userId: string,
  entityType: "salon" | "organization",
  entityId: string,
): Promise<boolean> {
  const role = await getBusinessRole(userId, entityType, entityId);
  return role !== null;
}

/**
 * Check if a user is specifically an "owner" (not just admin) of a business.
 */
export async function isBusinessPrimaryOwner(
  userId: string,
  entityType: "salon" | "organization",
  entityId: string,
): Promise<boolean> {
  const role = await getBusinessRole(userId, entityType, entityId);
  return role === "owner";
}

/**
 * Require that a user is an owner/admin of a business.
 * Calls notFound() if they don't have access (hides existence).
 */
export async function requireBusinessOwnership(
  userId: string,
  entityType: "salon" | "organization",
  entityId: string,
): Promise<OwnerRole> {
  const role = await getBusinessRole(userId, entityType, entityId);

  if (!role) {
    notFound();
  }

  return role;
}

/**
 * Require that a user is specifically the owner (not just admin).
 * Calls notFound() if they're not the owner.
 */
export async function requirePrimaryOwnership(
  userId: string,
  entityType: "salon" | "organization",
  entityId: string,
): Promise<void> {
  const role = await getBusinessRole(userId, entityType, entityId);

  if (role !== "owner") {
    notFound();
  }
}

/**
 * Check if a user can invite specialists to a salon.
 * Must be an owner or admin of the salon.
 */
export async function canInviteSpecialist(
  userId: string,
  salonId: string,
): Promise<boolean> {
  return isBusinessOwner(userId, "salon", salonId);
}

/**
 * Check if a user can accept an invitation.
 * Must own the specialist profile that was invited.
 */
export async function canAcceptInvitation(
  userId: string,
  specialistId: string,
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("specialists")
    .select("id")
    .eq("id", specialistId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

/**
 * Check if a user can manage an organization's salons.
 * Must be an owner or admin of the organization.
 */
export async function canManageOrganizationSalons(
  userId: string,
  organizationId: string,
): Promise<boolean> {
  return isBusinessOwner(userId, "organization", organizationId);
}

/**
 * Check if a user can add admins to a business.
 * Must be the primary owner.
 */
export async function canManageAdmins(
  userId: string,
  entityType: "salon" | "organization",
  entityId: string,
): Promise<boolean> {
  return isBusinessPrimaryOwner(userId, entityType, entityId);
}
