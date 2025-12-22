"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { removeSpecialistRole } from "../../_actions";

interface RemoveSpecialistButtonProps {
  memberId: string;
  memberName: string;
  isAlsoAdmin: boolean;
  assignmentCount: number;
  beautyPageId: string;
  nickname: string;
}

export function RemoveSpecialistButton({
  memberId,
  memberName,
  isAlsoAdmin,
  assignmentCount,
  beautyPageId,
  nickname,
}: RemoveSpecialistButtonProps) {
  const t = useTranslations("specialists");
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  function handleRemove() {
    setServerError(null);

    startTransition(async () => {
      const result = await removeSpecialistRole({
        memberId,
        beautyPageId,
        nickname,
      });

      if (result.success) {
        router.push(`/${nickname}/settings/specialists`);
      } else {
        setServerError(result.error);
      }
    });
  }

  return (
    <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
      <Button
        variant="danger"
        onClick={() => setDialogOpen(true)}
        className="w-full"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        {t("remove_specialist")}
      </Button>

      <Dialog.Portal open={dialogOpen} size="sm">
        <Dialog.Header onClose={() => setDialogOpen(false)}>
          {t("remove_specialist_title")}
        </Dialog.Header>
        <Dialog.Body>
          <p className="text-">
            {isAlsoAdmin
              ? t("remove_specialist_confirm_keeps_admin", { name: memberName })
              : t("remove_specialist_confirm_removes_entirely", {
                  name: memberName,
                })}
          </p>

          {assignmentCount > 0 && (
            <p className="mt-2 text-sm">
              {t("services_warning", { count: assignmentCount })}
            </p>
          )}

          {serverError && <p className="mt-2 text-sm">{serverError}</p>}
        </Dialog.Body>
        <Dialog.Footer className="justify-end">
          <Button variant="ghost" onClick={() => setDialogOpen(false)}>
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
