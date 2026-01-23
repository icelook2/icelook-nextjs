"use client";

import { Ban, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { AlertDialog } from "@/lib/ui/alert-dialog";
import { Button } from "@/lib/ui/button";
import { SettingsGroup } from "@/lib/ui/settings-group";
import { blockClientAction } from "../../_actions/blocklist.actions";

interface BlockClientSectionProps {
  beautyPageId: string;
  clientId: string;
  clientName: string;
  isBlocked: boolean;
}

export function BlockClientSection({
  beautyPageId,
  clientId,
  clientName,
  isBlocked,
}: BlockClientSectionProps) {
  const t = useTranslations("clients.block_client");
  const [showDialog, setShowDialog] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleBlock() {
    startTransition(async () => {
      const result = await blockClientAction(beautyPageId, clientId);

      if (result.success) {
        setShowDialog(false);
      }
    });
  }

  // Don't show if already blocked
  if (isBlocked) {
    return (
      <SettingsGroup>
        <div className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            <Ban className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-red-600 dark:text-red-400">
              {t("already_blocked")}
            </p>
            <p className="text-sm text-muted">{t("already_blocked_description")}</p>
          </div>
        </div>
      </SettingsGroup>
    );
  }

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
            onClick={() => setShowDialog(true)}
            className="text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            {t("block_button")}
          </Button>
        </div>
      </SettingsGroup>

      <AlertDialog.Root open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialog.Portal open={showDialog}>
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
