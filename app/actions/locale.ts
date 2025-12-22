"use server";

import { cookies } from "next/headers";
import { isValidLocale } from "@/i18n/config";
import { LOCALE_COOKIE } from "@/i18n/get-locale";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function setLocaleAction(locale: string): Promise<void> {
 if (!isValidLocale(locale)) {
 throw new Error("Invalid locale");
 }

 // Set cookie
 const cookieStore = await cookies();
 cookieStore.set(LOCALE_COOKIE, locale, {
 path: "/",
 maxAge: 60 * 60 * 24 * 365, // 1 year
 sameSite: "lax",
 });

 // Update DB if user is authenticated
 const profile = await getProfile();
 if (profile) {
 const supabase = await createClient();
 await supabase
 .from("profiles")
 .update({ preferred_locale: locale })
 .eq("id", profile.id);
 }
}
