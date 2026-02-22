"use client";

import { AlertTriangle, Package } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { Service } from "@/lib/queries";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { toggleServiceVisibility } from "../_actions";

interface AffectedBundle {
  id: string;
  name: string;
}

interface HideServiceDialogProps {
  service: Service;
  groupId: string;
  nickname: string;
  affectedBundles: AffectedBundle[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function HideServiceDialog({
  service,
  groupId,
  nickname,
  affectedBundles,
  open,
  onOpenChange,
  onSuccess,
}: HideServiceDialogProps) {
  const t = useTranslations("service_groups");
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  function handleOpenChange(newOpen: boolean) {
    onOpenChange(newOpen);
    if (!newOpen) {
      setServerError(null);
    }
  }

  function handleConfirm() {
    setServerError(null);

    startTransition(async () => {
      const result = await toggleServiceVisibility({
        id: service.id,
        isHidden: true,
        nickname,
        groupId,
        bundleIdsToDeactivate: affectedBundles.map((b) => b.id),
      });

      if (result.success) {
        onOpenChange(false);
        onSuccess();
      } else {
        setServerError(result.error);
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal open={open} size="sm">
        <Dialog.Header onClose={() => onOpenChange(false)}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {t("hide_service_bundles_title")}
          </div>
        </Dialog.Header>
        <Dialog.Body>
          <div className="space-y-4">
            <p className="text-muted">
              {t("hide_service_bundles_description", { name: service.name })}
            </p>

            <div className="rounded-lg border border-border bg-surface-secondary p-3">
              <p className="mb-2 text-sm font-medium">
                {t("affected_bundles", { count: affectedBundles.length })}
              </p>
              <ul className="space-y-2">
                {affectedBundles.map((bundle) => (
                  <li key={bundle.id} className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted" />
                    <span className="text-sm">{bundle.name}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-sm text-muted">
              {t("hide_service_bundles_hint")}
            </p>

            {serverError && (
              <p className="text-sm text-danger">{serverError}</p>
            )}
          </div>
        </Dialog.Body>
        <Dialog.Footer className="justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button variant="primary" onClick={handleConfirm} loading={isPending}>
            {t("hide_and_deactivate")}
          </Button>
        </Dialog.Footer>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
