"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { setLocaleAction } from "@/app/actions/locale";
import { type Locale, locales } from "@/i18n/config";
import { cn } from "@/lib/utils/cn";

export function LanguageSelector() {
  const locale = useLocale() as Locale;
  const t = useTranslations("language");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  function handleChange(newLocale: Locale) {
    if (newLocale === locale || isPending) {
      return;
    }

    startTransition(async () => {
      await setLocaleAction(newLocale);
      router.refresh();
    });
  }

  if (!mounted) {
    return (
      <div className="flex gap-2 rounded-full bg-surface-container p-1">
        <div className="h-12 flex-1 rounded-full" />
        <div className="h-12 flex-1 rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex gap-2 rounded-full bg-surface-container p-1">
      {locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => handleChange(loc)}
          disabled={isPending}
          className={cn(
            "flex flex-1 items-center justify-center rounded-full px-6 py-3 transition-all",
            locale === loc
              ? "bg-surface text-on-surface shadow-md border border-border"
              : "text-on-surface-variant hover:bg-surface/50 hover:text-on-surface",
          )}
        >
          <span className="text-sm font-medium">{t(loc)}</span>
        </button>
      ))}
    </div>
  );
}
