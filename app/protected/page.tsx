import { getLocale, getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { getUser } from "@/lib/auth/session";
import { LogoutButton } from "./_components/logout-button";

export default async function ProtectedPage() {
  const t = await getTranslations("protected");
  const locale = await getLocale();
  const user = await getUser();

  // Demo data
  const itemCounts = [0, 1, 5];
  const lastLogin = new Date().toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="absolute right-4 top-4 flex items-center gap-4">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-2 text-foreground/60">
            {t("welcome", { email: user?.email ?? "" })}
          </p>
          <div className="mt-4">
            <LogoutButton />
          </div>
        </div>

        {/* Translation Demo */}
        <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-6">
          <h2 className="text-lg font-medium">{t("demo_title")}</h2>
          <p className="mt-1 text-sm text-foreground/60">
            {t("demo_description")}
          </p>

          <div className="mt-6 space-y-4">
            {/* Current language */}
            <div className="flex items-center justify-between rounded-lg bg-background p-3">
              <span className="text-sm text-foreground/60">
                {t("current_language")}
              </span>
              <span className="font-mono text-sm font-medium uppercase">
                {locale}
              </span>
            </div>

            {/* Greeting */}
            <div className="rounded-lg bg-background p-3">
              <span className="text-sm">{t("greeting")}</span>
            </div>

            {/* Pluralization examples */}
            <div className="space-y-2">
              {itemCounts.map((count) => (
                <div
                  key={count}
                  className="flex items-center justify-between rounded-lg bg-background p-3"
                >
                  <span className="font-mono text-xs text-foreground/40">
                    count={count}
                  </span>
                  <span className="text-sm">{t("items_count", { count })}</span>
                </div>
              ))}
            </div>

            {/* Date formatting */}
            <div className="rounded-lg bg-background p-3">
              <span className="text-sm">
                {t("last_login", { date: lastLogin })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
