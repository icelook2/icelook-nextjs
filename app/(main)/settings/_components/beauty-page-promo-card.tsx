"use client";

import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/lib/ui/button";
import { BeautyPagePromoDialog } from "./beauty-page-promo-dialog";

/**
 * Promotional card encouraging users to create their first beauty page.
 * Colorful gradient background with white button.
 */
export function BeautyPagePromoCard() {
  const t = useTranslations("settings.promo");
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 p-5 text-white">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
          <Sparkles className="h-6 w-6" />
        </div>
        <h3 className="font-semibold">{t("card_title")}</h3>
        <p className="mt-1 text-sm text-white/80">{t("card_description")}</p>
        <Button
          onClick={() => setDialogOpen(true)}
          className="mt-4 w-full bg-white text-purple-600 hover:bg-white/90 md:w-auto"
        >
          {t("card_button")}
        </Button>
      </div>

      <BeautyPagePromoDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
