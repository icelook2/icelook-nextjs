"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { removeAssignment } from "../_actions";

interface RemoveAssignmentDialogProps {
  assignmentId: string;
  specialistName: string;
  serviceName: string;
  serviceId: string;
  groupId: string;
  nickname: string;
}

export function RemoveAssignmentDialog({
  assignmentId,
  specialistName,
  serviceName,
  serviceId,
  groupId,
  nickname,
}: RemoveAssignmentDialogProps) {
  const t = useTranslations("service_groups");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen);
    if (!newOpen) {
      setServerError(null);
    }
  }

  function handleRemove() {
    setServerError(null);

    startTransition(async () => {
      const result = await removeAssignment({
        id: assignmentId,
        serviceId,
        groupId,
        nickname,
      });

      if (result.success) {
        setOpen(false);
        router.push(
          `/${nickname}/settings/service-groups/${groupId}/services/${serviceId}`,
        );
      } else {
        setServerError(result.error);
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" />
        {t("remove")}
      </Button>

      <Dialog.Portal open={open} size="sm">
        <Dialog.Header onClose={() => setOpen(false)}>
          {t("remove_assignment_title")}
        </Dialog.Header>
        <Dialog.Body>
          <div className="space-y-4">
            <p>
              {t("remove_assignment_confirm", {
                specialist: specialistName,
                service: serviceName,
              })}
            </p>

            {serverError && (
              <p className="text-sm text-danger">{serverError}</p>
            )}
          </div>
        </Dialog.Body>
        <Dialog.Footer className="justify-end">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t("cancel")}
          </Button>
          <Button variant="danger" onClick={handleRemove} loading={isPending}>
            {t("remove")}
          </Button>
        </Dialog.Footer>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
