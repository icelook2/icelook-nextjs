/**
 * Generate a URL-friendly slug from a name.
 * Converts to lowercase, removes special characters, replaces spaces with hyphens.
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Spaces to hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
    .slice(0, 50); // Max length
}

/**
 * Validate a slug format.
 * Must be lowercase alphanumeric with hyphens/underscores, 3-50 chars.
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9_-]{3,50}$/.test(slug);
}

/**
 * Format an address for display.
 */
export function formatAddress(address: {
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state?: string | null;
  postal_code?: string | null;
  country: string;
}): string {
  const parts = [
    address.address_line1,
    address.address_line2,
    address.city,
    address.state,
    address.postal_code,
  ].filter(Boolean);

  return parts.join(", ");
}

/**
 * Format a short address (just street and city).
 */
export function formatShortAddress(address: {
  address_line1: string;
  city: string;
}): string {
  return `${address.address_line1}, ${address.city}`;
}

/**
 * Check if any contact field has a value.
 */
export function hasAnyContact(contacts: {
  instagram?: string | null;
  phone?: string | null;
  telegram?: string | null;
  viber?: string | null;
  whatsapp?: string | null;
}): boolean {
  return Boolean(
    contacts.instagram ||
      contacts.phone ||
      contacts.telegram ||
      contacts.viber ||
      contacts.whatsapp,
  );
}

/**
 * Get the display URL for a business entity.
 */
export function getBusinessUrl(
  entityType: "salon" | "organization",
  slug: string,
): string {
  return entityType === "salon" ? `/salon/${slug}` : `/org/${slug}`;
}

/**
 * Get the settings URL for a business entity.
 */
export function getBusinessSettingsUrl(
  entityType: "salon" | "organization",
  slug: string,
): string {
  return `${getBusinessUrl(entityType, slug)}/settings`;
}
