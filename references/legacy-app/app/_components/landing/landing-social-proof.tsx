import { getTranslations } from "next-intl/server";

/**
 * Social proof section with key statistics.
 * Numbers build trust and demonstrate platform adoption.
 */
export async function LandingSocialProof() {
  const t = await getTranslations("landing");

  const stats = [
    {
      value: "500+",
      label: t("stats.specialists"),
    },
    {
      value: "10,000+",
      label: t("stats.appointments"),
    },
    {
      value: "25+",
      label: t("stats.cities"),
    },
  ];

  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold md:text-4xl">{stat.value}</p>
              <p className="mt-2 text-sm text-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
