"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Switch } from "@/lib/ui/switch";
import { updateSpecialistProfile } from "../../_actions";

interface BusinessHoursRestrictionToggleProps {
  specialistId: string;
  restrictToBusinessHours: boolean;
  beautyPageId: string;
  nickname: string;
}

export function BusinessHoursRestrictionToggle({
  specialistId,
  restrictToBusinessHours: initialValue,
  beautyPageId,
  nickname,
}: BusinessHoursRestrictionToggleProps) {
  const t = useTranslations("specialists");
  const [restrictToBusinessHours, setRestrictToBusinessHours] =
    useState(initialValue);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  function handleToggle(checked: boolean) {
    setServerError(null);
    setRestrictToBusinessHours(checked);

    startTransition(async () => {
      const result = await updateSpecialistProfile({
        profileId: specialistId,
        beautyPageId,
        restrictToBusinessHours: checked,
        nickname,
      });

      if (!result.success) {
        // Revert on error
        setRestrictToBusinessHours(!checked);
        setServerError(result.error);
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-medium">{t("restrict_to_business_hours_label")}</p>
          <p className="text-sm text-muted">
            {t("restrict_to_business_hours_description")}
          </p>
        </div>
        <Switch
          checked={restrictToBusinessHours}
          onCheckedChange={handleToggle}
          disabled={isPending}
        />
      </div>
      {serverError && <p className="text-sm text-danger">{serverError}</p>}
    </div>
  );
}
