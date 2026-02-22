"use server";

import { cookies } from "next/headers";
import { ACTIVE_BEAUTY_PAGE_COOKIE } from "@/lib/beauty-page/active-beauty-page";

export async function setActiveBeautyPageAction(beautyPageId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_BEAUTY_PAGE_COOKIE, beautyPageId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
