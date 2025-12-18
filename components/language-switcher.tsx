"use client";

import { Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useTransition } from "react";
import { setLocaleAction } from "@/app/actions/locale";
import { type Locale, locales } from "@/i18n/config";

const localeNames: Record<Locale, string> = {
  en: "EN",
  uk: "УК",
};

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(newLocale: Locale) {
    if (newLocale === locale || isPending) {
      return;
    }

    startTransition(async () => {
      await setLocaleAction(newLocale);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1">
      <Globe className="h-4 w-4 text-foreground/60" />
      <div className="flex gap-1">
        {locales.map((loc) => (
          <button
            key={loc}
            type="button"
            onClick={() => handleChange(loc)}
            disabled={isPending}
            className={`px-2 py-1 text-sm rounded transition-colors disabled:opacity-50 ${
              locale === loc
                ? "bg-foreground/10 font-medium"
                : "hover:bg-foreground/5 text-foreground/60"
            }`}
          >
            {localeNames[loc]}
          </button>
        ))}
      </div>
    </div>
  );
}
