"use client";

import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { formatDuration, formatPrice } from "@/lib/appointments";
import { Button } from "@/lib/ui/button";
import { useServiceSelection } from "./service-selection-context";

interface BookSelectedButtonProps {
  onBook: () => void;
}

export function BookSelectedButton({ onBook }: BookSelectedButtonProps) {
  const t = useTranslations("booking");
  const { selectedServices, totals } = useServiceSelection();

  const hasSelection = selectedServices.length > 0 && totals !== null;

  return (
    <AnimatePresence>
      {hasSelection && totals && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
        >
          <div className="flex items-center gap-4 rounded-2xl border border-foreground/10 bg-background p-4 shadow-xl">
            <div className="text-sm">
              <p className="font-medium text-foreground">
                {selectedServices.length}{" "}
                {selectedServices.length === 1 ? t("service") : t("services")}
              </p>
              <p className="text-foreground/60">
                {formatDuration(totals.totalDurationMinutes)} ·{" "}
                {formatPrice(totals.totalPrice, totals.currency)}
              </p>
            </div>
            <Button onClick={onBook} variant="primary">
              {t("book")}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
