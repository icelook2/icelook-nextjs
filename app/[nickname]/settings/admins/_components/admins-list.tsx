"use client";

import { Crown, MoreVertical, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { AdminMember } from "@/lib/queries";
import { Avatar } from "@/lib/ui/avatar";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { Popover } from "@/lib/ui/popover";
import { SettingsRow } from "@/lib/ui/settings-group";
import { removeAdminRole } from "../_actions";

interface AdminsListProps {
  admins: AdminMember[];
  ownerId: string;
  beautyPageId: string;
  nickname: string;
  currentUserId: string;
}

export function AdminsList({
  admins,
  ownerId,
  beautyPageId,
  nickname,
  currentUserId,
}: AdminsListProps) {
  const t = useTranslations("admins");

  if (admins.length === 0) {
    return (
      <SettingsRow>
        <div className="py-4 text-center">
          <p className="text-sm text-muted">{t("no_admins")}</p>
        </div>
      </SettingsRow>
    );
  }

  return (
    <>
      {admins.map((admin, index) => (
        <AdminRow
          key={admin.id}
          admin={admin}
          isOwner={admin.user_id === ownerId}
          isCurrentUser={admin.user_id === currentUserId}
          isAlsoSpecialist={admin.roles.includes("specialist")}
          beautyPageId={beautyPageId}
          nickname={nickname}
          noBorder={index === admins.length - 1}
        />
      ))}
    </>
  );
}

function AdminRow({
  admin,
  isOwner,
  isCurrentUser,
  isAlsoSpecialist,
  beautyPageId,
  nickname,
  noBorder,
}: {
  admin: AdminMember;
  isOwner: boolean;
  isCurrentUser: boolean;
  isAlsoSpecialist: boolean;
  beautyPageId: string;
  nickname: string;
  noBorder: boolean;
}) {
  const t = useTranslations("admins");
  const [popoverOpen, setPopoverOpen] = useState(false);

  const profile = admin.profiles;

  return (
    <SettingsRow noBorder={noBorder}>
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar
            url={profile?.avatar_url}
            name={profile?.full_name ?? "?"}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-medium">
                {profile?.full_name ?? t("unnamed_member")}
              </p>
              {isCurrentUser && (
                <span className="inline-flex shrink-0 rounded bg-accent-soft px-1.5 py-0.5 text-xs font-medium text-accent">
                  {t("you")}
                </span>
              )}
              {isOwner && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                  <Crown className="h-3 w-3" />
                  {t("owner")}
                </span>
              )}
            </div>
            <p className="truncate text-xs text-muted">
              {profile?.email ?? t("no_email")}
            </p>
          </div>
        </div>

        {!isOwner && (
          <Popover.Root open={popoverOpen} onOpenChange={setPopoverOpen}>
            <Popover.Trigger>
              <button
                type="button"
                className="ml-2 shrink-0 rounded p-1 transition-colors hover:bg-accent-soft/50"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content align="end" className="w-48 p-1">
                <RemoveAdminMenuItem
                  admin={admin}
                  isAlsoSpecialist={isAlsoSpecialist}
                  beautyPageId={beautyPageId}
                  nickname={nickname}
                  onClose={() => setPopoverOpen(false)}
                />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        )}
      </div>
    </SettingsRow>
  );
}

function RemoveAdminMenuItem({
  admin,
  isAlsoSpecialist,
  beautyPageId,
  nickname,
  onClose,
}: {
  admin: AdminMember;
  isAlsoSpecialist: boolean;
  beautyPageId: string;
  nickname: string;
  onClose: () => void;
}) {
  const t = useTranslations("admins");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  function handleOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      onClose();
      setServerError(null);
    }
  }

  function handleRemove() {
    setServerError(null);

    startTransition(async () => {
      const result = await removeAdminRole({
        memberId: admin.id,
        beautyPageId,
        nickname,
      });

      if (result.success) {
        setDialogOpen(false);
        onClose();
      } else {
        setServerError(result.error);
      }
    });
  }

  const profile = admin.profiles;

  return (
    <>
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-accent-soft"
      >
        <Trash2 className="h-4 w-4" />
        {t("remove_admin")}
      </button>

      <Dialog.Root open={dialogOpen} onOpenChange={handleOpenChange}>
        <Dialog.Portal open={dialogOpen} size="sm">
          <Dialog.Header onClose={() => handleOpenChange(false)}>
            {t("remove_admin_title")}
          </Dialog.Header>
          <Dialog.Body>
            <p className="text-sm text-muted">
              {isAlsoSpecialist
                ? t("remove_admin_confirm_keeps_specialist", {
                    name: profile?.full_name ?? t("unnamed_member"),
                  })
                : t("remove_admin_confirm_removes_entirely", {
                    name: profile?.full_name ?? t("unnamed_member"),
                  })}
            </p>
            {serverError && (
              <p className="mt-2 text-sm text-danger">{serverError}</p>
            )}
          </Dialog.Body>
          <Dialog.Footer className="justify-end">
            <Button variant="ghost" onClick={() => handleOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button variant="danger" onClick={handleRemove} loading={isPending}>
              {t("remove")}
            </Button>
          </Dialog.Footer>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
