import {
  Bell,
  CalendarCheck,
  Link as LinkIcon,
  Star,
  Users,
  Wallet,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Paper } from "@/lib/ui/paper";

/**
 * Features section - showcases what specialists get.
 * Each feature addresses a specific benefit.
 */
export async function LandingFeatures() {
  const t = await getTranslations("landing");

  const features = [
    {
      icon: LinkIcon,
      title: t("features.feature1_title"),
      description: t("features.feature1_description"),
      color:
        "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400",
    },
    {
      icon: CalendarCheck,
      title: t("features.feature2_title"),
      description: t("features.feature2_description"),
      color:
        "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
    },
    {
      icon: Bell,
      title: t("features.feature3_title"),
      description: t("features.feature3_description"),
      color:
        "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
    },
    {
      icon: Wallet,
      title: t("features.feature4_title"),
      description: t("features.feature4_description"),
      color: "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400",
    },
    {
      icon: Users,
      title: t("features.feature5_title"),
      description: t("features.feature5_description"),
      color: "bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400",
    },
    {
      icon: Star,
      title: t("features.feature6_title"),
      description: t("features.feature6_description"),
      color:
        "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400",
    },
  ];

  return (
    <section
      id="features"
      className="border-t border-border bg-surface/50 scroll-mt-20"
    >
      <div className="mx-auto max-w-6xl px-4 py-20">
        {/* Section headline */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold md:text-3xl">
            {t("features.headline")}
          </h2>
          <p className="mt-3 text-muted">{t("features.subheadline")}</p>
        </div>

        {/* Feature grid */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Paper key={feature.title} className="p-6">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${feature.color}`}
              >
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted">{feature.description}</p>
            </Paper>
          ))}
        </div>
      </div>
    </section>
  );
}
