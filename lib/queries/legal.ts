/**
 * Query functions for legal policies (Privacy Policy, Terms of Service).
 *
 * Policies are versioned documents stored in the database with translations.
 * Each policy type has one "current" version at any time.
 * User consent is tracked per version for audit/compliance purposes.
 */

import { createClient } from "@/lib/supabase/server";
import type {
  PolicyLocale,
  PolicySummary,
  PolicyType,
  PolicyWithTranslation,
  UserConsentStatus,
} from "@/lib/types/legal";

// ============================================================================
// Public Queries
// ============================================================================

/**
 * Fetches the current policy with translation for display.
 *
 * @param policyType - Type of policy (privacy or terms)
 * @param locale - Locale for translation (defaults to 'uk')
 * @returns Policy with translation or null if not found
 */
export async function getCurrentPolicy(
  policyType: PolicyType,
  locale: PolicyLocale = "uk",
): Promise<PolicyWithTranslation | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("policy_versions")
    .select(
      `
      id,
      policy_type,
      version,
      effective_date,
      summary_of_changes,
      is_current,
      policy_translations!inner (
        title,
        content,
        locale
      )
    `,
    )
    .eq("policy_type", policyType)
    .eq("is_current", true)
    .eq("policy_translations.locale", locale)
    .single();

  if (error) {
    console.error("Error fetching current policy:", error);
    return null;
  }

  const translation = Array.isArray(data.policy_translations)
    ? data.policy_translations[0]
    : data.policy_translations;

  return {
    id: data.id,
    policy_type: data.policy_type as PolicyType,
    version: data.version,
    effective_date: data.effective_date,
    summary_of_changes: data.summary_of_changes,
    is_current: data.is_current,
    title: translation.title,
    content: translation.content,
    locale: translation.locale as PolicyLocale,
  };
}

/**
 * Fetches a specific policy version with translation.
 *
 * @param versionId - The policy version ID
 * @param locale - Locale for translation (defaults to 'uk')
 * @returns Policy with translation or null if not found
 */
export async function getPolicyByVersion(
  versionId: string,
  locale: PolicyLocale = "uk",
): Promise<PolicyWithTranslation | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("policy_versions")
    .select(
      `
      id,
      policy_type,
      version,
      effective_date,
      summary_of_changes,
      is_current,
      policy_translations!inner (
        title,
        content,
        locale
      )
    `,
    )
    .eq("id", versionId)
    .eq("policy_translations.locale", locale)
    .single();

  if (error) {
    console.error("Error fetching policy version:", error);
    return null;
  }

  const translation = Array.isArray(data.policy_translations)
    ? data.policy_translations[0]
    : data.policy_translations;

  return {
    id: data.id,
    policy_type: data.policy_type as PolicyType,
    version: data.version,
    effective_date: data.effective_date,
    summary_of_changes: data.summary_of_changes,
    is_current: data.is_current,
    title: translation.title,
    content: translation.content,
    locale: translation.locale as PolicyLocale,
  };
}

/**
 * Fetches all versions of a policy type (for version history).
 *
 * @param policyType - Type of policy
 * @param locale - Locale for translations (defaults to 'uk')
 * @returns Array of policy summaries ordered by effective date (newest first)
 */
export async function getPolicyVersionHistory(
  policyType: PolicyType,
  locale: PolicyLocale = "uk",
): Promise<PolicySummary[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("policy_versions")
    .select(
      `
      id,
      policy_type,
      version,
      effective_date,
      summary_of_changes,
      is_current,
      policy_translations!inner (
        title,
        locale
      )
    `,
    )
    .eq("policy_type", policyType)
    .eq("policy_translations.locale", locale)
    .order("effective_date", { ascending: false });

  if (error) {
    console.error("Error fetching policy history:", error);
    return [];
  }

  return data.map((item) => {
    const translation = Array.isArray(item.policy_translations)
      ? item.policy_translations[0]
      : item.policy_translations;

    return {
      id: item.id,
      policy_type: item.policy_type as PolicyType,
      version: item.version,
      effective_date: item.effective_date,
      summary_of_changes: item.summary_of_changes,
      is_current: item.is_current,
      title: translation.title,
    };
  });
}

/**
 * Checks user's consent status for both policy types.
 * Returns whether the user needs to accept updated policies.
 *
 * @param userId - The user's ID
 * @returns Array of consent status for each policy type
 */
export async function getUserConsentStatus(
  userId: string,
): Promise<UserConsentStatus[]> {
  const supabase = await createClient();

  // Get current versions for both policy types
  const { data: currentVersions, error: versionsError } = await supabase
    .from("policy_versions")
    .select("id, policy_type, version")
    .eq("is_current", true);

  if (versionsError || !currentVersions) {
    console.error("Error fetching current policy versions:", versionsError);
    return [];
  }

  // Get user's consents
  const { data: consents, error: consentsError } = await supabase
    .from("user_policy_consents")
    .select(
      `
      policy_version_id,
      consented_at,
      policy_versions (
        policy_type,
        version
      )
    `,
    )
    .eq("user_id", userId);

  if (consentsError) {
    console.error("Error fetching user consents:", consentsError);
    return [];
  }

  // Build consent status for each policy type
  const policyTypes: PolicyType[] = ["privacy", "terms"];

  return policyTypes.map((policyType) => {
    const currentVersion = currentVersions.find(
      (v) => v.policy_type === policyType,
    );

    if (!currentVersion) {
      return {
        policy_type: policyType,
        has_consented: false,
        consented_version: null,
        consented_at: null,
        current_version: "unknown",
        needs_reconsent: true,
      };
    }

    // Find user's consent for the current version
    const consent = consents?.find(
      (c) => c.policy_version_id === currentVersion.id,
    );

    // Find any consent for this policy type (for showing what they previously agreed to)
    // Note: policy_versions can be an object or array depending on Supabase response
    const anyConsent = consents?.find((c) => {
      const pv = Array.isArray(c.policy_versions)
        ? c.policy_versions[0]
        : c.policy_versions;
      return (pv as { policy_type: string } | null)?.policy_type === policyType;
    });

    const rawPv = anyConsent?.policy_versions;
    const consentedVersionObj = rawPv
      ? Array.isArray(rawPv)
        ? (rawPv[0] as { version: string } | undefined)
        : (rawPv as { version: string })
      : null;

    return {
      policy_type: policyType,
      has_consented: !!consent,
      consented_version: consentedVersionObj?.version ?? null,
      consented_at: anyConsent?.consented_at ?? null,
      current_version: currentVersion.version,
      needs_reconsent: !consent,
    };
  });
}

/**
 * Records user consent for a policy version.
 *
 * @param userId - The user's ID
 * @param policyVersionId - The policy version ID
 * @param ipAddress - Optional IP address for audit
 * @param userAgent - Optional user agent for audit
 * @returns true if consent was recorded successfully
 */
export async function recordUserConsent(
  userId: string,
  policyVersionId: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase.from("user_policy_consents").upsert(
    {
      user_id: userId,
      policy_version_id: policyVersionId,
      ip_address: ipAddress,
      user_agent: userAgent,
      consented_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,policy_version_id",
    },
  );

  if (error) {
    console.error("Error recording consent:", error);
    return false;
  }

  return true;
}

/**
 * Gets the current policy version IDs for consent recording.
 * Used during sign-up to record initial consent.
 *
 * @returns Object with current version IDs for each policy type
 */
export async function getCurrentPolicyVersionIds(): Promise<{
  privacy: string | null;
  terms: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("policy_versions")
    .select("id, policy_type")
    .eq("is_current", true);

  if (error || !data) {
    console.error("Error fetching current version IDs:", error);
    return { privacy: null, terms: null };
  }

  return {
    privacy: data.find((v) => v.policy_type === "privacy")?.id ?? null,
    terms: data.find((v) => v.policy_type === "terms")?.id ?? null,
  };
}
