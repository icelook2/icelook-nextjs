"use client";

import { Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { SettingsItem } from "@/lib/ui/settings-item";

interface InvitationsSectionProps {
 pendingCount: number;
}

export function InvitationsSection({ pendingCount }: InvitationsSectionProps) {
 const t = useTranslations("settings");

 return (
 <div className="-mx-4 -my-4">
 <SettingsItem
 href="/settings/invitations"
 icon={Mail}
 title={t("view_invitations")}
 description={
 pendingCount > 0
 ? t("pending_invitations_count", { count: pendingCount })
 : t("no_pending_invitations")
 }
 variant="inline"
 badge={
 pendingCount > 0 ? (
 <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-medium text-background">
 {pendingCount}
 </span>
 ) : undefined
 }
 />
 </div>
 );
}
