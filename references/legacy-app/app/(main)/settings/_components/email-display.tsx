"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/lib/ui/button";

interface EmailDisplayProps {
  email: string;
  onChangeClick: () => void;
}

export function EmailDisplay({ email, onChangeClick }: EmailDisplayProps) {
  const t = useTranslations("settings");

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{t("email_label")}</p>
        <p className="truncate text-sm text-muted">{email}</p>
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={onChangeClick}
      >
        {t("change_email")}
      </Button>
    </div>
  );
}
