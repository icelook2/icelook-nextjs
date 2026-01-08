import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface SettingsItemProps {
  href: string;
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Display a value below the title (alternative to description, styled for data display) */
  value?: string;
  disabled?: boolean;
  badge?: ReactNode;
  iconClassName?: string;
  variant?: "card" | "inline" | "grouped";
  noBorder?: boolean;
  onClick?: () => void;
}

export function SettingsItem({
  href,
  icon: Icon,
  title,
  description,
  value,
  disabled = false,
  badge,
  iconClassName = "bg-accent-soft text-accent",
  variant = "card",
  noBorder = false,
  onClick,
}: SettingsItemProps) {
  const content = (
    <div className="flex items-center justify-between">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{title}</p>
          {value ? (
            <p className="truncate text-sm text-muted">{value}</p>
          ) : description ? (
            <p className="text-sm text-muted">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {badge}
        <ChevronRight className="h-5 w-5 text-muted" />
      </div>
    </div>
  );

  const containerClasses = cn("block transition-colors", {
    "rounded-xl border border-border bg-surface p-4 hover:bg-black/5 dark:hover:bg-white/5":
      variant === "card",
    "p-4": variant === "inline",
    "px-4 py-4": variant === "grouped",
    "border-b border-border last:border-b-0":
      variant === "grouped" && !noBorder,
  });

  if (disabled) {
    return (
      <div className={cn(containerClasses, "cursor-not-allowed opacity-50")}>
        {content}
      </div>
    );
  }

  return (
    <Link href={href} onClick={onClick} className={containerClasses}>
      {content}
    </Link>
  );
}
