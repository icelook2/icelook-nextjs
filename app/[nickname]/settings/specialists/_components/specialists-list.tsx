"use client";

import { ChevronRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { SpecialistWithMember } from "@/lib/queries/specialists";
import { Avatar } from "@/lib/ui/avatar";
import { SettingsRow } from "@/lib/ui/settings-group";

interface SpecialistsListProps {
  specialists: SpecialistWithMember[];
  nickname: string;
}

export function SpecialistsList({
  specialists,
  nickname,
}: SpecialistsListProps) {
  const t = useTranslations("specialists");

  if (specialists.length === 0) {
    return (
      <SettingsRow>
        <div className="py-4 text-center">
          <p className="text-sm text-muted">{t("no_specialists")}</p>
        </div>
      </SettingsRow>
    );
  }

  return (
    <>
      {specialists.map((specialist, index) => (
        <SpecialistRow
          key={specialist.id}
          specialist={specialist}
          nickname={nickname}
          noBorder={index === specialists.length - 1}
        />
      ))}
    </>
  );
}

function SpecialistRow({
  specialist,
  nickname,
  noBorder,
}: {
  specialist: SpecialistWithMember;
  nickname: string;
  noBorder: boolean;
}) {
  const t = useTranslations("specialists");
  const member = specialist.beauty_page_members;
  const userProfile = member.profiles;

  // Use specialist's custom display name if set, otherwise user's name
  const displayName =
    specialist.display_name ||
    userProfile?.full_name ||
    t("unnamed_specialist");
  const avatarUrl = specialist.avatar_url || userProfile?.avatar_url;

  return (
    <SettingsRow noBorder={noBorder}>
      <Link
        href={`/${nickname}/settings/specialists/${specialist.id}`}
        className="flex items-center justify-between"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar url={avatarUrl} name={displayName} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-medium">{displayName}</p>
              {specialist.is_active ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-500/20 dark:text-green-400">
                  <Eye className="h-3 w-3" />
                  {t("active")}
                </span>
              ) : (
                <span className="inline-flex shrink-0 items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-500/20 dark:text-gray-400">
                  <EyeOff className="h-3 w-3" />
                  {t("inactive")}
                </span>
              )}
            </div>
            <p className="truncate text-xs text-muted">
              {userProfile?.email ?? t("no_email")}
            </p>
          </div>
        </div>
        <ChevronRight className="ml-2 h-4 w-4 shrink-0 text-muted" />
      </Link>
    </SettingsRow>
  );
}
