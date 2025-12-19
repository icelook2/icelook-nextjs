"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { SpecialistBookingSettings } from "@/lib/appointments";
import { Button } from "@/lib/ui/button";
import { Input } from "@/lib/ui/input";
import { Switch } from "@/lib/ui/switch";
import { updateBookingSettings } from "../_actions/booking-settings.action";

interface BookingSettingsFormProps {
  specialistId: string;
  initialSettings: SpecialistBookingSettings;
}

export function BookingSettingsForm({
  specialistId,
  initialSettings,
}: BookingSettingsFormProps) {
  const t = useTranslations("specialist.settings.booking_settings");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [autoConfirm, setAutoConfirm] = useState(initialSettings.auto_confirm);
  const [minNotice, setMinNotice] = useState(
    String(initialSettings.min_booking_notice_hours),
  );
  const [maxDays, setMaxDays] = useState(
    String(initialSettings.max_booking_days_ahead),
  );
  const [allowCancellation, setAllowCancellation] = useState(
    initialSettings.allow_client_cancellation,
  );
  const [cancellationNotice, setCancellationNotice] = useState(
    String(initialSettings.cancellation_notice_hours),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await updateBookingSettings({
        specialistId,
        settings: {
          auto_confirm: autoConfirm,
          min_booking_notice_hours: Math.max(0, parseInt(minNotice, 10) || 0),
          max_booking_days_ahead: Math.max(1, parseInt(maxDays, 10) || 30),
          allow_client_cancellation: allowCancellation,
          cancellation_notice_hours: Math.max(
            0,
            parseInt(cancellationNotice, 10) || 0,
          ),
        },
      });

      if (!result.success) {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Auto-confirm */}
      <div className="flex items-start justify-between gap-4 py-4 border-b border-foreground/10">
        <div>
          <span className="block text-sm font-medium text-foreground">
            {t("auto_confirm")}
          </span>
          <p className="text-xs text-foreground/60 mt-1">
            {t("auto_confirm_description")}
          </p>
        </div>
        <Switch
          checked={autoConfirm}
          onCheckedChange={setAutoConfirm}
          disabled={isPending}
        />
      </div>

      {/* Minimum booking notice */}
      <div className="py-4 border-b border-foreground/10">
        <label
          htmlFor="min-notice"
          className="block text-sm font-medium text-foreground mb-1"
        >
          {t("min_notice")}
        </label>
        <p className="text-xs text-foreground/60 mb-3">
          {t("min_notice_description")}
        </p>
        <div className="flex items-center gap-2">
          <Input
            id="min-notice"
            type="number"
            min="0"
            max="168"
            value={minNotice}
            onChange={(e) => setMinNotice(e.target.value)}
            className="w-24"
            disabled={isPending}
          />
          <span className="text-sm text-foreground/60">{t("hours")}</span>
        </div>
      </div>

      {/* Max booking days ahead */}
      <div className="py-4 border-b border-foreground/10">
        <label
          htmlFor="max-days"
          className="block text-sm font-medium text-foreground mb-1"
        >
          {t("max_days_ahead")}
        </label>
        <p className="text-xs text-foreground/60 mb-3">
          {t("max_days_ahead_description")}
        </p>
        <div className="flex items-center gap-2">
          <Input
            id="max-days"
            type="number"
            min="1"
            max="365"
            value={maxDays}
            onChange={(e) => setMaxDays(e.target.value)}
            className="w-24"
            disabled={isPending}
          />
          <span className="text-sm text-foreground/60">{t("days")}</span>
        </div>
      </div>

      {/* Allow client cancellation */}
      <div className="flex items-start justify-between gap-4 py-4 border-b border-foreground/10">
        <div>
          <span className="block text-sm font-medium text-foreground">
            {t("allow_cancellation")}
          </span>
          <p className="text-xs text-foreground/60 mt-1">
            {t("allow_cancellation_description")}
          </p>
        </div>
        <Switch
          checked={allowCancellation}
          onCheckedChange={setAllowCancellation}
          disabled={isPending}
        />
      </div>

      {/* Cancellation notice period */}
      {allowCancellation && (
        <div className="py-4 border-b border-foreground/10">
          <label
            htmlFor="cancellation-notice"
            className="block text-sm font-medium text-foreground mb-1"
          >
            {t("cancellation_notice")}
          </label>
          <p className="text-xs text-foreground/60 mb-3">
            {t("cancellation_notice_description")}
          </p>
          <div className="flex items-center gap-2">
            <Input
              id="cancellation-notice"
              type="number"
              min="0"
              max="168"
              value={cancellationNotice}
              onChange={(e) => setCancellationNotice(e.target.value)}
              className="w-24"
              disabled={isPending}
            />
            <span className="text-sm text-foreground/60">{t("hours")}</span>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 p-3 rounded-lg bg-red-50 dark:bg-red-950/30">
          {error}
        </p>
      )}

      <Button type="submit" disabled={isPending} loading={isPending}>
        {isPending ? t("saving") : t("save_changes")}
      </Button>
    </form>
  );
}
