"use client";

import { Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/lib/ui/button";

interface EmailChangePendingProps {
  currentEmail: string;
  newEmail: string;
  onDone: () => void;
}

export function EmailChangePending({
  currentEmail,
  newEmail,
  onDone,
}: EmailChangePendingProps) {
  const t = useTranslations("settings");

  return (
    <div className="space-y-4 px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-accent-soft p-2">
          <Mail className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h3 className="font-medium">{t("email_change_pending")}</h3>
          <p className="text-sm text-muted">
            {t("email_change_pending_description", {
              currentEmail,
              newEmail,
            })}
          </p>
        </div>
      </div>

      <div className="space-y-2 rounded-lg bg-surface-muted p-3 text-sm">
        <p className="font-medium">{t("email_change_steps")}</p>
        <ol className="list-inside list-decimal space-y-1 text-muted">
          <li>{t("email_change_step_1", { email: currentEmail })}</li>
          <li>{t("email_change_step_2", { email: newEmail })}</li>
        </ol>
      </div>

      <Button type="button" variant="ghost" size="sm" onClick={onDone}>
        {t("done")}
      </Button>
    </div>
  );
}
