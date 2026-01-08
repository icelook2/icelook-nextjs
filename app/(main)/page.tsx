import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { getActiveBeautyPageId } from "@/lib/beauty-page/active-beauty-page";
import { getUserBeautyPages } from "@/lib/queries";

export default async function HomePage() {
  const profile = await getProfile();

  // Not authenticated - redirect to appointments (will redirect to auth)
  if (!profile) {
    redirect("/appointments");
  }

  // Get user's beauty pages
  const beautyPages = await getUserBeautyPages(profile.id);

  // Client (no beauty pages) - redirect to appointments
  if (beautyPages.length === 0) {
    redirect("/appointments");
  }

  // Creator - redirect to active beauty page profile
  const activeId = await getActiveBeautyPageId();
  const activeBeautyPage =
    beautyPages.find((bp) => bp.id === activeId) ?? beautyPages[0];

  redirect(`/${activeBeautyPage.slug}`);
}
