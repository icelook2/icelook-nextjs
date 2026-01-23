import { Clock, DollarSign, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Paper } from "@/lib/ui/paper";

/**
 * Problems section - addresses pain points that specialists face.
 * Uses empathy-driven copy to connect with the target audience.
 */
export async function LandingProblems() {
  const t = await getTranslations("landing");

  const problems = [
    {
      icon: Phone,
      title: t("problems.problem1_title"),
      description: t("problems.problem1_description"),
      color: "bg-danger/10 text-danger dark:bg-danger/20",
    },
    {
      icon: Clock,
      title: t("problems.problem2_title"),
      description: t("problems.problem2_description"),
      color: "bg-warning/10 text-warning dark:bg-warning/20",
    },
    {
      icon: DollarSign,
      title: t("problems.problem3_title"),
      description: t("problems.problem3_description"),
      color: "bg-info/10 text-info dark:bg-info/20",
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      {/* Section headline */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold md:text-3xl">
          {t("problems.headline")}
        </h2>
        <p className="mt-3 text-muted">{t("problems.subheadline")}</p>
      </div>

      {/* Problem cards */}
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {problems.map((problem) => (
          <Paper key={problem.title} className="p-6">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${problem.color}`}
            >
              <problem.icon className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">{problem.title}</h3>
            <p className="mt-2 text-sm text-muted">{problem.description}</p>
          </Paper>
        ))}
      </div>

      {/* Transition to solution */}
      <div className="mt-16 text-center">
        <p className="text-xl font-medium text-accent">
          {t("solution.headline")}
        </p>
      </div>
    </section>
  );
}
