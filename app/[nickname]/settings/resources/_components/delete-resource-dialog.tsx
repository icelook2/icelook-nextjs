"use client";

import { useTransition } from "react";
import type { ResourceWithStatus } from "@/lib/types/resources";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { deleteResource } from "../_actions/resource.actions";
import { formatStockWithUnit } from "../_lib/constants";

interface DeleteResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: ResourceWithStatus | null;
  beautyPageId: string;
  nickname: string;
  translations: {
    deleteConfirmTitle: string;
    deleteConfirmDescription: string;
    deleteConfirmButton: string;
    cancel: string;
  };
}

export function DeleteResourceDialog({
  open,
  onOpenChange,
  resource,
  beautyPageId,
  nickname,
  translations: t,
}: DeleteResourceDialogProps) {
  const [isPending, startTransition] = useTransition();

  if (!resource) {
    return null;
  }

  function handleDelete() {
    if (!resource) {
      return;
    }

    startTransition(async () => {
      const result = await deleteResource({
        resourceId: resource.id,
        beautyPageId,
        nickname,
      });

      if (result.success) {
        onOpenChange(false);
      }
    });
  }

  const description = t.deleteConfirmDescription.replace(
    "{name}",
    resource.name,
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal open={open} size="sm">
        <Dialog.Header>{t.deleteConfirmTitle}</Dialog.Header>

        <Dialog.Body>
          <p className="text-sm text-muted">{description}</p>

          <div className="mt-4 p-3 bg-muted/10 rounded-lg">
            <p className="font-medium">{resource.name}</p>
            <p className="text-sm text-muted">
              {formatStockWithUnit(resource.current_stock, resource.unit)}
            </p>
          </div>
        </Dialog.Body>

        <Dialog.Footer>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={isPending}>
            {t.deleteConfirmButton}
          </Button>
        </Dialog.Footer>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
