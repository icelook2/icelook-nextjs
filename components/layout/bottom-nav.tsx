"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { Profile } from "@/lib/auth/session";
import { cn } from "@/lib/utils/cn";
import { mainNavItems } from "./nav-config";
import { BottomNavItem } from "./nav-item";
import { ProfileMenu } from "./profile-menu";

interface BottomNavProps {
  className?: string;
  beautyPagesCount?: number;
  profile: Profile | null;
}

export function BottomNav({
  className,
  beautyPagesCount = 0,
  profile,
}: BottomNavProps) {
  const t = useTranslations();

  const visibleItems = useMemo(() => {
    return mainNavItems.filter((item) => {
      if (item.requiresBeautyPages) {
        return beautyPagesCount > 0;
      }
      return true;
    });
  }, [beautyPagesCount]);

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border bg-surface",
        className,
      )}
    >
      {visibleItems.map((item) => (
        <BottomNavItem
          key={item.href}
          href={item.href}
          icon={item.icon}
          label={t(item.labelKey)}
        />
      ))}

      {/* Profile menu as last item */}
      {profile && (
        <div className="flex items-center justify-center">
          <ProfileMenu profile={profile} compact />
        </div>
      )}
    </nav>
  );
}
