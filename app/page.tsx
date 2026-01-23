import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getActiveBeautyPageId } from "@/lib/beauty-page/active-beauty-page";
import { getUserBeautyPages } from "@/lib/queries";
import { LandingPage } from "./_components/landing/landing-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing");

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    openGraph: {
      title: t("meta.og_title"),
      description: t("meta.og_description"),
      type: "website",
      siteName: "Icelook",
    },
    twitter: {
      card: "summary_large_image",
      title: t("meta.og_title"),
      description: t("meta.og_description"),
    },
  };
}

/**
 * Root landing page.
 *
 * - Authenticated creators → redirect to their active beauty page
 * - Authenticated clients → redirect to appointments
 * - Unauthenticated users → show landing page
 */
export default async function RootPage() {
  const profile = await getProfile();

  // Authenticated users redirect to appropriate place
  if (profile) {
    const beautyPages = await getUserBeautyPages(profile.id);

    // Creator - redirect to active beauty page
    if (beautyPages.length > 0) {
      const activeId = await getActiveBeautyPageId();
      const activeBeautyPage =
        beautyPages.find((bp) => bp.id === activeId) ?? beautyPages[0];
      redirect(`/${activeBeautyPage.slug}`);
    }

    // Client - redirect to appointments
    redirect("/appointments");
  }

  // Unauthenticated - show landing page
  return <LandingPage />;
}
