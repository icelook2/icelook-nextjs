import Link from "next/link";
import { useTranslations } from "next-intl";
import { Settings } from "lucide-react";
import { Button } from "@/lib/ui/button";

interface OrganizationHeaderProps {
  name: string;
  slug: string;
  description: string | null;
  isOwner: boolean;
}

export function OrganizationHeader({
  name,
  slug,
  description,
  isOwner,
}: OrganizationHeaderProps) {
  const t = useTranslations("organization.profile");

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">{name}</h1>
          <p className="text-sm text-foreground/60">icelook.io/org/{slug}</p>
        </div>
        {isOwner && (
          <Button
            variant="ghost"
            size="sm"
            render={<Link href={`/settings/org/${slug}`} />}
          >
            <Settings className="h-4 w-4" />
            {t("settings")}
          </Button>
        )}
      </div>

      {description && (
        <p className="text-foreground/80">{description}</p>
      )}
    </div>
  );
}
