"use client";

import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { SettingsLabeledRow } from "@/lib/ui/settings-group";

export function PreferencesSection() {
  const t = useTranslations("settings");

  return (
    <>
      <SettingsLabeledRow
        label={t("theme_label")}
        description={t("theme_description")}
      >
        <ThemeToggle />
      </SettingsLabeledRow>

      <SettingsLabeledRow
        label={t("language_label")}
        description={t("language_description")}
        noBorder
      >
        <LanguageSwitcher />
      </SettingsLabeledRow>
    </>
  );
}
