import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/lib/ui/button";

/**
 * CTA section for clients looking to book appointments.
 * Secondary audience - redirects to search/discovery flow.
 */
export async function Product2ClientsCta() {
  const t = await getTranslations("product2");

  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
              <Search className="h-7 w-7 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {t("clients.headline")}
              </h2>
              <p className="text-muted">
                {t("clients.description")}
              </p>
            </div>
          </div>

          <Button variant="outline" size="lg" render={<Link href="/search" />}>
            {t("clients.cta")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
