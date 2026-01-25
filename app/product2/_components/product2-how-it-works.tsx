import Link from "next/link";
import { UserPlus, ListPlus, Share2, ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/lib/ui/button";
import { Paper } from "@/lib/ui/paper";
import { ScreenshotPlaceholder } from "./shared";

/**
 * How it works section with 3 steps and mini screenshot thumbnails.
 */
export async function Product2HowItWorks() {
  const t = await getTranslations("product2");

  const steps = [
    {
      number: 1,
      icon: UserPlus,
      title: t("how_it_works.step1_title"),
      description: t("how_it_works.step1_description"),
      screenshotLabel: t("how_it_works.screenshot1_label"),
      screenshotDescription: t("how_it_works.screenshot1_description"),
      color: "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400",
    },
    {
      number: 2,
      icon: ListPlus,
      title: t("how_it_works.step2_title"),
      description: t("how_it_works.step2_description"),
      screenshotLabel: t("how_it_works.screenshot2_label"),
      screenshotDescription: t("how_it_works.screenshot2_description"),
      color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
    },
    {
      number: 3,
      icon: Share2,
      title: t("how_it_works.step3_title"),
      description: t("how_it_works.step3_description"),
      screenshotLabel: t("how_it_works.screenshot3_label"),
      screenshotDescription: t("how_it_works.screenshot3_description"),
      color: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
    },
  ];

  return (
    <section id="how-it-works" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-20">
        {/* Section headline */}
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-semibold md:text-3xl">
            {t("how_it_works.headline")}
          </h2>
          <p className="mt-3 text-muted">
            {t("how_it_works.subheadline")}
          </p>
        </div>

        {/* Steps */}
        <div className="grid gap-8 lg:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col">
              {/* Step header */}
              <div className="mb-4 flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${step.color}`}
                >
                  {step.number}
                </div>
                <step.icon className={`h-5 w-5 ${step.color.includes("violet") ? "text-violet-600 dark:text-violet-400" : step.color.includes("emerald") ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`} />
              </div>

              {/* Step content */}
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted">{step.description}</p>

              {/* Mini screenshot thumbnail */}
              <Paper className="mt-4 flex-1 overflow-hidden">
                <ScreenshotPlaceholder
                  label={step.screenshotLabel}
                  description={step.screenshotDescription}
                  dimensions="400x300"
                  className="min-h-[180px]"
                />
              </Paper>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Button variant="primary" size="lg" render={<Link href="/auth" />}>
            {t("how_it_works.cta")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
