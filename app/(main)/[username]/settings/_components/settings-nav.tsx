"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { User, Briefcase, MessageSquare, Calendar, Eye, ClipboardList, Settings } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SettingsNavProps {
  username: string;
}

export function SettingsNav({ username }: SettingsNavProps) {
  const t = useTranslations("specialist.settings.nav");
  const pathname = usePathname();

  const baseUrl = `/@${username}/settings`;

  const navItems = [
    {
      href: `${baseUrl}/profile`,
      label: t("profile"),
      icon: User,
    },
    {
      href: `${baseUrl}/services`,
      label: t("services"),
      icon: Briefcase,
    },
    {
      href: `${baseUrl}/contacts`,
      label: t("contacts"),
      icon: MessageSquare,
    },
    {
      href: `${baseUrl}/schedule`,
      label: t("schedule"),
      icon: Calendar,
    },
    {
      href: `${baseUrl}/appointments`,
      label: t("appointments"),
      icon: ClipboardList,
    },
    {
      href: `${baseUrl}/booking`,
      label: t("booking"),
      icon: Settings,
    },
  ];

  return (
    <div className="space-y-3">
      <nav className="flex gap-2 overflow-x-auto">
        {navItems.map((item) => {
          // Check if this nav item is active
          const isActive =
            pathname === item.href ||
            pathname === item.href.replace("/@", "/") ||
            pathname.startsWith(item.href) ||
            pathname.startsWith(item.href.replace("/@", "/"));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-violet-500/15 text-violet-600 dark:text-violet-400"
                  : "bg-foreground/5 text-foreground/60 hover:bg-foreground/10",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Link
        href={`/@${username}`}
        className="flex items-center justify-center gap-2 text-sm text-foreground/60 hover:text-foreground transition-colors"
      >
        <Eye className="h-4 w-4" />
        {t("view_public_profile")}
      </Link>
    </div>
  );
}
