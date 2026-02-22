"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { Service } from "@/lib/queries";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { deleteService } from "../_actions";

interface DeleteServiceDialogProps {
  service: Service;
  nickname: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteServiceDialog({
  service,
  nickname,
  open,
  onOpenChange,
}: DeleteServiceDialogProps) {
  const t = useTranslations("service_groups");
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  function handleOpenChange(newOpen: boolean) {
    onOpenChange(newOpen);
    if (!newOpen) {
      setServerError(null);
    }
  }

  function handleDelete() {
    setServerError(null);

    startTransition(async () => {
      const result = await deleteService({
        id: service.id,
        nickname,
      });

      if (result.success) {
        onOpenChange(false);
      } else {
        setServerError(result.error);
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal open={open} size="sm">
        <Dialog.Header onClose={() => onOpenChange(false)}>
          {t("delete_service_title")}
        </Dialog.Header>
        <Dialog.Body>
          <p className="text-sm text-muted">
            {t("delete_service_confirmation", { name: service.name })}
          </p>

          {serverError && (
            <p className="mt-4 text-sm text-danger">{serverError}</p>
          )}
        </Dialog.Body>
        <Dialog.Footer className="justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={isPending}>
            {t("delete")}
          </Button>
        </Dialog.Footer>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
