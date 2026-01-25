"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { IcelookLogo } from "@/components/icelook-logo";
import { Button } from "@/lib/ui/button";
import { HeaderPortal } from "./shared/header-portal";

/**
 * Fixed header for the product2 page.
 * Uses Portal to render at body level, ensuring it paints on top of all content.
 */
export function Product2Header() {
  const t = useTranslations("product2");

  return (
    <HeaderPortal>
      <header className="fixed inset-x-0 top-0">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <IcelookLogo size={26} />
            <span className="font-semibold">Icelook</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#features" className="text-sm text-muted hover:text-foreground">
              {t("header.features")}
            </Link>
            <Link href="#how-it-works" className="text-sm text-muted hover:text-foreground">
              {t("header.how_it_works")}
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" render={<Link href="/auth" />}>
              {t("header.login")}
            </Button>
            <Button variant="primary" size="sm" render={<Link href="/auth" />}>
              {t("header.signup")}
            </Button>
          </div>
        </div>
      </header>
    </HeaderPortal>
  );
}
