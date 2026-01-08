"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import { useActiveBeautyPage } from "./active-beauty-page-context";
import { CreatorAvatarNav } from "./creator-avatar-nav";
import { getNavItemsForRole, type NavContext } from "./nav-config";
import { NavItem } from "./nav-item";

interface SidebarNavProps {
  className?: string;
}

export function SidebarNav({ className }: SidebarNavProps) {
  const t = useTranslations();
  const { role, activeBeautyPage } = useActiveBeautyPage();

  const navContext: NavContext = useMemo(
    () => ({
      activeNickname: activeBeautyPage?.slug ?? null,
    }),
    [activeBeautyPage],
  );

  const navItems = useMemo(
    () => getNavItemsForRole(role, navContext),
    [role, navContext],
  );

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Avatar for creators (first item) */}
      <CreatorAvatarNav />

      {/* Regular nav items */}
      {navItems.map(({ item, resolvedHref }) => (
        <NavItem
          key={resolvedHref}
          href={resolvedHref}
          icon={item.icon}
          label={t(item.labelKey)}
        />
      ))}
    </div>
  );
}
