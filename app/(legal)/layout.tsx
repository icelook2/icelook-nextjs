import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { IcelookLogo } from "@/components/icelook-logo";

interface LegalLayoutProps {
  children: ReactNode;
}

/**
 * Layout for legal pages (Privacy Policy, Terms of Service).
 * Simple layout with header and footer, no sidebar or navigation.
 * Accessible to unauthenticated users.
 */
export default async function LegalLayout({ children }: LegalLayoutProps) {
  const t = await getTranslations("legal");
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <IcelookLogo size={24} />
            <span className="font-semibold">Icelook</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/privacy" className="text-muted hover:text-foreground">
              {t("privacy_title")}
            </Link>
            <Link href="/terms" className="text-muted hover:text-foreground">
              {t("terms_title")}
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="flex flex-col items-center gap-4 text-sm text-muted sm:flex-row sm:justify-between">
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-foreground">
                {t("privacy_title")}
              </Link>
              <Link href="/terms" className="hover:text-foreground">
                {t("terms_title")}
              </Link>
            </div>
            <p>{t("copyright", { year: currentYear })}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
