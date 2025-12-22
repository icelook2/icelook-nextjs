"use client";

import { Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { AdminMember } from "@/lib/queries";
import { Avatar } from "@/lib/ui/avatar";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { addSpecialistRole } from "../_actions";

interface AddSpecialistDialogProps {
  admins: AdminMember[];
  beautyPageId: string;
  nickname: string;
}

export function AddSpecialistDialog({
  admins,
  beautyPageId,
  nickname,
}: AddSpecialistDialogProps) {
  const t = useTranslations("specialists");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen);
    if (!newOpen) {
      setServerError(null);
      setSelectedId(null);
    }
  }

  function handlePromote(memberId: string) {
    setSelectedId(memberId);
    setServerError(null);

    startTransition(async () => {
      const result = await addSpecialistRole({
        memberId,
        beautyPageId,
        nickname,
      });

      if (result.success) {
        setOpen(false);
        setSelectedId(null);
      } else {
        setServerError(result.error);
        setSelectedId(null);
      }
    });
  }

  if (admins.length === 0) {
    return null;
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Button onClick={() => setOpen(true)} size="sm" variant="secondary">
        <Users className="mr-2 h-4 w-4" />
        {t("add_from_admins")}
      </Button>

      <Dialog.Portal open={open} size="sm">
        <Dialog.Header onClose={() => setOpen(false)}>
          {t("add_specialist_title")}
        </Dialog.Header>
        <Dialog.Body>
          <p className="mb-4 text-sm text-">
            {t("add_specialist_description")}
          </p>

          <div className="space-y-2">
            {admins.map((admin) => {
              const profile = admin.profiles;
              const isLoading = isPending && selectedId === admin.id;

              return (
                <div
                  key={admin.id}
                  className="flex items-center justify-between rounded-lg border  p-3 dark:"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      url={profile?.avatar_url}
                      name={profile?.full_name ?? "?"}
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-medium">
                        {profile?.full_name ?? t("unnamed_member")}
                      </p>
                      <p className="text-xs text-">
                        {profile?.email ?? t("no_email")}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handlePromote(admin.id)}
                    loading={isLoading}
                    disabled={isPending}
                  >
                    {t("make_specialist")}
                  </Button>
                </div>
              );
            })}
          </div>

          {serverError && <p className="mt-4 text-sm text-">{serverError}</p>}
        </Dialog.Body>
        <Dialog.Footer className="justify-end">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t("cancel")}
          </Button>
        </Dialog.Footer>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
