/**
 * Business domain module.
 *
 * Provides types, queries, permissions, and utilities for
 * organizations, salons, and business ownership.
 */

// Types
export type {
  BusinessType,
  OwnerRole,
  Organization,
  Salon,
  SalonWithOrganization,
  BusinessOwner,
  SalonSpecialist,
  BusinessContact,
  UserBusiness,
  ContactsData,
  SalonProfileData,
  OrganizationProfileData,
  CreateSalonData,
  CreateOrganizationData,
} from "./types";

// Queries
export {
  getUserBusinesses,
  getOrganizationBySlug,
  getSalonBySlug,
  getSalonWithOrganization,
  getOrganizationSalons,
  getBusinessContacts,
  getSalonSpecialists,
  getSpecialistInvitations,
  getOrganizationOwners,
  getSalonOwners,
  isSlugAvailable,
  isSlugAvailableExcluding,
} from "./queries";

// Permissions
export {
  getBusinessRole,
  isBusinessOwner,
  isBusinessPrimaryOwner,
  requireBusinessOwnership,
  requirePrimaryOwnership,
  canInviteSpecialist,
  canAcceptInvitation,
  canManageOrganizationSalons,
  canManageAdmins,
} from "./permissions";

// Utilities
export {
  generateSlug,
  isValidSlug,
  formatAddress,
  formatShortAddress,
  hasAnyContact,
  getBusinessUrl,
  getBusinessSettingsUrl,
} from "./utils";

// Schemas
export {
  slugSchema,
  businessNameSchema,
  businessDescriptionSchema,
  addressLineSchema,
  citySchema,
  countrySchema,
  contactFieldSchema,
  contactsSchema,
  salonProfileSchema,
  organizationProfileSchema,
  createSalonSchema,
  createOrganizationSchema,
  createTranslatedSlugSchema,
  createTranslatedBusinessNameSchema,
  createTranslatedDescriptionSchema,
  createTranslatedAddressSchema,
  createTranslatedCitySchema,
  createTranslatedContactFieldSchema,
  createTranslatedContactsSchema,
  createTranslatedSalonProfileSchema,
  createTranslatedOrganizationProfileSchema,
} from "./schemas";
