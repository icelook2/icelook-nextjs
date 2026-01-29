import { PhoneMissed, CalendarX, Percent } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Paper } from "@/lib/ui/paper";

/**
 * Problems section highlighting pain points specialists face.
 * Enhanced with icons to visualize each problem.
 */
export async function Product2Problems() {
  const t = await getTranslations("product2");

  const problems = [
    {
      icon: PhoneMissed,
      title: t("problems.problem1_title"),
      description: t("problems.problem1_description"),
      color: "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400",
    },
    {
      icon: CalendarX,
      title: t("problems.problem2_title"),
      description: t("problems.problem2_description"),
      color:
        "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
    },
    {
      icon: Percent,
      title: t("problems.problem3_title"),
      description: t("problems.problem3_description"),
      color:
        "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400",
    },
  ];

  return (
    <section className="border-y border-border">
      <div className="mx-auto max-w-6xl px-4 py-20">
        {/* Section headline */}
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-semibold md:text-3xl">
            {t("problems.headline")}
          </h2>
          <p className="mt-3 text-muted">{t("problems.subheadline")}</p>
        </div>

        {/* Problem cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map((problem) => (
            <Paper key={problem.title} className="p-6">
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${problem.color}`}
              >
                <problem.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold">{problem.title}</h3>
              <p className="mt-2 text-sm text-muted">{problem.description}</p>
            </Paper>
          ))}
        </div>

        {/* Solution teaser */}
        <p className="mt-12 text-center text-lg font-medium">
          {t("problems.solution_teaser")}
        </p>
      </div>
    </section>
  );
}
