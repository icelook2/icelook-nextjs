/**
 * Business wizard types.
 */

export type BusinessKind = "individual" | "business";
export type EntityType = "salon" | "organization";

export type SalonWizardStep = "profile" | "address" | "contacts";
export type OrganizationWizardStep = "profile" | "contacts";

/**
 * Salon profile form data.
 */
export interface SalonProfileData {
  name: string;
  slug: string;
  description: string;
}

/**
 * Salon address form data.
 */
export interface SalonAddressData {
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

/**
 * Organization profile form data.
 */
export interface OrganizationProfileData {
  name: string;
  slug: string;
  description: string;
}

/**
 * Contacts form data (shared).
 */
export interface ContactsData {
  instagram: string;
  phone: string;
  telegram: string;
  viber: string;
  whatsapp: string;
}

/**
 * Complete salon wizard data for server action.
 */
export interface SalonWizardData {
  profile: SalonProfileData;
  address: SalonAddressData;
  contacts: ContactsData;
  organization_id?: string;
}

/**
 * Complete organization wizard data for server action.
 */
export interface OrganizationWizardData {
  profile: OrganizationProfileData;
  contacts: ContactsData;
}

/**
 * Default empty contacts.
 */
export const DEFAULT_CONTACTS: ContactsData = {
  instagram: "",
  phone: "",
  telegram: "",
  viber: "",
  whatsapp: "",
};

/**
 * Default salon address.
 */
export const DEFAULT_ADDRESS: SalonAddressData = {
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "UA",
};
