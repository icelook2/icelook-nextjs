"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Specialty } from "@/app/(main)/settings/become-specialist/_lib/types";

interface ProfileHeaderProps {
  displayName: string;
  username: string;
  bio: string | null;
  specialty: Specialty;
  isOwner?: boolean;
}

export function ProfileHeader({
  displayName,
  username,
  bio,
  specialty,
  isOwner = false,
}: ProfileHeaderProps) {
  const tSpecialties = useTranslations("specialist.specialties");
  const t = useTranslations("specialist.profile");

  return (
    <div className="relative text-center space-y-3">
      {/* Settings button - only visible to profile owner */}
      {isOwner && (
        <Link
          href={`/${username}/settings`}
          className="absolute right-0 top-0 p-2 rounded-lg text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-colors"
          aria-label={t("settings")}
        >
          <Settings className="h-5 w-5" />
        </Link>
      )}

      {/* Avatar placeholder - will be used when photos are supported */}
      <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center">
        <span className="text-3xl font-bold text-white">
          {displayName.charAt(0).toUpperCase()}
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
        <p className="text-sm text-foreground/60">@{username}</p>
      </div>

      <div className="inline-block rounded-full bg-violet-500/15 px-3 py-1 text-sm font-medium text-violet-600 dark:text-violet-400">
        {tSpecialties(specialty)}
      </div>

      {bio && (
        <p className="text-sm text-foreground/80 max-w-md mx-auto">{bio}</p>
      )}
    </div>
  );
}
