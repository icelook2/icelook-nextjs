import Link from "next/link";
import { Search } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/lib/ui/button";

/**
 * Secondary CTA section for clients looking to book appointments.
 * Addresses the demand side of the marketplace.
 */
export async function LandingClientsCta() {
  const t = await getTranslations("landing");

  return (
    <section className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
            <Search className="h-7 w-7 text-accent" />
          </div>

          <h2 className="text-2xl font-semibold">{t("clients.headline")}</h2>
          <p className="mt-3 text-muted">{t("clients.description")}</p>

          <Button
            variant="ghost"
            size="lg"
            className="mt-6"
            render={<Link href="/search" />}
          >
            {t("clients.cta")}
          </Button>
        </div>
      </div>
    </section>
  );
}
