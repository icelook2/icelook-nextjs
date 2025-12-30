"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/lib/ui/button";
import { Field } from "@/lib/ui/field";
import { NumberField } from "@/lib/ui/number-field";
import { SettingsGroup, SettingsRow } from "@/lib/ui/settings-group";
import { Switch } from "@/lib/ui/switch";
import { upsertCancellationPolicy } from "../_actions/cancellation-policy.actions";

interface FormValues {
  isEnabled: boolean;
  maxCancellations: number;
  periodDays: number;
  blockDurationDays: number;
  noShowMultiplier: number;
}

interface CancellationPolicyFormProps {
  beautyPageId: string;
  nickname: string;
  initialValues: {
    isEnabled: boolean;
    maxCancellations: number;
    periodDays: number;
    blockDurationDays: number;
    noShowMultiplier: number;
  };
}

export function CancellationPolicyForm({
  beautyPageId,
  nickname,
  initialValues,
}: CancellationPolicyFormProps) {
  const t = useTranslations("cancellation_policy_settings");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { isDirty },
  } = useForm<FormValues>({
    defaultValues: initialValues,
  });

  const isEnabled = watch("isEnabled");

  function onSubmit(data: FormValues) {
    setServerError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await upsertCancellationPolicy({
        beautyPageId,
        nickname,
        isEnabled: data.isEnabled,
        maxCancellations: data.maxCancellations,
        periodDays: data.periodDays,
        blockDurationDays: data.blockDurationDays,
        noShowMultiplier: data.noShowMultiplier,
      });

      if (result.success) {
        setSuccess(true);
        router.refresh();
      } else {
        setServerError(result.error ?? null);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <SettingsGroup
        title={t("policy.title")}
        description={t("policy.description")}
      >
        <SettingsRow>
          <div className="space-y-6">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">
                  {t("policy.enable_label")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("policy.enable_description")}
                </p>
              </div>
              <Controller
                name="isEnabled"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            {/* Policy Settings - shown only when enabled */}
            {isEnabled && (
              <div className="space-y-4 border-t border-border pt-4">
                <Field.Root name="maxCancellations">
                  <Field.Label>{t("policy.max_cancellations_label")}</Field.Label>
                  <Controller
                    name="maxCancellations"
                    control={control}
                    render={({ field }) => (
                      <NumberField
                        className="max-w-36"
                        value={field.value}
                        onValueChange={(val) => field.onChange(val ?? 1)}
                        min={1}
                        max={100}
                      />
                    )}
                  />
                  <Field.Description>
                    {t("policy.max_cancellations_description")}
                  </Field.Description>
                </Field.Root>

                <Field.Root name="periodDays">
                  <Field.Label>{t("policy.period_days_label")}</Field.Label>
                  <Controller
                    name="periodDays"
                    control={control}
                    render={({ field }) => (
                      <NumberField
                        className="max-w-36"
                        value={field.value}
                        onValueChange={(val) => field.onChange(val ?? 1)}
                        min={1}
                        max={365}
                      />
                    )}
                  />
                  <Field.Description>
                    {t("policy.period_days_description")}
                  </Field.Description>
                </Field.Root>

                <Field.Root name="blockDurationDays">
                  <Field.Label>{t("policy.block_duration_label")}</Field.Label>
                  <Controller
                    name="blockDurationDays"
                    control={control}
                    render={({ field }) => (
                      <NumberField
                        className="max-w-36"
                        value={field.value}
                        onValueChange={(val) => field.onChange(val ?? 1)}
                        min={1}
                        max={365}
                      />
                    )}
                  />
                  <Field.Description>
                    {t("policy.block_duration_description")}
                  </Field.Description>
                </Field.Root>

                <Field.Root name="noShowMultiplier">
                  <Field.Label>{t("policy.no_show_multiplier_label")}</Field.Label>
                  <Controller
                    name="noShowMultiplier"
                    control={control}
                    render={({ field }) => (
                      <NumberField
                        className="max-w-36"
                        value={field.value}
                        onValueChange={(val) => field.onChange(val ?? 1)}
                        min={1}
                        max={10}
                        step={0.5}
                      />
                    )}
                  />
                  <Field.Description>
                    {t("policy.no_show_multiplier_description")}
                  </Field.Description>
                </Field.Root>
              </div>
            )}

            <div className="flex items-center gap-4 pt-2">
              <Button
                type="submit"
                disabled={isPending || !isDirty}
                loading={isPending}
              >
                {t("save")}
              </Button>
              {serverError && (
                <p className="text-sm text-danger">{serverError}</p>
              )}
              {success && <p className="text-sm text-success">{t("saved")}</p>}
            </div>
          </div>
        </SettingsRow>
      </SettingsGroup>
    </form>
  );
}
