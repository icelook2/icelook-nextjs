"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { Service } from "@/lib/queries";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { deleteService } from "../_actions";

interface DeleteServiceDialogProps {
  service: Service;
  groupId: string;
  nickname: string;
  assignmentsCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteServiceDialog({
  service,
  groupId,
  nickname,
  assignmentsCount,
  open,
  onOpenChange,
}: DeleteServiceDialogProps) {
  const t = useTranslations("service_groups");
  const router = useRouter();
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
        groupId,
        nickname,
      });

      if (result.success) {
        onOpenChange(false);
        router.push(`/${nickname}/settings/service-groups/${groupId}/services`);
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
          <div className="space-y-4">
            <p>{t("delete_service_confirm", { name: service.name })}</p>

            {assignmentsCount > 0 && (
              <div className="rounded-lg border border-border bg-surface p-3">
                <p className="text-sm font-medium">
                  {t("delete_service_warning_title")}
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted">
                  <li>
                    •{" "}
                    {t("delete_service_assignments_warning", {
                      count: assignmentsCount,
                    })}
                  </li>
                </ul>
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
