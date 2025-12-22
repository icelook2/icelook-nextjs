"use client";

import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { InvitationWithBeautyPage } from "@/lib/queries";
import { Button } from "@/lib/ui/button";
import { acceptInvitation, declineInvitation } from "../_actions";

interface InvitationCardProps {
 invitation: InvitationWithBeautyPage;
}

function formatRoles(
 roles: ("admin" | "specialist")[],
 t: ReturnType<typeof useTranslations>,
): string {
 return roles.map((role) => t(`role_${role}`)).join(" & ");
}

function formatDate(dateString: string): string {
 return new Date(dateString).toLocaleDateString(undefined, {
 month: "short",
 day: "numeric",
 year: "numeric",
 });
}

export function InvitationCard({ invitation }: InvitationCardProps) {
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

 return (
 <div className="rounded-xl border  p-4 dark:">
 <div className="mb-4">
 <h3 className="font-medium">
 {invitation.beauty_pages.name}
 </h3>
 <p className="text-sm">
 {t("invited_as", { roles: formatRoles(invitation.roles, t) })}
 </p>
 <p className="text-xs">
 {t("invited_by", {
 name: invitation.invited_by_profile?.full_name ?? t("someone"),
 })}{" "}
 · {formatDate(invitation.created_at)}
 </p>
 </div>

 {error && <p className="mb-3 text-sm text-">{error}</p>}

 <div className="flex gap-2">
 <Button
 size="sm"
 onClick={handleAccept}
 loading={isAccepting}
 disabled={isPending}
 >
 <Check className="mr-1 h-4 w-4" />
 {t("accept")}
 </Button>
 <Button
 variant="ghost"
 size="sm"
 onClick={handleDecline}
 loading={isDeclining}
 disabled={isPending}
 >
 <X className="mr-1 h-4 w-4" />
 {t("decline")}
 </Button>
 </div>
 </div>
 );
}
