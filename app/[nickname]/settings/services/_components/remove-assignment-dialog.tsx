"use client";

import { X } from "lucide-react";
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
  nickname: string;
}

export function RemoveAssignmentDialog({
  assignmentId,
  specialistName,
  serviceName,
  serviceId,
  nickname,
}: RemoveAssignmentDialogProps) {
  const t = useTranslations("services");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  function handleRemove() {
    setServerError(null);

    startTransition(async () => {
      const result = await removeAssignment({
        id: assignmentId,
        serviceId,
        nickname,
      });

      if (result.success) {
        setOpen(false);
      } else {
        setServerError(result.error);
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded p-0.5 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>

      <Dialog.Portal open={open} size="sm">
        <Dialog.Header onClose={() => setOpen(false)}>
          {t("remove_assignment_title")}
        </Dialog.Header>
        <Dialog.Body>
          <div className="space-y-4">
            <p className="text-">
              {t("remove_assignment_confirm", {
                specialist: specialistName,
                service: serviceName,
              })}
            </p>

            {serverError && <p className="text-sm text-">{serverError}</p>}
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
