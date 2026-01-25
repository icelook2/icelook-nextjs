import type { LucideIcon } from "lucide-react";
import { CalendarDays, Search } from "lucide-react";
import type { UserRole } from "./active-beauty-page-context";

/** Context for dynamic route generation */
export interface NavContext {
  /** Active beauty page nickname (slug) */
  activeNickname: string | null;
}

/** Navigation item with role-based visibility */
export interface NavItem {
  /** Static path or function to generate path from context */
  href: string | ((context: NavContext) => string);
  labelKey: string;
  icon: LucideIcon;
  /** Which roles can see this item */
  roles: UserRole[];
}

export const navItems: NavItem[] = [
  // Appointments - creator only, dynamic route
  {
    href: (ctx) => `/${ctx.activeNickname}/appointments`,
    labelKey: "nav.schedule",
    icon: CalendarDays,
    roles: ["creator"],
  },
  // Search - both roles
  {
    href: "/search",
    labelKey: "nav.search",
    icon: Search,
    roles: ["client", "creator"],
  },
  // Appointments - client only
  {
    href: "/appointments",
    labelKey: "nav.appointments",
    icon: CalendarDays,
    roles: ["client"],
  },
];

/** Helper to filter nav items by role and resolve dynamic hrefs */
export function getNavItemsForRole(
  role: UserRole,
  context: NavContext,
): Array<{ item: NavItem; resolvedHref: string }> {
  return navItems
    .filter((item) => item.roles.includes(role))
    .map((item) => ({
      item,
      resolvedHref:
        typeof item.href === "function" ? item.href(context) : item.href,
    }));
}
