"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { IcelookLogo } from "@/components/icelook-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/lib/ui/button";
import { cn } from "@/lib/utils/cn";

/**
 * Landing page header with navigation.
 * Client component for mobile menu toggle functionality.
 */
export function LandingHeader() {
  const t = useTranslations("landing");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 border-b border-border bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <IcelookLogo size={28} />
          <span className="text-lg font-semibold">Icelook</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <a
            href="#features"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            {t("header.features")}
          </a>
          <a
            href="#how-it-works"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            {t("header.how_it_works")}
          </a>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <ThemeToggle />
          <Button variant="ghost" size="sm" render={<Link href="/auth" />}>
            {t("header.login")}
          </Button>
          <Button variant="primary" size="sm" render={<Link href="/auth" />}>
            {t("header.signup")}
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-hover hover:text-foreground md:hidden"
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "overflow-hidden border-t border-border bg-surface transition-all duration-200 md:hidden",
          isMobileMenuOpen ? "max-h-96" : "max-h-0 border-t-0",
        )}
      >
        <div className="space-y-4 px-4 py-4">
          <nav className="flex flex-col gap-2">
            <a
              href="#features"
              onClick={() => setIsMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-sm transition-colors hover:bg-surface-hover"
            >
              {t("header.features")}
            </a>
            <a
              href="#how-it-works"
              onClick={() => setIsMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-sm transition-colors hover:bg-surface-hover"
            >
              {t("header.how_it_works")}
            </a>
          </nav>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>

          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <Button variant="ghost" render={<Link href="/auth" />}>
              {t("header.login")}
            </Button>
            <Button variant="primary" render={<Link href="/auth" />}>
              {t("header.signup")}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
