import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/lib/ui/button";

/**
 * Hero section - the primary conversion point.
 * Features the main value proposition and CTAs.
 */
export async function LandingHero() {
  const t = await getTranslations("landing");

  return (
    <section className="relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent" />

      <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-32">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">
            {t("hero.badge")}
          </div>

          {/* Headline */}
          <h1 className="max-w-4xl text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            {t("hero.headline")}
          </h1>

          {/* Subheadline */}
          <p className="mt-6 max-w-2xl text-lg text-muted md:text-xl">
            {t("hero.subheadline")}
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button
              variant="primary"
              size="lg"
              render={<Link href="/auth" />}
            >
              {t("hero.cta_primary")}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              render={<Link href="/demo" />}
            >
              {t("hero.cta_secondary")}
            </Button>
          </div>

          {/* Trust indicator */}
          <p className="mt-6 text-sm text-muted">
            {t("hero.trust_indicator")}
          </p>
        </div>
      </div>
    </section>
  );
}
