import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/lib/ui/button";

/**
 * How It Works section - shows the 3-step process.
 * Emphasizes simplicity and speed to reduce signup friction.
 */
export async function LandingHowItWorks() {
  const t = await getTranslations("landing");

  const steps = [
    {
      number: 1,
      title: t("how_it_works.step1_title"),
      description: t("how_it_works.step1_description"),
    },
    {
      number: 2,
      title: t("how_it_works.step2_title"),
      description: t("how_it_works.step2_description"),
    },
    {
      number: 3,
      title: t("how_it_works.step3_title"),
      description: t("how_it_works.step3_description"),
    },
  ];

  return (
    <section
      id="how-it-works"
      className="mx-auto max-w-6xl px-4 py-20 scroll-mt-20"
    >
      {/* Section headline */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold md:text-3xl">
          {t("how_it_works.headline")}
        </h2>
        <p className="mt-3 text-muted">{t("how_it_works.subheadline")}</p>
      </div>

      {/* Steps */}
      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {steps.map((step) => (
          <div key={step.number} className="text-center">
            {/* Step number */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-xl font-bold text-white">
              {step.number}
            </div>
            <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm text-muted">{step.description}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-14 text-center">
        <Button variant="primary" size="lg" render={<Link href="/auth" />}>
          {t("how_it_works.cta")}
        </Button>
      </div>
    </section>
  );
}
