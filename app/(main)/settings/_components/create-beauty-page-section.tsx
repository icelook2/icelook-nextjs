"use client";

import { Store } from "lucide-react";
import { useTranslations } from "next-intl";
import type { BeautyPageType } from "@/lib/queries";
import { CreateBeautyPageDialog } from "./create-beauty-page-dialog";

interface CreateBeautyPageSectionProps {
  beautyPageTypes: BeautyPageType[];
}

export function CreateBeautyPageSection({
  beautyPageTypes,
}: CreateBeautyPageSectionProps) {
  const t = useTranslations("settings");

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-4">
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
      <CreateBeautyPageDialog beautyPageTypes={beautyPageTypes} />
    </div>
  );
}
