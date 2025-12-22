import { cookies } from "next/headers";
import { defaultLocale, isValidLocale, type Locale } from "./config";

const LOCALE_COOKIE = "IL_LOCALE";

export async function getLocale(): Promise<Locale> {
 const cookieStore = await cookies();
 const localeCookie = cookieStore.get(LOCALE_COOKIE)?.value;

 if (localeCookie && isValidLocale(localeCookie)) {
 return localeCookie;
 }

 return defaultLocale;
}

export { LOCALE_COOKIE };
