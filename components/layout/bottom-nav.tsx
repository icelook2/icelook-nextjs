"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";
import { NavItem } from "./nav-item";
import { mainNavItems } from "./nav-config";

interface BottomNavProps {
  className?: string;
}

export function BottomNav({ className }: BottomNavProps) {
  const t = useTranslations();

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-foreground/10 bg-background",
        className,
      )}
    >
      {mainNavItems.map((item) => (
        <NavItem
          key={item.href}
          href={item.href}
          icon={item.icon}
          label={t(item.labelKey)}
          variant="bottom"
        />
      ))}
    </nav>
  );
}
