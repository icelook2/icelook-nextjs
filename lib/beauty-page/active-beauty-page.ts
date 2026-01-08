import { cookies } from "next/headers";

const ACTIVE_BEAUTY_PAGE_COOKIE = "IL_ACTIVE_BEAUTY_PAGE";

/**
 * Gets the active beauty page ID from the cookie.
 * Returns null if no cookie is set.
 */
export async function getActiveBeautyPageId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_BEAUTY_PAGE_COOKIE)?.value ?? null;
}

export { ACTIVE_BEAUTY_PAGE_COOKIE };
