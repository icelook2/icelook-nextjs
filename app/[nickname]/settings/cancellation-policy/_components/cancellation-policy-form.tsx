"use client";

/**
 * Cancellation Policy Form (Solo Creator Model)
 *
 * Simplified form for managing cancellation policies:
 * - Allow/disallow cancellations
 * - Notice period in hours
 * - Late cancellation fee percentage
 * - Optional policy text
 */

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/lib/ui/button";
import { Field } from "@/lib/ui/field";
import { NumberField } from "@/lib/ui/number-field";
import { SettingsGroup, SettingsRow } from "@/lib/ui/settings-group";
import { Switch } from "@/lib/ui/switch";
import { Textarea } from "@/lib/ui/textarea";
import { upsertCancellationPolicy } from "../_actions/cancellation-policy.actions";

interface FormValues {
  allowCancellation: boolean;
  cancellationNoticeHours: number;
  cancellationFeePercentage: number;
  policyText: string;
}

interface CancellationPolicyFormProps {
  beautyPageId: string;
  nickname: string;
  initialValues: {
    allowCancellation: boolean;
    cancellationNoticeHours: number;
    cancellationFeePercentage: number;
    policyText: string;
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

  const allowCancellation = watch("allowCancellation");

  function onSubmit(data: FormValues) {
    setServerError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await upsertCancellationPolicy({
        beautyPageId,
        nickname,
        allowCancellation: data.allowCancellation,
        cancellationNoticeHours: data.cancellationNoticeHours,
        cancellationFeePercentage: data.cancellationFeePercentage,
        policyText: data.policyText || undefined,
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
            {/* Allow Cancellation Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">
                  {t("policy.allow_cancellation_label")}
                </p>
                <p className="text-sm text-muted">
                  {t("policy.allow_cancellation_description")}
                </p>
              </div>
              <Controller
                name="allowCancellation"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            {/* Policy Settings - shown only when cancellation is allowed */}
            {allowCancellation && (
              <div className="space-y-4 border-t border-border pt-4">
                <Field.Root name="cancellationNoticeHours">
                  <Field.Label>{t("policy.notice_hours_label")}</Field.Label>
                  <Controller
                    name="cancellationNoticeHours"
                    control={control}
                    render={({ field }) => (
                      <NumberField
                        className="max-w-36"
                        value={field.value}
                        onValueChange={(val) => field.onChange(val ?? 0)}
                        min={0}
                        max={168}
                      />
                    )}
                  />
                  <Field.Description>
                    {t("policy.notice_hours_description")}
                  </Field.Description>
                </Field.Root>

                <Field.Root name="cancellationFeePercentage">
                  <Field.Label>{t("policy.fee_percentage_label")}</Field.Label>
                  <Controller
                    name="cancellationFeePercentage"
                    control={control}
                    render={({ field }) => (
                      <NumberField
                        className="max-w-36"
                        value={field.value}
                        onValueChange={(val) => field.onChange(val ?? 0)}
                        min={0}
                        max={100}
                      />
                    )}
                  />
                  <Field.Description>
                    {t("policy.fee_percentage_description")}
                  </Field.Description>
                </Field.Root>

                <Field.Root name="policyText">
                  <Field.Label>{t("policy.text_label")}</Field.Label>
                  <Controller
                    name="policyText"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        placeholder={t("policy.text_placeholder")}
                        rows={4}
                      />
                    )}
                  />
                  <Field.Description>
                    {t("policy.text_description")}
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
