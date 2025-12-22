"use client";

import { Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { AdminMember } from "@/lib/queries";
import { Avatar } from "@/lib/ui/avatar";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { addAdminRole } from "../_actions";

interface AddAdminDialogProps {
  specialists: AdminMember[];
  beautyPageId: string;
  nickname: string;
}

export function AddAdminDialog({
  specialists,
  beautyPageId,
  nickname,
}: AddAdminDialogProps) {
  const t = useTranslations("admins");
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
      const result = await addAdminRole({
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

  if (specialists.length === 0) {
    return null;
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Button onClick={() => setOpen(true)} size="sm" variant="secondary">
        <Shield className="mr-2 h-4 w-4" />
        {t("add_from_specialists")}
      </Button>

      <Dialog.Portal open={open} size="sm">
        <Dialog.Header onClose={() => setOpen(false)}>
          {t("add_admin_title")}
        </Dialog.Header>
        <Dialog.Body>
          <p className="mb-4 text-sm text-">{t("add_admin_description")}</p>

          <div className="space-y-2">
            {specialists.map((specialist) => {
              const profile = specialist.profiles;
              const isLoading = isPending && selectedId === specialist.id;

              return (
                <div
                  key={specialist.id}
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
                    onClick={() => handlePromote(specialist.id)}
                    loading={isLoading}
                    disabled={isPending}
                  >
                    {t("make_admin")}
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
