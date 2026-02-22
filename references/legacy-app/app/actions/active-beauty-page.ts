"use server";

import { cookies } from "next/headers";
import { getProfile } from "@/lib/auth/session";
import { ACTIVE_BEAUTY_PAGE_COOKIE } from "@/lib/beauty-page/active-beauty-page";
import { getUserBeautyPages } from "@/lib/queries";

/**
 * Sets the active beauty page for the current user.
 * Validates that the user owns the beauty page before setting.
 */
export async function setActiveBeautyPageAction(
  beautyPageId: string,
): Promise<void> {
  const profile = await getProfile();
  if (!profile) {
    throw new Error("Not authenticated");
  }

  // Validate that user owns this beauty page
  const beautyPages = await getUserBeautyPages(profile.id);
  const isValid = beautyPages.some((bp) => bp.id === beautyPageId);

  if (!isValid) {
    throw new Error("Invalid beauty page");
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_BEAUTY_PAGE_COOKIE, beautyPageId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });
}
