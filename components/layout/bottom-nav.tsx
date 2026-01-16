"use client";

import { useTranslations } from "next-intl";
import type { Profile } from "@/lib/auth/session";
import { cn } from "@/lib/utils/cn";
import { useActiveBeautyPage } from "./active-beauty-page-context";
import { CreatorAvatarNav } from "./creator-avatar-nav";
import { getNavItemsForRole, type NavContext } from "./nav-config";
import { BottomNavItem } from "./nav-item";
import { ProfileMenu } from "./profile-menu";

interface BottomNavProps {
  className?: string;
  profile: Profile | null;
}

/**
 * Mobile bottom navigation bar.
 *
 * Stacking order is handled via DOM order (no z-index needed):
 * - BottomNav is inside #root (rendered first)
 * - Dialog portals render to <body> after #root (appear above BottomNav)
 */
export function BottomNav({ className, profile }: BottomNavProps) {
  const t = useTranslations();
  const { role, activeBeautyPage } = useActiveBeautyPage();

  const navContext: NavContext = {
    activeNickname: activeBeautyPage?.slug ?? null,
  };

  const navItems = getNavItemsForRole(role, navContext);

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 flex h-16 items-center justify-around border-t border-border bg-surface",
        className,
      )}
    >
      {/* Avatar for creators (first item) */}
      <CreatorAvatarNav compact />

      {/* Nav items */}
      {navItems.map(({ item, resolvedHref }) => (
        <BottomNavItem
          key={resolvedHref}
          href={resolvedHref}
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
