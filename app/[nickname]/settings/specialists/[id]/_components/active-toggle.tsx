"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Switch } from "@/lib/ui/switch";
import { updateSpecialistProfile } from "../../_actions";

interface ActiveToggleProps {
  specialistId: string;
  isActive: boolean;
  beautyPageId: string;
  nickname: string;
}

export function ActiveToggle({
  specialistId,
  isActive: initialIsActive,
  beautyPageId,
  nickname,
}: ActiveToggleProps) {
  const t = useTranslations("specialists");
  const [isActive, setIsActive] = useState(initialIsActive);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  function handleToggle(checked: boolean) {
    setServerError(null);
    setIsActive(checked);

    startTransition(async () => {
      const result = await updateSpecialistProfile({
        profileId: specialistId,
        beautyPageId,
        isActive: checked,
        nickname,
      });

      if (!result.success) {
        // Revert on error
        setIsActive(!checked);
        setServerError(result.error);
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-medium">{t("is_active_label")}</p>
          <p className="text-sm text-muted">{t("is_active_description")}</p>
        </div>
        <Switch
          checked={isActive}
          onCheckedChange={handleToggle}
          disabled={isPending}
        />
      </div>
      {serverError && <p className="text-sm text-danger">{serverError}</p>}
    </div>
  );
}
