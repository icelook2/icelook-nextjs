"use client";

import { useTranslations } from "next-intl";
import type { BeautyPageType } from "@/lib/queries";
import { SettingsGroup, SettingsRow } from "@/lib/ui/settings-group";
import { CreateBeautyPageSection } from "./create-beauty-page-section";
import { EmailChangeSection } from "./email-change-section";
import { InvitationsSection } from "./invitations-section";
import { ProfileSection } from "./profile-section";

interface SettingsFormProps {
 initialName: string;
 initialEmail: string;
 beautyPageTypes: BeautyPageType[];
 pendingInvitationsCount: number;
}

export function SettingsForm({
 initialName,
 initialEmail,
 beautyPageTypes,
 pendingInvitationsCount,
}: SettingsFormProps) {
 const t = useTranslations("settings");

 return (
 <div className="space-y-8">
 {/* Account Group */}
 <SettingsGroup title={t("account_group")}>
 <SettingsRow>
 <ProfileSection initialName={initialName} />
 </SettingsRow>
 <SettingsRow noBorder>
 <EmailChangeSection currentEmail={initialEmail} />
 </SettingsRow>
 </SettingsGroup>

 {/* Business Group */}
 <SettingsGroup title={t("business_group")}>
 <SettingsRow>
 <InvitationsSection pendingCount={pendingInvitationsCount} />
 </SettingsRow>
 <SettingsRow noBorder>
 <CreateBeautyPageSection beautyPageTypes={beautyPageTypes} />
 </SettingsRow>
 </SettingsGroup>
 </div>
 );
}
