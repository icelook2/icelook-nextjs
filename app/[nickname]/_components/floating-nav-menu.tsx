"use client";

/**
 * Floating Navigation Menu
 *
 * A floating action button that opens a popover menu with navigation items.
 * Used on mobile when viewing a beauty page (replaces the fixed bottom nav).
 *
 * UX: Button fixed at bottom-right, menu appears above it when clicked.
 */

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useActiveBeautyPage } from "@/components/layout/active-beauty-page-context";
import { CreatorAvatarNav } from "@/components/layout/creator-avatar-nav";
import {
  getNavItemsForRole,
  type NavContext,
} from "@/components/layout/nav-config";
import { Popover } from "@/lib/ui/popover";
import { cn } from "@/lib/utils/cn";

export function FloatingNavMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations();
  const { role, activeBeautyPage } = useActiveBeautyPage();

  const navContext: NavContext = {
    activeNickname: activeBeautyPage?.slug ?? null,
  };

  const navItems = getNavItemsForRole(role, navContext);

  return (
    <div className="fixed bottom-6 right-4 sm:hidden">
      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        <Popover.Trigger
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all",
            "bg-accent text-on-accent",
            "hover:bg-accent/90 active:scale-95",
          )}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            side="top"
            align="end"
            sideOffset={12}
            className="min-w-48 p-1"
          >
            {/* Creator avatar link (if creator) */}
            {role === "creator" && activeBeautyPage && (
              <Link
                href={`/${activeBeautyPage.slug}`}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-hover"
              >
                <CreatorAvatarNav compact />
                <span className="text-sm font-medium">
                  {activeBeautyPage.name}
                </span>
              </Link>
            )}

            {/* Navigation items */}
            {navItems.map(({ item, resolvedHref }) => {
              const Icon = item.icon;
              return (
                <Link
                  key={resolvedHref}
                  href={resolvedHref}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-hover"
                >
                  <Icon className="h-5 w-5 text-muted" />
                  <span className="text-sm font-medium">
                    {t(item.labelKey)}
                  </span>
                </Link>
              );
            })}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
