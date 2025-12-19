"use client";

import { useTranslations } from "next-intl";
import { EmailChangeSection } from "./email-change-section";
import { PreferencesSection } from "./preferences-section";
import { ProfileSection } from "./profile-section";

interface SettingsFormProps {
  initialName: string;
  initialEmail: string;
}

export function SettingsForm({ initialName, initialEmail }: SettingsFormProps) {
  const t = useTranslations("settings");

  return (
    <div className="space-y-8">
      {/* Profile Section */}
      <ProfileSection initialName={initialName} />

      {/* Email Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">
          {t("email_section")}
        </h2>
        <EmailChangeSection currentEmail={initialEmail} />
      </section>

      {/* Preferences Section */}
      <PreferencesSection />
    </div>
  );
}
