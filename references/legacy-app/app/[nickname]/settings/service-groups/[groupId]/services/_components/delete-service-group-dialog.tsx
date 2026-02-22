"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { ServiceGroupWithServices } from "@/lib/queries";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { deleteServiceGroup } from "../_actions";

interface DeleteServiceGroupDialogProps {
  serviceGroup: ServiceGroupWithServices;
  beautyPageId: string;
  nickname: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteServiceGroupDialog({
  serviceGroup,
  beautyPageId,
  nickname,
  open,
  onOpenChange,
}: DeleteServiceGroupDialogProps) {
  const t = useTranslations("service_groups");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const servicesCount = serviceGroup.services.length;

  function handleOpenChange(newOpen: boolean) {
    onOpenChange(newOpen);
    if (!newOpen) {
      setServerError(null);
    }
  }

  function handleDelete() {
    setServerError(null);

    startTransition(async () => {
      const result = await deleteServiceGroup({
        id: serviceGroup.id,
        beautyPageId,
        nickname,
      });

      if (result.success) {
        onOpenChange(false);
        router.push(`/${nickname}/settings/service-groups`);
      } else {
        setServerError(result.error);
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal open={open} size="sm">
        <Dialog.Header onClose={() => onOpenChange(false)}>
          {t("delete_group_title")}
        </Dialog.Header>
        <Dialog.Body>
          <div className="space-y-4">
            <p>{t("delete_group_confirm", { name: serviceGroup.name })}</p>

            {servicesCount > 0 && (
              <div className="rounded-lg border border-border bg-surface p-3">
                <p className="text-sm font-medium">
                  {t("delete_group_warning_title")}
                </p>
                <p className="mt-2 text-sm text-muted">
                  {t("delete_group_services_warning", {
                    count: servicesCount,
                  })}
                </p>
              </div>
            )}

            {serverError && (
              <p className="text-sm text-danger">{serverError}</p>
            )}
          </div>
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
