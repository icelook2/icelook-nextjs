import { getTranslations } from "next-intl/server";
import { Paper } from "@/lib/ui/paper";
import { VideoPlaceholder } from "./shared";

/**
 * Dedicated video demo section showing the full booking flow.
 * This is the "See Icelook in Action" section with a prominent video.
 */
export async function Product2Demo() {
  const t = await getTranslations("product2");

  return (
    <section id="demo" className="scroll-mt-20 bg-gradient-to-b from-transparent via-surface/50 to-transparent">
      <div className="mx-auto max-w-6xl px-4 py-20">
        {/* Section headline */}
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-semibold md:text-3xl">
            {t("demo.headline")}
          </h2>
          <p className="mt-3 text-muted">
            {t("demo.subheadline")}
          </p>
        </div>

        {/* Video placeholder */}
        <Paper className="mx-auto max-w-4xl overflow-hidden">
          <VideoPlaceholder
            label={t("demo.video_label")}
            steps={[
              t("demo.step1"),
              t("demo.step2"),
              t("demo.step3"),
              t("demo.step4"),
              t("demo.step5"),
            ]}
            duration="30-60 seconds"
          />
        </Paper>

        {/* Supporting text */}
        <p className="mt-8 text-center text-lg text-muted">
          {t("demo.supporting_text")}
        </p>
      </div>
    </section>
  );
}
