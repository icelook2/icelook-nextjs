"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { InvitationWithInviter } from "@/lib/queries";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { SettingsGroup, SettingsRow } from "@/lib/ui/settings-group";

interface PendingInvitationsProps {
  invitations: InvitationWithInviter[];
  beautyPageId: string;
  nickname: string;
  translationKey: "admins" | "specialists";
  onRevoke: (params: {
    invitationId: string;
    beautyPageId: string;
    nickname: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

export function PendingInvitations({
  invitations,
  beautyPageId,
  nickname,
  translationKey,
  onRevoke,
}: PendingInvitationsProps) {
  const t = useTranslations(translationKey);

  if (invitations.length === 0) {
    return null;
  }

  return (
    <SettingsGroup
      title={`${t("pending_invitations")} (${invitations.length})`}
    >
      {invitations.map((invitation, index) => (
        <InvitationRow
          key={invitation.id}
          invitation={invitation}
          beautyPageId={beautyPageId}
          nickname={nickname}
          translationKey={translationKey}
          onRevoke={onRevoke}
          noBorder={index === invitations.length - 1}
        />
      ))}
    </SettingsGroup>
  );
}

function InvitationRow({
  invitation,
  beautyPageId,
  nickname,
  translationKey,
  onRevoke,
  noBorder,
}: {
  invitation: InvitationWithInviter;
  beautyPageId: string;
  nickname: string;
  translationKey: "admins" | "specialists";
  onRevoke: (params: {
    invitationId: string;
    beautyPageId: string;
    nickname: string;
  }) => Promise<{ success: boolean; error?: string }>;
  noBorder: boolean;
}) {
  const t = useTranslations(translationKey);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  function handleRevoke() {
    setServerError(null);

    startTransition(async () => {
      const result = await onRevoke({
        invitationId: invitation.id,
        beautyPageId,
        nickname,
      });

      if (result.success) {
        setDialogOpen(false);
      } else {
        setServerError(result.error ?? "An error occurred");
      }
    });
  }

  const invitedAt = new Date(invitation.created_at).toLocaleDateString();

  return (
    <SettingsRow noBorder={noBorder}>
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{invitation.email}</p>
          <p className="text-xs text-muted">
            {t("invited_on", { date: invitedAt })}
            {invitation.invited_by_profile?.full_name &&
              ` · ${t("invited_by", { name: invitation.invited_by_profile.full_name })}`}
          </p>
        </div>

        <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="ml-2 shrink-0 rounded p-1 transition-colors hover:bg-accent-soft/50 hover:text-danger"
          >
            <X className="h-4 w-4" />
          </button>

          <Dialog.Portal open={dialogOpen} size="sm">
            <Dialog.Header onClose={() => setDialogOpen(false)}>
              {t("revoke_invitation_title")}
            </Dialog.Header>
            <Dialog.Body>
              <p className="text-sm text-muted">
                {t("revoke_invitation_confirm", { email: invitation.email })}
              </p>
              {serverError && (
                <p className="mt-2 text-sm text-danger">{serverError}</p>
              )}
            </Dialog.Body>
            <Dialog.Footer className="justify-end">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                {t("cancel")}
              </Button>
              <Button
                variant="danger"
                onClick={handleRevoke}
                loading={isPending}
              >
                {t("revoke")}
              </Button>
            </Dialog.Footer>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </SettingsRow>
  );
}
