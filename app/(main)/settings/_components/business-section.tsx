"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Store, Building, ArrowRight, Settings, Plus } from "lucide-react";
import { Button } from "@/lib/ui/button";

interface Business {
  type: "salon" | "organization";
  slug: string;
  name: string;
  isActive: boolean;
}

interface BusinessSectionProps {
  businesses: Business[];
}

export function BusinessSection({ businesses }: BusinessSectionProps) {
  const t = useTranslations("settings.business");

  const hasBusiness = businesses.length > 0;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          {t("section_title")}
        </h2>
        {hasBusiness && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            render={(props) => (
              <Link {...props} href="/settings/create-business" />
            )}
          >
            <Plus className="h-4 w-4" />
            {t("add_new")}
          </Button>
        )}
      </div>

      {hasBusiness ? (
        <div className="space-y-3">
          {businesses.map((business) => (
            <div
              key={`${business.type}-${business.slug}`}
              className="rounded-xl border border-foreground/10 bg-background p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center">
                    {business.type === "salon" ? (
                      <Store className="h-5 w-5 text-white" />
                    ) : (
                      <Building className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{business.name}</p>
                    <p className="text-sm text-foreground/60">
                      {business.type === "salon"
                        ? t("type_salon")
                        : t("type_organization")}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    business.isActive
                      ? "bg-green-500/15 text-green-600 dark:text-green-400"
                      : "bg-foreground/10 text-foreground/60"
                  }`}
                >
                  {business.isActive ? t("status_active") : t("status_hidden")}
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1 gap-2"
                  render={(props) => (
                    <Link
                      {...props}
                      href={`/${business.type === "salon" ? "salon" : "org"}/${business.slug}`}
                    />
                  )}
                >
                  {t("view_profile")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1 gap-2"
                  render={(props) => (
                    <Link
                      {...props}
                      href={`/settings/${business.type === "salon" ? "salon" : "org"}/${business.slug}`}
                    />
                  )}
                >
                  <Settings className="h-4 w-4" />
                  {t("manage")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-foreground/10 bg-gradient-to-br from-violet-500/10 to-background p-6 text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-violet-500/15 flex items-center justify-center">
            <Store className="h-6 w-6 text-violet-500" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {t("create_business_title")}
            </h3>
            <p className="mt-1 text-sm text-foreground/60">
              {t("create_business_description")}
            </p>
          </div>
          <Button
            className="gap-2"
            render={(props) => (
              <Link {...props} href="/settings/create-business" />
            )}
          >
            {t("create_business_button")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </section>
  );
}
