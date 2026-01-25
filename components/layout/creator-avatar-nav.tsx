"use client";

import Link from "next/link";
import { Avatar } from "@/lib/ui/avatar";
import { useActiveBeautyPage } from "./active-beauty-page-context";

interface CreatorAvatarNavProps {
  /** If true, displays in a compact mobile-friendly format */
  compact?: boolean;
}

/**
 * Navigation avatar for creators that shows their active beauty page.
 * Click navigates to the public beauty page profile.
 */
export function CreatorAvatarNav({ compact = false }: CreatorAvatarNavProps) {
  const { activeBeautyPage, role } = useActiveBeautyPage();

  // Only render for creators
  if (role !== "creator" || !activeBeautyPage) {
    return null;
  }

  const displayName = activeBeautyPage.display_name ?? activeBeautyPage.name;

  return (
    <Link
      href={`/${activeBeautyPage.slug}`}
      title={displayName}
      className={
        compact
          ? "flex items-center justify-center px-3 py-2"
          : "group flex h-14 w-14 items-center justify-center rounded-2xl transition-all hover:bg-surface"
      }
    >
      <Avatar
        url={activeBeautyPage.avatar_url}
        name={activeBeautyPage.name}
        size="sm"
        shape="rounded"
      />
    </Link>
  );
}
