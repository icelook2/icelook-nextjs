"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Briefcase, ArrowRight, Settings } from "lucide-react";
import { Button } from "@/lib/ui/button";

interface SpecialistSectionProps {
  specialist: {
    username: string;
    displayName: string;
    isActive: boolean;
  } | null;
}

export function SpecialistSection({ specialist }: SpecialistSectionProps) {
  const t = useTranslations("settings.specialist");

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">
        {t("section_title")}
      </h2>

      {specialist ? (
        <div className="rounded-xl border border-foreground/10 bg-background p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center">
                <span className="text-sm font-bold text-white">
                  {specialist.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {specialist.displayName}
                </p>
                <p className="text-sm text-foreground/60">
                  @{specialist.username}
                </p>
              </div>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                specialist.isActive
                  ? "bg-green-500/15 text-green-600 dark:text-green-400"
                  : "bg-foreground/10 text-foreground/60"
              }`}
            >
              {specialist.isActive ? t("status_active") : t("status_hidden")}
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1 gap-2"
              render={(props) => (
                <Link {...props} href={`/@${specialist.username}`} />
              )}
            >
              {t("view_profile")}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              className="flex-1 gap-2"
              render={(props) => (
                <Link {...props} href={`/@${specialist.username}/settings`} />
              )}
            >
              <Settings className="h-4 w-4" />
              {t("manage_profile")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-foreground/10 bg-gradient-to-br from-violet-500/10 to-background p-6 text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-violet-500/15 flex items-center justify-center">
            <Briefcase className="h-6 w-6 text-violet-500" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {t("become_specialist_title")}
            </h3>
            <p className="mt-1 text-sm text-foreground/60">
              {t("become_specialist_description")}
            </p>
          </div>
          <Button
            className="gap-2"
            render={(props) => (
              <Link {...props} href="/settings/become-specialist" />
            )}
          >
            {t("become_specialist_button")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </section>
  );
}
