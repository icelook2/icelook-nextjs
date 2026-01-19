"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { cn } from "@/lib/utils/cn";

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  className?: string;
}

export function NavItem({ href, icon: Icon, label, className }: NavItemProps) {
  const segment = useSelectedLayoutSegment();

  // Check if current segment matches the nav item
  // Home is active when segment is null, others match their path segment
  const hrefSegment = href === "/" ? null : href.split("/")[1];
  const isActive = segment === hrefSegment;

  return (
    <Link
      href={href}
      title={label}
      className={cn(
        "group flex h-14 w-14 items-center justify-center rounded-2xl transition-all hover:bg-surface",
        isActive ? "text-accent" : "text-muted hover:text-foreground",
        className,
      )}
    >
      <Icon className="h-7 w-7" strokeWidth={isActive ? 2.5 : 2} />
    </Link>
  );
}

interface BottomNavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  className?: string;
}

export function BottomNavItem({
  href,
  icon: Icon,
  label,
  className,
}: BottomNavItemProps) {
  const segment = useSelectedLayoutSegment();
  const hrefSegment = href === "/" ? null : href.split("/")[1];
  const isActive = segment === hrefSegment;

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center gap-1 px-3 py-2 transition-colors",
        isActive ? "text-accent" : "text-muted",
        className,
      )}
    >
      <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
}
