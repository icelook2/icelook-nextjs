import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface SettingsItemProps {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
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
  disabled = false,
  badge,
  iconClassName = "bg-accent-soft text-accent",
  variant = "card",
  noBorder = false,
  onClick,
}: SettingsItemProps) {
  const content = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconClassName}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
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
