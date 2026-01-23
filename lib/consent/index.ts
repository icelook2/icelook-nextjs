/**
 * Cookie consent module for Icelook.
 *
 * This module provides GDPR-compliant cookie consent management using c15t
 * with Supabase as the backend for storing consent records.
 *
 * @example
 * ```tsx
 * // The CookieConsentProvider is already integrated in the root layout.
 * // To access consent state in components, use the c15t hooks:
 *
 * import { useConsentManager } from "@c15t/react";
 *
 * function MyComponent() {
 *   const { hasConsent, acceptAll, rejectAll } = useConsentManager();
 *
 *   // Check if user has consented to measurement (analytics)
 *   if (hasConsent("measurement")) {
 *     // Safe to load analytics scripts
 *   }
 * }
 * ```
 *
 * @example
 * // To trigger re-consent (e.g., when adding Mixpanel):
 * // 1. In lib/consent/handlers.ts, change CONSENT_POLICY_VERSION from "1.0" to "1.1"
 * // 2. Deploy
 * // 3. Users see the banner again on next visit
 */
export { ConsentBanner } from "./consent-banner";
export { CONSENT_POLICY_VERSION, supabaseEndpointHandlers } from "./handlers";
