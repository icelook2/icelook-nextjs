import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { defaultLocale, isValidLocale, type Locale } from "./i18n/config";

const supabaseUrl = process.env.NEXT_PUBLIC_IL_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_IL_SUPABASE_ANON_KEY;

const LOCALE_COOKIE = "IL_LOCALE";

// Routes that require authentication (show 404 for unauthenticated users)
const protectedRoutes = ["/protected", "/settings"];

// Routes that authenticated users cannot access
const authRoutes = ["/auth"];

// Onboarding route
const onboardingRoutes = ["/onboarding"];

function matchesRoutes(path: string, routes: string[]): boolean {
 return routes.some((route) => path === route || path.startsWith(`${route}/`));
}

function resolveLocaleFromRequest(request: NextRequest): Locale {
 // 1. Check cookie first
 const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
 if (cookieLocale && isValidLocale(cookieLocale)) {
 return cookieLocale;
 }

 // 2. Check Accept-Language header
 const acceptLanguage = request.headers.get("accept-language");
 if (acceptLanguage) {
 // Parse Accept-Language header (e.g., "uk-UA,uk;q=0.9,en;q=0.8")
 const languages = acceptLanguage.split(",").map((lang) => {
 const [code] = lang.trim().split(";");
 return code.split("-")[0].toLowerCase();
 });

 for (const lang of languages) {
 if (isValidLocale(lang)) {
 return lang;
 }
 }
 }

 // 3. Default fallback
 return defaultLocale;
}

export default async function proxy(request: NextRequest) {
 const path = request.nextUrl.pathname;

 // Handle /@username URLs - rewrite to /username
 if (path.startsWith("/@")) {
 const username = path.slice(2); // Remove "/@"
 const url = request.nextUrl.clone();
 url.pathname = `/${username}`;
 return NextResponse.rewrite(url);
 }

 // Skip if Supabase env vars are missing (build time)
 if (!supabaseUrl || !supabaseAnonKey) {
 return NextResponse.next();
 }

 const response = NextResponse.next({ request });

 // Resolve locale and set cookie if not present
 const locale = resolveLocaleFromRequest(request);
 const existingLocale = request.cookies.get(LOCALE_COOKIE)?.value;

 if (existingLocale !== locale) {
 response.cookies.set(LOCALE_COOKIE, locale, {
 path: "/",
 maxAge: 60 * 60 * 24 * 365, // 1 year
 sameSite: "lax",
 });
 }

 const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
 cookies: {
 getAll() {
 return request.cookies.getAll();
 },
 setAll(cookiesToSet) {
 for (const { name, value, options } of cookiesToSet) {
 response.cookies.set(name, value, options);
 }
 },
 },
 });

 // Get user (also refreshes session)
 let user = null;
 try {
 const { data } = await supabase.auth.getUser();
 user = data.user;
 } catch (error) {
 console.error("Failed to get user in proxy:", error);
 }

 const isProtectedRoute = matchesRoutes(path, protectedRoutes);
 const isAuthRoute = matchesRoutes(path, authRoutes);
 const isOnboardingRoute = matchesRoutes(path, onboardingRoutes);

 // Unauthenticated user
 if (!user) {
 // Protected routes → 404
 if (isProtectedRoute) {
 return NextResponse.rewrite(new URL("/not-found", request.url));
 }
 // Onboarding requires auth → redirect to login
 if (isOnboardingRoute) {
 return NextResponse.redirect(new URL("/auth", request.url));
 }
 // All other routes (including /, /auth) → allow
 return response;
 }

 // Authenticated user - check onboarding status and locale preference
 const { data: profile } = await supabase
 .from("profiles")
 .select("full_name, preferred_locale")
 .eq("id", user.id)
 .single();

 // Sync DB locale preference to cookie if different
 if (
 profile?.preferred_locale &&
 isValidLocale(profile.preferred_locale) &&
 profile.preferred_locale !== existingLocale
 ) {
 response.cookies.set(LOCALE_COOKIE, profile.preferred_locale, {
 path: "/",
 maxAge: 60 * 60 * 24 * 365, // 1 year
 sameSite: "lax",
 });
 }

 const hasCompletedOnboarding =
 profile?.full_name != null && profile.full_name.trim() !== "";

 // User needs onboarding
 if (!hasCompletedOnboarding) {
 // Already on onboarding page → allow
 if (isOnboardingRoute) {
 return response;
 }
 // Any other route → redirect to onboarding
 return NextResponse.redirect(new URL("/onboarding", request.url));
 }

 // User completed onboarding
 // On auth route → redirect home
 if (isAuthRoute) {
 return NextResponse.redirect(new URL("/", request.url));
 }
 // On onboarding route → redirect home (already completed)
 if (isOnboardingRoute) {
 return NextResponse.redirect(new URL("/", request.url));
 }

 return response;
}

export const config = {
 matcher: [
 /*
 * Match all request paths except for the ones starting with:
 * - _next/static (static files)
 * - _next/image (image optimization files)
 * - favicon.ico (favicon file)
 * - public folder files
 */
 "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
 ],
};
