/**
 * Utilities for parsing appointment metadata stored in client_notes.
 *
 * When bookings are created, service/bundle/promotion details are stored
 * as JSON in the client_notes field for future reference.
 */

// ============================================================================
// Types
// ============================================================================

/** Service info as stored in appointment metadata */
export interface AppointmentServiceMeta {
  id: string;
  name: string;
  original_price_cents: number;
  final_price_cents: number;
  duration_minutes: number;
  promotion: {
    id: string;
    type: string;
    discount_percentage: number;
  } | null;
}

/** Bundle info as stored in appointment metadata */
export interface AppointmentBundleMeta {
  id: string;
  name: string;
  discounted_price_cents: number;
}

/** Full appointment metadata structure */
export interface AppointmentMetadata {
  service_ids: string[];
  services: AppointmentServiceMeta[];
  total_original_price_cents: number;
  total_final_price_cents: number;
  has_promotions: boolean;
  bundle: AppointmentBundleMeta | null;
}

// ============================================================================
// Parsing Functions
// ============================================================================

/**
 * Parse appointment metadata from client_notes field.
 *
 * The client_notes field can contain:
 * 1. Just JSON metadata
 * 2. User notes + separator + JSON: "user notes\n\n---\n{json}"
 *
 * @param clientNotes - The client_notes field from an appointment
 * @returns Parsed metadata or null if not found/invalid
 */
export function parseAppointmentMetadata(
  clientNotes: string | null | undefined,
): AppointmentMetadata | null {
  if (!clientNotes) {
    return null;
  }

  try {
    // Check if notes contain separator (user notes + metadata)
    const separatorIndex = clientNotes.indexOf("\n\n---\n");

    const jsonStr =
      separatorIndex !== -1
        ? clientNotes.slice(separatorIndex + 6) // Skip "\n\n---\n"
        : clientNotes;

    // Try to parse as JSON
    const parsed = JSON.parse(jsonStr);

    // Validate required fields exist
    if (
      !Array.isArray(parsed.service_ids) ||
      !Array.isArray(parsed.services) ||
      typeof parsed.total_original_price_cents !== "number" ||
      typeof parsed.total_final_price_cents !== "number"
    ) {
      return null;
    }

    return parsed as AppointmentMetadata;
  } catch {
    // Not valid JSON or doesn't contain metadata
    return null;
  }
}

/**
 * Extract user notes from client_notes field (excludes metadata JSON).
 *
 * @param clientNotes - The client_notes field from an appointment
 * @returns User notes string or null if none
 */
export function extractUserNotes(
  clientNotes: string | null | undefined,
): string | null {
  if (!clientNotes) {
    return null;
  }

  const separatorIndex = clientNotes.indexOf("\n\n---\n");

  if (separatorIndex !== -1) {
    const notes = clientNotes.slice(0, separatorIndex).trim();
    return notes || null;
  }

  // If the whole thing is JSON, there are no user notes
  try {
    JSON.parse(clientNotes);
    return null;
  } catch {
    // Not JSON, so it's just plain user notes
    return clientNotes;
  }
}

/**
 * Calculate discount percentage from original and final prices.
 *
 * @param originalCents - Original price in cents
 * @param finalCents - Final price in cents (after discount)
 * @returns Discount percentage (0-100)
 */
export function calculateDiscountPercentage(
  originalCents: number,
  finalCents: number,
): number {
  if (originalCents <= 0) {
    return 0;
  }

  const discount = ((originalCents - finalCents) / originalCents) * 100;
  return Math.round(discount);
}

/**
 * Check if appointment has a bundle.
 *
 * @param metadata - Parsed appointment metadata
 * @returns True if appointment was booked as a bundle
 */
export function hasBundle(metadata: AppointmentMetadata | null): boolean {
  return metadata?.bundle !== null;
}

/**
 * Check if appointment has any promotions.
 *
 * @param metadata - Parsed appointment metadata
 * @returns True if any services had promotions applied
 */
export function hasPromotions(metadata: AppointmentMetadata | null): boolean {
  return metadata?.has_promotions ?? false;
}
