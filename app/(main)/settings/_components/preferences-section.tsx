"use client";

import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

export function PreferencesSection() {
  const t = useTranslations("settings");

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">
        {t("preferences_section")}
      </h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">
              {t("theme_label")}
            </p>
            <p className="text-xs text-foreground/60">
              {t("theme_description")}
            </p>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">
              {t("language_label")}
            </p>
            <p className="text-xs text-foreground/60">
              {t("language_description")}
            </p>
          </div>
          <LanguageSwitcher />
        </div>
      </div>
    </section>
  );
}
