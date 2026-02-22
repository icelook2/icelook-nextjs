"use client";

import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import type { UserBeautyPage } from "@/lib/queries/beauty-pages";
import { Paper } from "@/lib/ui/paper";
import { SettingsItem } from "@/lib/ui/settings-item";
import { BeautyPagePromoCard } from "./beauty-page-promo-card";

interface BeautyPagesSectionProps {
  beautyPages: UserBeautyPage[];
}

/**
 * Conditional section for Beauty Pages in settings.
 * - Shows promo card (standalone, no Paper) when user has no beauty pages
 * - Shows navigation item in Paper when user has pages
 */
export function BeautyPagesSection({ beautyPages }: BeautyPagesSectionProps) {
  const t = useTranslations("settings");

  // Promo card renders standalone without Paper wrapper
  if (beautyPages.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-base font-semibold">{t("groups.beauty_pages")}</h2>
        <BeautyPagePromoCard />
      </section>
    );
  }

  // Normal settings item wrapped in Paper
  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold">{t("groups.beauty_pages")}</h2>
      <Paper>
        <SettingsItem
          href="/settings/beauty-pages"
          icon={Sparkles}
          title={t("nav.beauty_pages")}
          description={t("nav.beauty_pages_description")}
          iconClassName="bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-400"
          variant="grouped"
          noBorder
        />
      </Paper>
    </section>
  );
}
