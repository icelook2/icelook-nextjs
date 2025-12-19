"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const navItemVariants = cva(
  "flex items-center justify-center border-none outline-none ring-0 transition-colors focus-visible:ring-0",
  {
    variants: {
      variant: {
        sidebar:
          "w-full gap-3 rounded-lg px-3 py-2.5 hover:bg-foreground/5 dark:hover:bg-foreground/5",
        bottom:
          "flex-col gap-1 rounded-lg px-3 py-2 hover:bg-foreground/5 dark:hover:bg-foreground/5",
      },
      active: {
        true: "bg-violet-500/10 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
        false: "text-foreground/60",
      },
    },
    defaultVariants: {
      variant: "sidebar",
      active: false,
    },
  },
);

interface NavItemProps extends VariantProps<typeof navItemVariants> {
  href: string;
  icon: LucideIcon;
  label: string;
  showLabel?: boolean;
  className?: string;
}

export function NavItem({
  href,
  icon: Icon,
  label,
  variant,
  showLabel = true,
  className,
}: NavItemProps) {
  const pathname = usePathname();

  // Check if current path matches the nav item
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(navItemVariants({ variant, active: isActive }), className)}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {showLabel && (
        <span
          className={cn(
            "text-sm font-medium",
            variant === "bottom" && "text-xs",
          )}
        >
          {label}
        </span>
      )}
    </Link>
  );
}
