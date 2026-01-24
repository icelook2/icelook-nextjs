"use client";

import { Ban, ChevronRight, Loader2, Trash2, UserX } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { BeautyPageClient } from "@/lib/queries/clients";
import { AlertDialog } from "@/lib/ui/alert-dialog";
import { Button } from "@/lib/ui/button";
import { SettingsGroup } from "@/lib/ui/settings-group";
import { unblockClientAction } from "../../clients/_actions/blocklist.actions";

// ============================================================================
// Types
// ============================================================================

interface BlockedClientsListProps {
  beautyPageId: string;
  blockedClients: BeautyPageClient[];
  nickname: string;
}

// ============================================================================
// Component
// ============================================================================

export function BlockedClientsList({
  beautyPageId,
  blockedClients,
  nickname,
}: BlockedClientsListProps) {
  const t = useTranslations("blocked_clients");

  // If no blocked clients, show empty state
  if (blockedClients.length === 0) {
    return (
      <SettingsGroup>
        <div className="p-8 text-center">
          <UserX className="mx-auto h-12 w-12 text-muted" />
          <h3 className="mt-4 font-semibold">{t("empty_title")}</h3>
          <p className="mt-2 text-sm text-muted">{t("empty_description")}</p>
        </div>
      </SettingsGroup>
    );
  }

  // Separate permanent blocks from temporary blocks
  const permanentBlocks = blockedClients.filter((c) => !c.blockedUntil);
  const temporaryBlocks = blockedClients.filter((c) => c.blockedUntil);

  return (
    <div className="space-y-4">
      {/* Permanently blocked clients */}
      {permanentBlocks.length > 0 && (
        <SettingsGroup title={t("permanent_blocks")}>
          {permanentBlocks.map((client, index) => (
            <BlockedClientRow
              key={client.clientId}
              beautyPageId={beautyPageId}
              client={client}
              nickname={nickname}
              noBorder={index === permanentBlocks.length - 1}
            />
          ))}
        </SettingsGroup>
      )}

      {/* Temporarily blocked clients */}
      {temporaryBlocks.length > 0 && (
        <SettingsGroup title={t("temporary_blocks")}>
          {temporaryBlocks.map((client, index) => (
            <BlockedClientRow
              key={client.clientId}
              beautyPageId={beautyPageId}
              client={client}
              nickname={nickname}
              noBorder={index === temporaryBlocks.length - 1}
            />
          ))}
        </SettingsGroup>
      )}
    </div>
  );
}

// ============================================================================
// Row Component
// ============================================================================

interface BlockedClientRowProps {
  beautyPageId: string;
  client: BeautyPageClient;
  nickname: string;
  noBorder?: boolean;
}

function BlockedClientRow({
  beautyPageId,
  client,
  nickname,
  noBorder,
}: BlockedClientRowProps) {
  const t = useTranslations("blocked_clients");
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  function handleUnblock() {
    startTransition(async () => {
      await unblockClientAction(beautyPageId, client.clientId);
      setShowConfirm(false);
    });
  }

  const blockedDate = client.blockedAt
    ? new Date(client.blockedAt).toLocaleDateString()
    : "";
  const blockedUntilDate = client.blockedUntil
    ? new Date(client.blockedUntil).toLocaleDateString()
    : null;

  return (
    <>
      <div
        className={`flex items-center justify-between ${!noBorder ? "border-b border-default" : ""}`}
      >
        <Link
          href={`/${nickname}/settings/blocked-clients/${client.clientId}`}
          className="flex min-w-0 flex-1 items-center gap-3 px-4 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            <Ban className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium">{client.clientName}</p>
            <p className="text-sm text-muted">
              {blockedUntilDate
                ? t("blocked_until_date", { date: blockedUntilDate })
                : t("blocked_on", { date: blockedDate })}
            </p>
            {client.noShowCount > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {t("no_show_count", { count: client.noShowCount })}
              </p>
            )}
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
        </Link>
        <div className="pr-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowConfirm(true)}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <AlertDialog.Root open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialog.Portal open={showConfirm}>
          <AlertDialog.Title>{t("unblock_title")}</AlertDialog.Title>
          <AlertDialog.Description>
            {t("unblock_description", { name: client.clientName })}
          </AlertDialog.Description>
          <AlertDialog.Actions>
            <AlertDialog.Close
              render={(props) => (
                <Button {...props} variant="soft">
                  {t("cancel")}
                </Button>
              )}
            />
            <Button onClick={handleUnblock} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t("unblock_action")}
            </Button>
          </AlertDialog.Actions>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}
