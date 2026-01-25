"use client";

import { ChevronRight, Store } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function CreateBeautyPageSection() {
  const t = useTranslations("settings");

  return (
    <Link
      href="/create-beauty-page"
      className="flex items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-muted/5 active:bg-muted/10"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400">
          <Store className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium">{t("beauty_page_section")}</p>
          <p className="text-sm text-muted">
            {t("beauty_page_section_description")}
          </p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-muted" />
    </Link>
  );
}
