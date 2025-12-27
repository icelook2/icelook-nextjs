"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { LabelWithAssignmentCount } from "@/lib/queries";
import { AlertDialog } from "@/lib/ui/alert-dialog";
import { Button } from "@/lib/ui/button";
import { deleteLabel } from "../_actions";

interface DeleteLabelDialogProps {
  label: LabelWithAssignmentCount;
  beautyPageId: string;
  nickname: string;
}

export function DeleteLabelDialog({
  label,
  beautyPageId,
  nickname,
}: DeleteLabelDialogProps) {
  const t = useTranslations("labels");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen);
    if (!newOpen) {
      setServerError(null);
    }
  }

  function handleDelete() {
    setServerError(null);

    startTransition(async () => {
      const result = await deleteLabel({
        labelId: label.id,
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

  return (
    <AlertDialog.Root open={open} onOpenChange={handleOpenChange}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        title={t("delete")}
      >
        <Trash2 className="h-4 w-4 text-danger" />
      </Button>

      <AlertDialog.Portal open={open}>
        <AlertDialog.Title>{t("delete_label_title")}</AlertDialog.Title>
        <AlertDialog.Description>
          {t("delete_label_description", { name: label.name })}
          {label.assignment_count > 0 && (
            <span className="mt-2 block text-muted">
              {t("delete_label_warning", { count: label.assignment_count })}
            </span>
          )}
          {serverError && (
            <span className="mt-2 block text-danger">{serverError}</span>
          )}
        </AlertDialog.Description>
        <AlertDialog.Actions>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t("cancel")}
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={isPending}>
            {t("delete")}
          </Button>
        </AlertDialog.Actions>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
