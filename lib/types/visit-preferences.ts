/**
 * Visit Preferences Types
 *
 * Client preferences for beauty service visits, including communication style,
 * accessibility needs, and allergies/sensitivities.
 *
 * Used in:
 * - profiles.visit_preferences (JSONB) - user defaults
 * - appointments.visit_preferences (JSONB) - per-booking snapshot
 */

/** Communication preference during visit */
export type CommunicationPreference = "quiet" | "friendly" | "chatty";

/** Accessibility need options */
export type AccessibilityNeed =
  | "wheelchair"
  | "hearing_impaired"
  | "vision_impaired"
  | "sensory_sensitivity";

/** Visit preferences structure - used in both profile and appointments */
export interface VisitPreferences {
  /** Communication style preference */
  communication?: CommunicationPreference;
  /** Accessibility needs (multi-select) */
  accessibility?: AccessibilityNeed[];
  /** Free-text allergies/sensitivities (max 500 chars) */
  allergies?: string;
}

/** All possible communication preference values */
export const COMMUNICATION_OPTIONS: CommunicationPreference[] = [
  "quiet",
  "friendly",
  "chatty",
];

/** All possible accessibility need values */
export const ACCESSIBILITY_OPTIONS: AccessibilityNeed[] = [
  "wheelchair",
  "hearing_impaired",
  "vision_impaired",
  "sensory_sensitivity",
];

/** Helper to check if preferences are empty (all fields undefined/empty) */
export function isEmptyPreferences(prefs?: VisitPreferences | null): boolean {
  if (!prefs) return true;
  return (
    !prefs.communication &&
    (!prefs.accessibility || prefs.accessibility.length === 0) &&
    !prefs.allergies
  );
}
