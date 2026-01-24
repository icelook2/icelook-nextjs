"use client";

import { Ban, Loader2, UserCheck } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { AlertDialog } from "@/lib/ui/alert-dialog";
import { Button } from "@/lib/ui/button";
import { SettingsGroup } from "@/lib/ui/settings-group";
import {
  blockClientAction,
  unblockClientAction,
} from "../../_actions/blocklist.actions";

interface BlockClientSectionProps {
  beautyPageId: string;
  clientId: string;
  clientName: string;
  isBlocked: boolean;
  blockedAt?: string | null;
  blockedUntil?: string | null;
  noShowCount?: number;
}

export function BlockClientSection({
  beautyPageId,
  clientId,
  clientName,
  isBlocked,
  blockedAt,
  blockedUntil,
  noShowCount = 0,
}: BlockClientSectionProps) {
  const t = useTranslations("clients.block_client");
  const format = useFormatter();
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showUnblockDialog, setShowUnblockDialog] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleBlock() {
    startTransition(async () => {
      const result = await blockClientAction(beautyPageId, clientId);

      if (result.success) {
        setShowBlockDialog(false);
      }
    });
  }

  function handleUnblock() {
    startTransition(async () => {
      await unblockClientAction(beautyPageId, clientId);
      setShowUnblockDialog(false);
    });
  }

  // Show blocked state with status info and unblock action
  if (isBlocked && blockedAt) {
    const blockedDate = new Date(blockedAt);
    const isPermanent = !blockedUntil;
    const isAutoBlocked = noShowCount > 0;

    // Build status description
    const statusParts: string[] = [];
    statusParts.push(
      t("blocked_since", {
        date: format.dateTime(blockedDate, {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      }),
    );

    if (!isPermanent && blockedUntil) {
      const untilDate = new Date(blockedUntil);
      statusParts.push(
        t("blocked_until_short", {
          date: format.dateTime(untilDate, {
            month: "short",
            day: "numeric",
          }),
        }),
      );
    }

    if (isAutoBlocked) {
      statusParts.push(t("no_shows", { count: noShowCount }));
    }

    return (
      <>
        <SettingsGroup>
          {/* Block status row */}
          <div className="flex items-center gap-3 border-b border-default p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              <Ban className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-red-600 dark:text-red-400">
                {isPermanent ? t("blocked_permanent") : t("blocked_temporary")}
              </p>
              <p className="text-sm text-muted">{statusParts.join(" · ")}</p>
            </div>
          </div>

          {/* Unblock action row */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">{t("unblock_title")}</p>
                <p className="text-sm text-muted">
                  {t("unblock_description_short")}
                </p>
              </div>
            </div>
            <Button
              variant="soft"
              onClick={() => setShowUnblockDialog(true)}
              className="text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30"
            >
              {t("unblock_button")}
            </Button>
          </div>
        </SettingsGroup>

        <AlertDialog.Root
          open={showUnblockDialog}
          onOpenChange={setShowUnblockDialog}
        >
          <AlertDialog.Portal open={showUnblockDialog}>
            <AlertDialog.Title>{t("unblock_dialog_title")}</AlertDialog.Title>
            <AlertDialog.Description>
              {t("unblock_dialog_description", { name: clientName })}
            </AlertDialog.Description>

            <AlertDialog.Actions>
              <AlertDialog.Close
                render={(props) => (
                  <Button {...props} variant="soft" disabled={isPending}>
                    {t("cancel")}
                  </Button>
                )}
              />
              <Button
                onClick={handleUnblock}
                disabled={isPending}
                className="bg-green-600 text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {t("confirm_unblock")}
              </Button>
            </AlertDialog.Actions>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      </>
    );
  }

  // Show block action for non-blocked clients
  return (
    <>
      <SettingsGroup>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              <Ban className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">{t("title")}</p>
              <p className="text-sm text-muted">{t("description")}</p>
            </div>
          </div>
          <Button
            variant="soft"
            onClick={() => setShowBlockDialog(true)}
            className="text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            {t("block_button")}
          </Button>
        </div>
      </SettingsGroup>

      <AlertDialog.Root
        open={showBlockDialog}
        onOpenChange={setShowBlockDialog}
      >
        <AlertDialog.Portal open={showBlockDialog}>
          <AlertDialog.Title>{t("dialog_title")}</AlertDialog.Title>
          <AlertDialog.Description>
            {t("dialog_description", { name: clientName })}
          </AlertDialog.Description>

          <AlertDialog.Actions>
            <AlertDialog.Close
              render={(props) => (
                <Button {...props} variant="soft" disabled={isPending}>
                  {t("cancel")}
                </Button>
              )}
            />
            <Button
              onClick={handleBlock}
              disabled={isPending}
              className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t("confirm_block")}
            </Button>
          </AlertDialog.Actions>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}
