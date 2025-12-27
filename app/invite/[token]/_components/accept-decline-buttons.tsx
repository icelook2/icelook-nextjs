"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/lib/ui/button";
import { acceptInvitation, declineInvitation } from "./actions";

interface AcceptDeclineButtonsProps {
  invitationId: string;
  beautyPageSlug: string;
}

export function AcceptDeclineButtons({
  invitationId,
  beautyPageSlug,
}: AcceptDeclineButtonsProps) {
  const t = useTranslations("invite");
  const router = useRouter();
  const [isAccepting, startAccepting] = useTransition();
  const [isDeclining, startDeclining] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAccept() {
    setError(null);
    startAccepting(async () => {
      const result = await acceptInvitation(invitationId);
      if (result.success) {
        router.push(`/${beautyPageSlug}`);
      } else {
        setError(result.error);
      }
    });
  }

  function handleDecline() {
    setError(null);
    startDeclining(async () => {
      const result = await declineInvitation(invitationId);
      if (result.success) {
        router.push("/settings/invitations");
      } else {
        setError(result.error);
      }
    });
  }

  const isPending = isAccepting || isDeclining;

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-">{error}</p>}

      <div className="flex gap-3">
        <Button
          className="flex-1"
          onClick={handleAccept}
          loading={isAccepting}
          disabled={isPending}
        >
          <Check className="mr-2 h-4 w-4" />
          {t("accept")}
        </Button>
        <Button
          variant="ghost"
          className="flex-1"
          onClick={handleDecline}
          loading={isDeclining}
          disabled={isPending}
        >
          <X className="mr-2 h-4 w-4" />
          {t("decline")}
        </Button>
      </div>
    </div>
  );
}
