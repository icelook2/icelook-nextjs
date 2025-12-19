"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";
import { NavItem } from "./nav-item";
import { mainNavItems } from "./nav-config";

interface SidebarNavProps {
  collapsed?: boolean;
  className?: string;
}

export function SidebarNav({ collapsed = false, className }: SidebarNavProps) {
  const t = useTranslations();

  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {mainNavItems.map((item) => (
        <NavItem
          key={item.href}
          href={item.href}
          icon={item.icon}
          label={t(item.labelKey)}
          variant="sidebar"
          showLabel={!collapsed}
        />
      ))}
    </nav>
  );
}
