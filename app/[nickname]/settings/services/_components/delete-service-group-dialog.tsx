"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { deleteServiceGroup } from "../_actions";

interface DeleteServiceGroupDialogProps {
  serviceGroup: { id: string; name: string };
  beautyPageId: string;
  nickname: string;
  servicesCount: number;
  assignmentsCount: number;
}

export function DeleteServiceGroupDialog({
  serviceGroup,
  beautyPageId,
  nickname,
  servicesCount,
  assignmentsCount,
}: DeleteServiceGroupDialogProps) {
  const t = useTranslations("services");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  function handleDelete() {
    setServerError(null);

    startTransition(async () => {
      const result = await deleteServiceGroup({
        id: serviceGroup.id,
        beautyPageId,
        nickname,
      });

      if (result.success) {
        setOpen(false);
      } else {
        setServerError(result.error);
      }
    });
  }

  const hasServices = servicesCount > 0;
  const hasAssignments = assignmentsCount > 0;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg p-1.5 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <Dialog.Portal open={open} size="sm">
        <Dialog.Header onClose={() => setOpen(false)}>
          {t("delete_group_title")}
        </Dialog.Header>
        <Dialog.Body>
          <div className="space-y-4">
            <p>{t("delete_group_confirm", { name: serviceGroup.name })}</p>

            {(hasServices || hasAssignments) && (
              <div className="rounded-lg border p-3 text-sm">
                <p className="font-medium">{t("delete_group_warning_title")}</p>
                <ul className="mt-2 list-disc pl-4 space-y-1">
                  {hasServices && (
                    <li>
                      {t("delete_group_services_warning", {
                        count: servicesCount,
                      })}
                    </li>
                  )}
                  {hasAssignments && (
                    <li>
                      {t("delete_group_assignments_warning", {
                        count: assignmentsCount,
                      })}
                    </li>
                  )}
                </ul>
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
