import type { FetchOptions, ResponseContext } from "c15t";
import { deleteConsentFromStorage, saveConsentToStorage } from "c15t";
import { createClient } from "@/lib/supabase/client";
import { generateUUID } from "@/lib/utils/generate-uuid";

/**
 * Current consent policy version.
 *
 * Bump this version when you need users to re-consent:
 * - Adding new consent categories (e.g., adding "functionality")
 * - Changing what's included in an existing category
 *
 * When bumped, all users with older versions will see the consent banner again.
 *
 * @example
 * // Adding Mixpanel analytics:
 * // 1. Change "1.0" to "1.1"
 * // 2. Deploy
 * // 3. Users see banner on next visit
 */
export const CONSENT_POLICY_VERSION = "1.0";

/**
 * Type definitions for c15t custom endpoint handlers.
 * These match the expected types from @c15t/backend contracts.
 */

type JurisdictionCode =
  | "GDPR"
  | "CH"
  | "BR"
  | "PIPEDA"
  | "AU"
  | "APPI"
  | "PIPA"
  | "NONE";

interface ShowConsentBannerResponse {
  showConsentBanner: boolean;
  jurisdiction: {
    code: JurisdictionCode;
    message: string;
  };
  location: {
    countryCode: string | null;
    regionCode: string | null;
  };
  translations: {
    language: string;
    translations: Record<string, unknown>;
  };
}

type ConsentType =
  | "cookie_banner"
  | "privacy_policy"
  | "dpa"
  | "terms_and_conditions"
  | "marketing_communications"
  | "age_verification"
  | "other";

interface SetConsentRequestBody {
  type?: ConsentType;
  preferences?: Record<string, boolean>;
  domain?: string;
  subjectId?: string;
  externalSubjectId?: string;
  metadata?: Record<string, unknown>;
}

interface SetConsentResponse {
  id: string;
  subjectId?: string;
  externalSubjectId?: string;
  domainId: string;
  domain: string;
  type: ConsentType;
  status: string;
  recordId: string;
  metadata?: Record<string, unknown>;
  givenAt: Date;
}

interface VerifyConsentResponse {
  valid: boolean;
  type: string;
  domain: string;
  preferences: string[];
}

interface IdentifyUserResponse {
  success: boolean;
}

/**
 * Endpoint handler type for c15t custom client.
 */
type EndpointHandler<TResponse, TBody = unknown> = (
  options?: FetchOptions<TResponse, TBody>,
) => Promise<ResponseContext<TResponse>>;

/**
 * Generates or retrieves a persistent anonymous subject ID.
 * This ID is used to track consent across sessions for anonymous users.
 */
function getOrCreateSubjectId(): string {
  const STORAGE_KEY = "c15t_subject_id";

  if (typeof window === "undefined") {
    return generateUUID();
  }

  let subjectId = localStorage.getItem(STORAGE_KEY);

  if (!subjectId) {
    subjectId = generateUUID();
    localStorage.setItem(STORAGE_KEY, subjectId);
  }

  return subjectId;
}

/**
 * Gets the current domain for consent tracking.
 */
function getCurrentDomain(): string {
  if (typeof window === "undefined") {
    return "localhost";
  }
  return window.location.hostname;
}

/**
 * Handler: Check if consent banner should be shown.
 *
 * Returns true if:
 * - User hasn't given consent yet for this domain
 * - User's consent is for an outdated policy version (triggers re-consent)
 */
export const showConsentBannerHandler: EndpointHandler<
  ShowConsentBannerResponse
> = async () => {
  try {
    const supabase = createClient();
    const subjectId = getOrCreateSubjectId();
    const domain = getCurrentDomain();

    const { data: existingConsent } = await supabase
      .from("consent_records")
      .select("id, preferences, policy_version")
      .eq("subject_id", subjectId)
      .eq("domain", domain)
      .eq("consent_type", "cookie_banner")
      .order("given_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Show banner if no consent exists OR if consent is for outdated policy version
    const isOutdatedVersion =
      existingConsent?.policy_version !== CONSENT_POLICY_VERSION;
    const showConsentBanner = !existingConsent || isOutdatedVersion;

    // If version mismatch, clear local storage so c15t also shows the banner
    if (existingConsent && isOutdatedVersion && typeof window !== "undefined") {
      try {
        deleteConsentFromStorage();
      } catch {
        // Non-critical - continue anyway
      }
    }

    return {
      data: {
        showConsentBanner,
        jurisdiction: {
          code: "GDPR" as const,
          message: "GDPR applies",
        },
        location: {
          countryCode: null,
          regionCode: null,
        },
        translations: {
          language: "en",
          translations: {},
        },
      },
      ok: true,
      error: null,
      response: null,
    };
  } catch {
    // On error, show the banner to be safe
    return {
      data: {
        showConsentBanner: true,
        jurisdiction: {
          code: "GDPR" as const,
          message: "GDPR applies",
        },
        location: {
          countryCode: null,
          regionCode: null,
        },
        translations: {
          language: "en",
          translations: {},
        },
      },
      ok: true,
      error: null,
      response: null,
    };
  }
};

/**
 * Handler: Save consent preferences to Supabase.
 */
export const setConsentHandler: EndpointHandler<
  SetConsentResponse,
  SetConsentRequestBody
> = async (options) => {
  try {
    const supabase = createClient();
    const subjectId = getOrCreateSubjectId();
    const domain = getCurrentDomain();
    const body = options?.body;

    if (!body) {
      return {
        data: null,
        ok: false,
        error: {
          message: "No consent data provided",
          status: 400,
        },
        response: null,
      };
    }

    // Get current user if authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const consentRecord = {
      subject_id: subjectId,
      user_id: user?.id ?? null,
      domain,
      consent_type: body.type ?? "cookie_banner",
      preferences: body.preferences ?? {},
      policy_version: CONSENT_POLICY_VERSION,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      given_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("consent_records")
      .insert(consentRecord)
      .select("id, given_at")
      .single();

    if (error) {
      console.error("Failed to save consent:", error);
      return {
        data: null,
        ok: false,
        error: {
          message: error.message,
          status: 500,
        },
        response: null,
      };
    }

    // Also save to c15t's internal storage (cookies/localStorage)
    // This ensures c15t knows consent exists on page reload and won't show the banner
    if (typeof window !== "undefined" && body.preferences) {
      try {
        saveConsentToStorage({
          consents: body.preferences,
          consentInfo: {
            time: Date.now(),
            type: "custom",
          },
        });
      } catch (storageError) {
        // Non-critical - log but don't fail the request
        console.warn("Failed to save to c15t storage:", storageError);
      }
    }

    return {
      data: {
        id: data.id,
        subjectId,
        domainId: domain,
        domain,
        type: body.type ?? "cookie_banner",
        status: "active",
        recordId: data.id,
        givenAt: new Date(data.given_at),
      },
      ok: true,
      error: null,
      response: null,
    };
  } catch (err) {
    console.error("Error in setConsentHandler:", err);
    return {
      data: null,
      ok: false,
      error: {
        message: "Failed to save consent",
        status: 500,
      },
      response: null,
    };
  }
};

/**
 * Handler: Verify if valid consent exists.
 *
 * Returns invalid if consent doesn't exist or is for an outdated policy version.
 */
export const verifyConsentHandler: EndpointHandler<
  VerifyConsentResponse
> = async () => {
  try {
    const supabase = createClient();
    const subjectId = getOrCreateSubjectId();
    const domain = getCurrentDomain();

    const { data: existingConsent } = await supabase
      .from("consent_records")
      .select("id, preferences, policy_version, given_at")
      .eq("subject_id", subjectId)
      .eq("domain", domain)
      .eq("consent_type", "cookie_banner")
      .order("given_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Invalid if no consent or outdated policy version
    if (
      !existingConsent ||
      existingConsent.policy_version !== CONSENT_POLICY_VERSION
    ) {
      return {
        data: {
          valid: false,
          type: "cookie_banner",
          domain,
          preferences: [],
        },
        ok: true,
        error: null,
        response: null,
      };
    }

    // Extract granted preferences (where value is true)
    const preferences = Object.entries(
      existingConsent.preferences as Record<string, boolean>,
    )
      .filter(([, granted]) => granted)
      .map(([name]) => name);

    return {
      data: {
        valid: true,
        type: "cookie_banner",
        domain,
        preferences,
      },
      ok: true,
      error: null,
      response: null,
    };
  } catch {
    return {
      data: {
        valid: false,
        type: "cookie_banner",
        domain: getCurrentDomain(),
        preferences: [],
      },
      ok: true,
      error: null,
      response: null,
    };
  }
};

/**
 * Handler: Link an authenticated user to their consent records.
 *
 * Called when a user logs in to associate their anonymous consent
 * with their authenticated account.
 */
export const identifyUserHandler: EndpointHandler<
  IdentifyUserResponse
> = async () => {
  try {
    const supabase = createClient();
    const subjectId = getOrCreateSubjectId();

    // Get current authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        data: {
          success: false,
        },
        ok: true,
        error: null,
        response: null,
      };
    }

    // Update all consent records for this subject_id to link to the user
    await supabase
      .from("consent_records")
      .update({ user_id: user.id })
      .eq("subject_id", subjectId)
      .is("user_id", null);

    return {
      data: {
        success: true,
      },
      ok: true,
      error: null,
      response: null,
    };
  } catch {
    return {
      data: {
        success: false,
      },
      ok: true,
      error: null,
      response: null,
    };
  }
};

/**
 * All endpoint handlers for c15t custom client mode.
 */
export const supabaseEndpointHandlers = {
  showConsentBanner: showConsentBannerHandler,
  setConsent: setConsentHandler,
  verifyConsent: verifyConsentHandler,
  identifyUser: identifyUserHandler,
};
