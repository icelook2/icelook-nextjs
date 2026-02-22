import { type NextRequest, NextResponse } from "next/server";
import { defaultLocale, isValidLocale, type Locale } from "./i18n/config";

const LOCALE_COOKIE = "IL_LOCALE";

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
