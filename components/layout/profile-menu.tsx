import { CircleUser } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface SettingsNavLinkProps {
  profile: {
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;
  /** If true, displays in a compact mobile-friendly format */
  compact?: boolean;
}

export function SettingsNavLink({
  profile,
  compact = false,
}: SettingsNavLinkProps) {
  const t = useTranslations("nav");

  if (!profile) {
    return null;
  }

  return (
    <Link
      href="/settings"
      className={
        compact
          ? "flex items-center justify-center px-3 py-2 text-muted transition-colors hover:text-foreground"
          : "flex h-14 w-14 items-center justify-center rounded-2xl text-muted transition-all hover:bg-surface hover:text-foreground"
      }
      aria-label={t("settings")}
    >
      <CircleUser className={compact ? "h-6 w-6" : "h-7 w-7"} />
    </Link>
  );
}

// Keep old export name for backwards compatibility during migration
export { SettingsNavLink as ProfileMenu };
