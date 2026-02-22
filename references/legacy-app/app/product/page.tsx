import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LandingPage } from "@/app/_components/landing/landing-page";

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
 * Product page - Landing page accessible to all users.
 *
 * Unlike the root `/` which redirects authenticated users,
 * this page always shows the landing page content.
 * Similar to Notion's `/product` page pattern.
 */
export default function ProductPage() {
  return <LandingPage />;
}
