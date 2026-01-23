/**
 * Types for legal policies - Privacy Policy and Terms of Service.
 *
 * Policy System:
 * - Each policy type (privacy, terms) can have multiple versions
 * - Only one version is "current" at any time
 * - User consent is tracked per version for audit compliance
 * - Translations are stored per version per locale
 */

// ============================================================================
// Enums
// ============================================================================

/** Type of legal policy */
export type PolicyType = "privacy" | "terms";

/** Supported locales for policy translations */
export type PolicyLocale = "en" | "uk";

/** Status of a policy notification */
export type NotificationStatus = "pending" | "sent" | "failed";

// ============================================================================
// Database Types
// ============================================================================

/** Policy version metadata as stored in the database */
export type PolicyVersion = {
  id: string;
  policy_type: PolicyType;
  version: string;
  effective_date: string;
  summary_of_changes: string | null;
  is_current: boolean;
  created_at: string;
};

/** Policy translation content as stored in the database */
export type PolicyTranslation = {
  id: string;
  policy_version_id: string;
  locale: PolicyLocale;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

/** User consent record as stored in the database */
export type UserPolicyConsent = {
  id: string;
  user_id: string;
  policy_version_id: string;
  consented_at: string;
  ip_address: string | null;
  user_agent: string | null;
};

/** Policy notification queue item */
export type PolicyNotification = {
  id: string;
  policy_version_id: string;
  user_id: string;
  status: NotificationStatus;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
};

// ============================================================================
// Application Types
// ============================================================================

/** Policy with its translation for display */
export type PolicyWithTranslation = {
  id: string;
  policy_type: PolicyType;
  version: string;
  effective_date: string;
  summary_of_changes: string | null;
  is_current: boolean;
  title: string;
  content: string;
  locale: PolicyLocale;
};

/** Policy metadata for listing (without full content) */
export type PolicySummary = {
  id: string;
  policy_type: PolicyType;
  version: string;
  effective_date: string;
  summary_of_changes: string | null;
  is_current: boolean;
  title: string;
};

/** User's consent status for a policy type */
export type UserConsentStatus = {
  policy_type: PolicyType;
  has_consented: boolean;
  consented_version: string | null;
  consented_at: string | null;
  current_version: string;
  needs_reconsent: boolean;
};

// ============================================================================
// Input Types
// ============================================================================

/** Input for recording user consent */
export type RecordConsentInput = {
  policy_version_id: string;
  ip_address?: string;
  user_agent?: string;
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Formats the effective date for display.
 *
 * @param effectiveDate - ISO date string
 * @param locale - Display locale
 * @returns Formatted date string
 */
export function formatEffectiveDate(
  effectiveDate: string,
  locale: PolicyLocale,
): string {
  const date = new Date(effectiveDate);
  return date.toLocaleDateString(locale === "uk" ? "uk-UA" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Checks if a policy version is currently effective.
 *
 * @param effectiveDate - ISO date string
 * @returns true if the policy is effective (date has passed)
 */
export function isPolicyEffective(effectiveDate: string): boolean {
  const effective = new Date(effectiveDate);
  const now = new Date();
  return effective <= now;
}

/**
 * Returns the policy type display name.
 *
 * @param policyType - Type of policy
 * @param locale - Display locale
 * @returns Localized policy type name
 */
export function getPolicyTypeName(
  policyType: PolicyType,
  locale: PolicyLocale,
): string {
  const names: Record<PolicyType, Record<PolicyLocale, string>> = {
    privacy: {
      en: "Privacy Policy",
      uk: "Політика конфіденційності",
    },
    terms: {
      en: "Terms of Service",
      uk: "Умови використання",
    },
  };
  return names[policyType][locale];
}
