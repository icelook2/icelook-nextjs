"use client";

import { format } from "date-fns";
import { useTransition } from "react";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { deletePromotion } from "../_actions/promotion.actions";
import type { PromotionItem } from "../_lib/promotions-constants";

interface DeletePromotionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotion: PromotionItem | null;
  beautyPageId: string;
  nickname: string;
  translations: {
    deleteConfirmTitle: string;
    deleteConfirmDescription: string;
    deleteConfirmButton: string;
    cancel: string;
    typeSale: string;
    typeSlot: string;
    typeTime: string;
    untilDate: string;
    everyDay: string;
  };
  locale: string;
  currency: string;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatPrice(cents: number, locale: string, currency: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(dateString: string | null) {
  if (!dateString) return "";
  return format(new Date(dateString), "MMM d, yyyy");
}

function formatTime(timeString: string | null) {
  if (!timeString) return "";
  return timeString.substring(0, 5);
}

export function DeletePromotionDialog({
  open,
  onOpenChange,
  promotion,
  beautyPageId,
  nickname,
  translations: t,
  locale,
  currency,
}: DeletePromotionDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    if (!promotion) return;

    startTransition(async () => {
      const result = await deletePromotion({
        promotionId: promotion.id,
        beautyPageId,
        nickname,
      });

      if (result.success) {
        onOpenChange(false);
      }
    });
  }

  function getTypeLabel(type: string) {
    if (type === "sale") return t.typeSale;
    if (type === "slot") return t.typeSlot;
    return t.typeTime;
  }

  function getPromotionDetails(promo: PromotionItem): string {
    if (promo.type === "sale") {
      return `${t.untilDate} ${formatDate(promo.endsAt)}`;
    }
    if (promo.type === "slot") {
      return `${formatDate(promo.slotDate)}, ${formatTime(promo.slotStartTime)}`;
    }
    if (promo.type === "time") {
      const days =
        promo.recurringDays === null
          ? t.everyDay
          : promo.recurringDays.map((d) => DAY_NAMES[d]).join(", ");
      return `${days} @ ${formatTime(promo.recurringStartTime)}`;
    }
    return "";
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal open={open} size="sm">
        <Dialog.Header onClose={() => onOpenChange(false)}>
          {t.deleteConfirmTitle}
        </Dialog.Header>
        <Dialog.Body>
          <p className="text-muted">{t.deleteConfirmDescription}</p>
          {promotion && (
            <div className="mt-4 rounded-lg border border-border bg-muted/10 p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{promotion.service.name}</p>
                <span className="rounded-full bg-muted/30 px-2 py-0.5 text-xs">
                  {getTypeLabel(promotion.type)}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">
                {getPromotionDetails(promotion)}
              </p>
              <p className="mt-2 text-sm">
                <span className="text-muted line-through">
                  {formatPrice(promotion.originalPriceCents, locale, currency)}
                </span>{" "}
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {formatPrice(
                    promotion.discountedPriceCents,
                    locale,
                    currency,
                  )}{" "}
                  (-{promotion.discountPercentage}%)
                </span>
              </p>
            </div>
          )}
        </Dialog.Body>
        <Dialog.Footer className="justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>
          <Button variant="danger" loading={isPending} onClick={handleConfirm}>
            {t.deleteConfirmButton}
          </Button>
        </Dialog.Footer>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
