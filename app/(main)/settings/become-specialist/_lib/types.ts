/**
 * Specialist profile types for the creation wizard.
 */

export const SPECIALTIES = [
  "barber",
  "hair_stylist",
  "colorist",
  "nail_tech",
  "makeup_artist",
  "lash_tech",
  "brow_artist",
] as const;

export type Specialty = (typeof SPECIALTIES)[number];

export const CURRENCIES = ["UAH", "USD", "EUR"] as const;

export type Currency = (typeof CURRENCIES)[number];

export const CONTACT_TYPES = [
  "instagram",
  "phone",
  "telegram",
  "viber",
  "whatsapp",
] as const;

export type ContactType = (typeof CONTACT_TYPES)[number];

/**
 * Profile step data
 */
export interface ProfileData {
  displayName: string;
  bio: string;
  specialty: Specialty;
  username: string;
}

/**
 * Single service
 */
export interface ServiceData {
  id: string; // Client-side temporary ID
  name: string;
  price: number;
  currency: Currency;
  durationMinutes: number;
}

/**
 * Contacts data
 */
export interface ContactsData {
  instagram: string;
  phone: string;
  telegram: string;
  viber: string;
  whatsapp: string;
}

/**
 * Complete wizard data passed to server action
 */
export interface SpecialistWizardData {
  profile: ProfileData;
  services: ServiceData[];
  contacts: ContactsData;
}

/**
 * Wizard step type
 */
export type WizardStep = "profile" | "services" | "contacts";

/**
 * Duration options in minutes
 */
export const DURATION_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
  { value: 180, label: "3 hours" },
  { value: 240, label: "4 hours" },
] as const;
