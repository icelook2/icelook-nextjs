import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/lib/ui/button";
import { AvatarRow } from "./shared";

/**
 * Final CTA section at the bottom of the page.
 * Includes avatar collage to show community of specialists.
 */
export async function Product2FinalCta() {
  const t = await getTranslations("product2");

  return (
    <section className="border-t border-border bg-gradient-to-b from-accent/5 to-transparent">
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        {/* Avatar row showing community */}
        <div className="mb-6 flex justify-center">
          <AvatarRow size="lg" moreCount={495} />
        </div>

        <Sparkles className="mx-auto mb-6 h-12 w-12 text-accent" />

        <h2 className="text-3xl font-bold md:text-4xl">
          {t("final_cta.headline")}
        </h2>

        <p className="mt-4 text-lg text-muted">{t("final_cta.subheadline")}</p>

        <Button
          variant="primary"
          size="lg"
          className="mt-8"
          render={<Link href="/auth" />}
        >
          {t("final_cta.cta")}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <p className="mt-4 text-sm text-muted">{t("final_cta.trust_note")}</p>
      </div>
    </section>
  );
}
