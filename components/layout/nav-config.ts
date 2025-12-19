import { CalendarDays, Home, Search, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
}

export const mainNavItems: NavItem[] = [
  { href: "/", labelKey: "nav.home", icon: Home },
  { href: "/search", labelKey: "nav.search", icon: Search },
  { href: "/appointments", labelKey: "nav.appointments", icon: CalendarDays },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
];
