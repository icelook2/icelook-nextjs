"use client";

import { useTransition } from "react";
import type { ServiceBundleWithServices } from "@/lib/types/bundles";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { deleteBundle } from "../_actions/bundle.actions";
import { formatPrice } from "../_lib/bundles-constants";

interface DeleteBundleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bundle: ServiceBundleWithServices | null;
  beautyPageId: string;
  nickname: string;
  translations: {
    deleteConfirmTitle: string;
    deleteConfirmDescription: string;
    deleteConfirmButton: string;
    cancel: string;
    services: string;
  };
  locale: string;
  currency: string;
}

export function DeleteBundleDialog({
  open,
  onOpenChange,
  bundle,
  beautyPageId,
  nickname,
  translations: t,
  locale,
  currency,
}: DeleteBundleDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    if (!bundle) return;

    startTransition(async () => {
      const result = await deleteBundle({
        bundleId: bundle.id,
        beautyPageId,
        nickname,
      });

      if (result.success) {
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal open={open} size="sm">
        <Dialog.Header onClose={() => onOpenChange(false)}>
          {t.deleteConfirmTitle}
        </Dialog.Header>
        <Dialog.Body>
          <p className="text-muted">{t.deleteConfirmDescription}</p>
          {bundle && (
            <div className="mt-4 rounded-lg border border-border bg-muted/10 p-3">
              <p className="font-medium">{bundle.name}</p>
              <p className="text-sm text-muted">
                {bundle.services.length} {t.services}
              </p>
              <p className="text-sm">
                <span className="text-muted line-through">
                  {formatPrice(bundle.original_total_cents, locale, currency)}
                </span>{" "}
                <span className="font-medium text-violet-600 dark:text-violet-400">
                  {formatPrice(bundle.discounted_total_cents, locale, currency)}
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
