"use client";

import { Ban, Loader2, RotateCcw, Trash2, UserX } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { BlockedClient, ClientNoShow } from "@/lib/types/booking-restrictions";
import { AlertDialog } from "@/lib/ui/alert-dialog";
import { Button } from "@/lib/ui/button";
import { SettingsGroup } from "@/lib/ui/settings-group";
import {
  resetNoShowCountAction,
  unblockClientAction,
} from "../_actions/blocklist.actions";

// ============================================================================
// Types
// ============================================================================

interface BlockedClientWithInfo extends BlockedClient {
  clientDisplayName: string;
}

interface NoShowRecordWithInfo extends ClientNoShow {
  clientDisplayName: string;
}

interface BlockedClientsListProps {
  beautyPageId: string;
  blockedClients: BlockedClientWithInfo[];
  noShowRecords: NoShowRecordWithInfo[];
}

// ============================================================================
// Component
// ============================================================================

export function BlockedClientsList({
  beautyPageId,
  blockedClients,
  noShowRecords,
}: BlockedClientsListProps) {
  const t = useTranslations("clients.blocklist");

  // Filter no-show records that are actually blocked
  const blockedFromNoShows = noShowRecords.filter((r) => r.is_blocked);

  // If no blocked clients and no blocked no-shows, show empty state
  if (blockedClients.length === 0 && blockedFromNoShows.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="font-semibold">{t("title")}</h2>
        <SettingsGroup>
          <div className="p-8 text-center">
            <UserX className="mx-auto h-12 w-12 text-muted" />
            <h3 className="mt-4 font-semibold">{t("empty_title")}</h3>
            <p className="mt-2 text-sm text-muted">{t("empty_description")}</p>
          </div>
        </SettingsGroup>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">{t("title")}</h2>

      {/* Manually blocked clients */}
      {blockedClients.length > 0 && (
        <SettingsGroup>
          <div className="border-b border-default px-4 py-2">
            <p className="text-sm font-medium text-muted">
              {t("manual_blocks")}
            </p>
          </div>
          {blockedClients.map((client, index) => (
            <BlockedClientRow
              key={client.id}
              beautyPageId={beautyPageId}
              clientPhone={client.client_phone ?? ""}
              displayName={client.clientDisplayName}
              reason={client.reason}
              blockedAt={client.created_at}
              noBorder={index === blockedClients.length - 1}
            />
          ))}
        </SettingsGroup>
      )}

      {/* Auto-blocked from no-shows */}
      {blockedFromNoShows.length > 0 && (
        <SettingsGroup>
          <div className="border-b border-default px-4 py-2">
            <p className="text-sm font-medium text-muted">
              {t("no_show_blocks")}
            </p>
          </div>
          {blockedFromNoShows.map((record, index) => (
            <NoShowBlockedRow
              key={record.id}
              beautyPageId={beautyPageId}
              clientPhone={record.client_phone ?? ""}
              displayName={record.clientDisplayName}
              noShowCount={record.no_show_count}
              blockedUntil={record.blocked_until}
              noBorder={index === blockedFromNoShows.length - 1}
            />
          ))}
        </SettingsGroup>
      )}

      {/* No-show warnings (not blocked yet) */}
      {noShowRecords.filter((r) => !r.is_blocked && r.no_show_count > 0)
        .length > 0 && (
        <SettingsGroup>
          <div className="border-b border-default px-4 py-2">
            <p className="text-sm font-medium text-muted">
              {t("no_show_warnings")}
            </p>
          </div>
          {noShowRecords
            .filter((r) => !r.is_blocked && r.no_show_count > 0)
            .map((record, index, arr) => (
              <NoShowWarningRow
                key={record.id}
                beautyPageId={beautyPageId}
                clientPhone={record.client_phone ?? ""}
                displayName={record.clientDisplayName}
                noShowCount={record.no_show_count}
                noBorder={index === arr.length - 1}
              />
            ))}
        </SettingsGroup>
      )}
    </div>
  );
}

// ============================================================================
// Row Components
// ============================================================================

interface BlockedClientRowProps {
  beautyPageId: string;
  clientPhone: string;
  displayName: string;
  reason: string | null;
  blockedAt: string;
  noBorder?: boolean;
}

function BlockedClientRow({
  beautyPageId,
  clientPhone,
  displayName,
  reason,
  blockedAt,
  noBorder,
}: BlockedClientRowProps) {
  const t = useTranslations("clients.blocklist");
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  function handleUnblock() {
    startTransition(async () => {
      await unblockClientAction(beautyPageId, clientPhone);
      setShowConfirm(false);
    });
  }

  const blockedDate = new Date(blockedAt).toLocaleDateString();

  return (
    <>
      <div
        className={`flex items-center justify-between px-4 py-4 ${!noBorder ? "border-b border-default" : ""}`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            <Ban className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium">{displayName}</p>
            <p className="text-sm text-muted">
              {reason ?? t("blocked_on", { date: blockedDate })}
            </p>
          </div>
        </div>
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

      <AlertDialog.Root open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialog.Portal open={showConfirm}>
          <AlertDialog.Title>{t("unblock_title")}</AlertDialog.Title>
          <AlertDialog.Description>
            {t("unblock_description", { name: displayName })}
          </AlertDialog.Description>
          <AlertDialog.Actions>
            <AlertDialog.Close>
              <Button variant="soft">{t("cancel")}</Button>
            </AlertDialog.Close>
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

interface NoShowBlockedRowProps {
  beautyPageId: string;
  clientPhone: string;
  displayName: string;
  noShowCount: number;
  blockedUntil: string | null;
  noBorder?: boolean;
}

function NoShowBlockedRow({
  beautyPageId,
  clientPhone,
  displayName,
  noShowCount,
  blockedUntil,
  noBorder,
}: NoShowBlockedRowProps) {
  const t = useTranslations("clients.blocklist");
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  function handleForgive() {
    startTransition(async () => {
      await resetNoShowCountAction(beautyPageId, clientPhone);
      setShowConfirm(false);
    });
  }

  const untilDate = blockedUntil
    ? new Date(blockedUntil).toLocaleDateString()
    : null;

  return (
    <>
      <div
        className={`flex items-center justify-between px-4 py-4 ${!noBorder ? "border-b border-default" : ""}`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
            <UserX className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium">{displayName}</p>
            <p className="text-sm text-muted">
              {untilDate
                ? t("blocked_until", { date: untilDate, count: noShowCount })
                : t("blocked_permanently", { count: noShowCount })}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowConfirm(true)}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RotateCcw className="h-4 w-4" />
          )}
        </Button>
      </div>

      <AlertDialog.Root open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialog.Portal open={showConfirm}>
          <AlertDialog.Title>{t("forgive_title")}</AlertDialog.Title>
          <AlertDialog.Description>
            {t("forgive_description", { name: displayName })}
          </AlertDialog.Description>
          <AlertDialog.Actions>
            <AlertDialog.Close>
              <Button variant="soft">{t("cancel")}</Button>
            </AlertDialog.Close>
            <Button onClick={handleForgive} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t("forgive_action")}
            </Button>
          </AlertDialog.Actions>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}

interface NoShowWarningRowProps {
  beautyPageId: string;
  clientPhone: string;
  displayName: string;
  noShowCount: number;
  noBorder?: boolean;
}

function NoShowWarningRow({
  beautyPageId,
  clientPhone,
  displayName,
  noShowCount,
  noBorder,
}: NoShowWarningRowProps) {
  const t = useTranslations("clients.blocklist");
  const [isPending, startTransition] = useTransition();

  function handleReset() {
    startTransition(async () => {
      await resetNoShowCountAction(beautyPageId, clientPhone);
    });
  }

  return (
    <div
      className={`flex items-center justify-between px-4 py-4 ${!noBorder ? "border-b border-default" : ""}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
          <UserX className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{displayName}</p>
          <p className="text-sm text-muted">
            {t("no_show_warning", { count: noShowCount })}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleReset}
        disabled={isPending}
        title={t("reset_count")}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RotateCcw className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
