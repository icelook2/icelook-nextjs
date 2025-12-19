/**
 * Business domain types for organizations, salons, and ownership.
 */

export type BusinessType = "specialist" | "salon" | "organization";

export type OwnerRole = "owner" | "admin";

/**
 * Organization entity - large businesses with multiple salons.
 */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Salon entity - physical locations (can be independent or under organization).
 */
export interface Salon {
  id: string;
  organization_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string | null;
  postal_code: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Salon with organization data included.
 */
export interface SalonWithOrganization extends Salon {
  organization: Organization | null;
}

/**
 * Business ownership record (polymorphic: org OR salon).
 */
export interface BusinessOwner {
  id: string;
  user_id: string;
  organization_id: string | null;
  salon_id: string | null;
  role: OwnerRole;
  created_at: string;
}

/**
 * Specialist-salon membership record.
 */
export interface SalonSpecialist {
  id: string;
  salon_id: string;
  specialist_id: string;
  invited_by: string | null;
  invited_at: string;
  accepted_at: string | null;
  display_order: number;
  created_at: string;
}

/**
 * Business contact record (polymorphic: specialist, salon, or org).
 */
export interface BusinessContact {
  id: string;
  specialist_id: string | null;
  salon_id: string | null;
  organization_id: string | null;
  instagram: string | null;
  phone: string | null;
  telegram: string | null;
  viber: string | null;
  whatsapp: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * User's business summary (returned from get_user_businesses function).
 */
export interface UserBusiness {
  entity_type: BusinessType;
  entity_id: string;
  entity_name: string;
  entity_slug: string;
  role: OwnerRole | "owner"; // specialists always return "owner"
}

/**
 * Contact data for forms (all fields optional strings).
 */
export interface ContactsData {
  instagram: string;
  phone: string;
  telegram: string;
  viber: string;
  whatsapp: string;
}

/**
 * Salon profile data for creation/editing.
 */
export interface SalonProfileData {
  name: string;
  slug: string;
  description: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

/**
 * Organization profile data for creation/editing.
 */
export interface OrganizationProfileData {
  name: string;
  slug: string;
  description: string;
}

/**
 * Complete salon creation data (profile + contacts).
 */
export interface CreateSalonData {
  profile: SalonProfileData;
  contacts: ContactsData;
  organization_id?: string; // Optional: create under existing org
}

/**
 * Complete organization creation data (profile + contacts).
 */
export interface CreateOrganizationData {
  profile: OrganizationProfileData;
  contacts: ContactsData;
}
