"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sun, Moon, Monitor, Globe, Mail } from "lucide-react";
import { useTheme } from "next-themes";
import { useLocale } from "next-intl";
import { IcelookLogo } from "@/components/icelook-logo";
import { setLocaleAction } from "@/app/actions/locale";
import { type Locale, locales } from "@/i18n/config";

/**
 * Landing page footer with language and theme controls under the brand.
 *
 * Based on variant 3 layout with proper app color tokens.
 */
export function LandingFooter() {
  const currentYear = new Date().getFullYear();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleLocaleChange(newLocale: Locale) {
    if (newLocale === locale || isPending) {
      return;
    }
    startTransition(async () => {
      await setLocaleAction(newLocale);
      router.refresh();
    });
  }

  const localeLabels: Record<Locale, string> = {
    en: "English",
    uk: "Українська",
  };

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand with integrated controls */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <IcelookLogo size={32} />
              <span className="text-xl font-semibold">Icelook</span>
            </div>
            <p className="mt-4 max-w-md text-sm text-muted">
              The simplest way for beauty professionals to manage bookings and
              grow their business.
            </p>

            {/* Controls under brand */}
            <div className="mt-6 space-y-4">
              {/* Language selector */}
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted">
                  Language
                </label>
                <div className="flex gap-2">
                  {locales.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => handleLocaleChange(loc)}
                      disabled={isPending}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        locale === loc
                          ? "bg-accent text-white shadow-sm"
                          : "bg-surface-alt text-muted hover:text-foreground hover:bg-surface-alt/80"
                      } ${isPending ? "opacity-50" : ""}`}
                    >
                      <Globe className="h-4 w-4" />
                      {localeLabels[loc]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme selector */}
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted">
                  Theme
                </label>
                {mounted && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTheme("light")}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        theme === "light"
                          ? "bg-accent text-white shadow-sm"
                          : "bg-surface-alt text-muted hover:text-foreground hover:bg-surface-alt/80"
                      }`}
                    >
                      <Sun className="h-4 w-4" />
                      Light
                    </button>
                    <button
                      onClick={() => setTheme("dark")}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        theme === "dark"
                          ? "bg-accent text-white shadow-sm"
                          : "bg-surface-alt text-muted hover:text-foreground hover:bg-surface-alt/80"
                      }`}
                    >
                      <Moon className="h-4 w-4" />
                      Dark
                    </button>
                    <button
                      onClick={() => setTheme("system")}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        theme === "system"
                          ? "bg-accent text-white shadow-sm"
                          : "bg-surface-alt text-muted hover:text-foreground hover:bg-surface-alt/80"
                      }`}
                    >
                      <Monitor className="h-4 w-4" />
                      System
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Legal
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Contact
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href="mailto:hello@icelook.com"
                  className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  hello@icelook.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-border pt-8">
          <p className="text-sm text-muted">
            © {currentYear} Icelook. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
