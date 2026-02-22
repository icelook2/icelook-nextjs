"use client";

import { ConsentManagerProvider as C15tProvider } from "@c15t/react";
import type { ReactNode } from "react";
import { ConsentBanner, supabaseEndpointHandlers } from "@/lib/consent";

interface CookieConsentProviderProps {
  children: ReactNode;
}

/**
 * Cookie consent provider that integrates c15t with Supabase for consent storage.
 *
 * This provider:
 * - Shows a GDPR-compliant cookie banner to users who haven't consented
 * - Stores consent records in Supabase for audit trails
 * - Blocks analytics/marketing scripts until user consents
 * - Expandable banner lets users customize preferences in-place
 *
 * Uses custom UI components built with Base UI to match the app's design system.
 */
export function CookieConsentProvider({
  children,
}: CookieConsentProviderProps) {
  return (
    <C15tProvider
      options={{
        mode: "custom",
        endpointHandlers: supabaseEndpointHandlers,
        // Show banner in all environments during development
        // Remove or set to false in production if you only want to show in GDPR regions
        ignoreGeoLocation: true,
        // Consent categories to show in the banner
        // Available: 'necessary', 'functionality', 'marketing', 'measurement', 'experience'
        consentCategories: ["necessary", "measurement", "marketing"],
      }}
    >
      {children}
      {/* Expandable cookie consent banner using Base UI */}
      <ConsentBanner />
    </C15tProvider>
  );
}
