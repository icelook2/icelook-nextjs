"use client";

import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { InvitationWithBeautyPage } from "@/lib/queries";
import { Avatar } from "@/lib/ui/avatar";
import { Button } from "@/lib/ui/button";
import { SettingsRow } from "@/lib/ui/settings-group";
import { acceptInvitation, declineInvitation } from "../_actions";

interface InvitationCardProps {
  invitation: InvitationWithBeautyPage;
  noBorder?: boolean;
}

function formatRoles(
  roles: ("admin" | "specialist")[],
  t: ReturnType<typeof useTranslations>,
): string {
  return roles.map((role) => t(`role_${role}`)).join(" & ");
}

export function InvitationCard({ invitation, noBorder }: InvitationCardProps) {
  const t = useTranslations("invitations");
  const [isAccepting, startAccepting] = useTransition();
  const [isDeclining, startDeclining] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAccept() {
    setError(null);
    startAccepting(async () => {
      const result = await acceptInvitation(invitation.id);
      if (!result.success) {
        setError(result.error);
      }
    });
  }

  function handleDecline() {
    setError(null);
    startDeclining(async () => {
      const result = await declineInvitation(invitation.id);
      if (!result.success) {
        setError(result.error);
      }
    });
  }

  const isPending = isAccepting || isDeclining;
  const beautyPage = invitation.beauty_pages;
  const inviterName = invitation.invited_by_profile?.full_name ?? t("someone");

  return (
    <SettingsRow noBorder={noBorder}>
      <div className="space-y-4">
        {/* Header with avatar, name, slug and date */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar
              url={beautyPage.logo_url}
              name={beautyPage.name}
              size="md"
              shape="rounded"
            />
            <div>
              <p className="font-semibold">{beautyPage.name}</p>
              <p className="text-sm text-muted">@{beautyPage.slug}</p>
            </div>
          </div>
          <time className="shrink-0 text-xs text-muted">
            {new Date(invitation.created_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </time>
        </div>

        {/* Full invitation text */}
        <p className="text-sm text-muted">
          {t("invitation_description", {
            beautyPage: beautyPage.name,
            roles: formatRoles(invitation.roles, t),
            inviter: inviterName,
          })}
        </p>

        {error && <p className="text-sm text-danger">{error}</p>}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleAccept}
            loading={isAccepting}
            disabled={isPending}
          >
            <Check className="h-4 w-4" />
            {t("accept")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDecline}
            loading={isDeclining}
            disabled={isPending}
          >
            <X className="h-4 w-4" />
            {t("decline")}
          </Button>
        </div>
      </div>
    </SettingsRow>
  );
}
