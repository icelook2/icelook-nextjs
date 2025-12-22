"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { deleteService } from "../_actions";

interface DeleteServiceDialogProps {
  service: { id: string; name: string };
  serviceGroupId: string;
  nickname: string;
  assignmentsCount: number;
}

export function DeleteServiceDialog({
  service,
  serviceGroupId,
  nickname,
  assignmentsCount,
}: DeleteServiceDialogProps) {
  const t = useTranslations("services");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  function handleDelete() {
    setServerError(null);

    startTransition(async () => {
      const result = await deleteService({
        id: service.id,
        serviceGroupId,
        nickname,
      });

      if (result.success) {
        setOpen(false);
      } else {
        setServerError(result.error);
      }
    });
  }

  const hasAssignments = assignmentsCount > 0;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded p-1 transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <Dialog.Portal open={open} size="sm">
        <Dialog.Header onClose={() => setOpen(false)}>
          {t("delete_service_title")}
        </Dialog.Header>
        <Dialog.Body>
          <div className="space-y-4">
            <p>{t("delete_service_confirm", { name: service.name })}</p>

            {hasAssignments && (
              <div className="rounded-lg border p-3 text-sm">
                <p className="font-medium">
                  {t("delete_service_warning_title")}
                </p>
                <p className="mt-1">
                  {t("delete_service_assignments_warning", {
                    count: assignmentsCount,
                  })}
                </p>
              </div>
            )}

            {serverError && <p className="text-sm text-">{serverError}</p>}
          </div>
        </Dialog.Body>
        <Dialog.Footer className="justify-end">
          <Button variant="ghost" onClick={() => setOpen(false)}>
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
