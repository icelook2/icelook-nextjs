import { getTranslations } from "next-intl/server";
import { AvatarRow } from "./shared";

/**
 * Social proof section with key statistics and avatar row.
 * The avatar row humanizes the stats by showing real (placeholder) specialist faces.
 */
export async function Product2SocialProof() {
  const t = await getTranslations("product2");

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
        {/* Avatar row with join message */}
        <div className="mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <AvatarRow size="md" moreCount={495} />
          <p className="text-sm text-muted">{t("stats.join_message")}</p>
        </div>

        {/* Stats grid */}
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
