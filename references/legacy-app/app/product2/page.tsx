import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Product2Page } from "./_components/product2-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("product2");

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
 * Product2 page - Human-centered landing page with visual focus.
 *
 * This is a new landing page design that emphasizes:
 * - Real product screenshots and video demos
 * - Human elements (photos, testimonials, avatar rows)
 * - Social proof through people, not just numbers
 *
 * Access at: /product2
 */
export default function Product2Route() {
  return <Product2Page />;
}
