import type { LucideIcon } from "lucide-react";
import { CalendarDays, Home, Search, Store } from "lucide-react";

export interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  /** If true, this item requires beautyPagesCount > 0 to be visible */
  requiresBeautyPages?: boolean;
}

export const mainNavItems: NavItem[] = [
  { href: "/", labelKey: "nav.home", icon: Home },
  { href: "/search", labelKey: "nav.search", icon: Search },
  { href: "/appointments", labelKey: "nav.appointments", icon: CalendarDays },
  {
    href: "/beauty-pages",
    labelKey: "nav.beauty_pages",
    icon: Store,
    requiresBeautyPages: true,
  },
];
