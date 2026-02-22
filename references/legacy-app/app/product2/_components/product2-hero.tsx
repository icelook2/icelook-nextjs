import Link from "next/link";
import { ArrowRight, Quote, Star } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/lib/ui/button";
import { Paper } from "@/lib/ui/paper";
import { VideoPlaceholder } from "./shared";

/**
 * Hero section with video demonstration and mini testimonial bubble.
 *
 * The video placeholder shows where the booking flow walkthrough video will go.
 * A floating testimonial bubble adds social proof directly in the hero.
 */
export async function Product2Hero() {
  const t = await getTranslations("product2");

  return (
    <section className="overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        {/* Text content */}
        <div className="mb-12 flex flex-col items-center text-center">
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
        </div>

        {/* Video placeholder with floating testimonial */}
        <div className="relative mx-auto max-w-4xl">
          <Paper className="overflow-hidden">
            <VideoPlaceholder
              label={t("hero.video_label")}
              steps={[
                t("hero.video_step1"),
                t("hero.video_step2"),
                t("hero.video_step3"),
                t("hero.video_step4"),
              ]}
              duration="15-30 seconds"
            />
          </Paper>

          {/* Floating mini testimonial */}
          <div className="absolute -bottom-6 -right-4 hidden md:block lg:-right-12">
            <Paper className="max-w-[240px] p-4 shadow-lg">
              <div className="mb-2 flex items-center gap-2">
                {/* Placeholder avatar */}
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-medium text-white">
                  OK
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {t("hero.testimonial_name")}
                  </p>
                  <p className="text-xs text-muted">
                    {t("hero.testimonial_role")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-1">
                <Quote className="mt-0.5 h-3 w-3 shrink-0 rotate-180 text-accent" />
                <p className="text-sm text-muted">
                  {t("hero.testimonial_quote")}
                </p>
              </div>
              <div className="mt-2 flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-3 w-3 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
            </Paper>
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button variant="primary" size="lg" render={<Link href="/auth" />}>
            {t("hero.cta_primary")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="ghost" size="lg" render={<Link href="#demo" />}>
            {t("hero.cta_secondary")}
          </Button>
        </div>

        {/* Trust indicator */}
        <p className="mt-6 text-center text-sm text-muted">
          {t("hero.trust_indicator")}
        </p>
      </div>
    </section>
  );
}
