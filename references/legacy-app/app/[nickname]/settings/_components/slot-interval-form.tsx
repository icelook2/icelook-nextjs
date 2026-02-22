"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useId, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/lib/ui/button";
import { Field } from "@/lib/ui/field";
import { Select, type SelectItem } from "@/lib/ui/select";
import { SettingsGroup, SettingsRow } from "@/lib/ui/settings-group";
import { updateSlotInterval } from "../_actions/settings.actions";

interface SlotIntervalFormValues {
  slotInterval: number;
}

interface SlotIntervalFormProps {
  beautyPageId: string;
  nickname: string;
  currentSlotInterval: number;
}

/** Valid slot interval options in minutes */
const SLOT_INTERVAL_OPTIONS = [5, 10, 15, 30, 60] as const;

export function SlotIntervalForm({
  beautyPageId,
  nickname,
  currentSlotInterval,
}: SlotIntervalFormProps) {
  const t = useTranslations("time_settings");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const fieldId = useId();

  // Build translated options
  const options: SelectItem[] = SLOT_INTERVAL_OPTIONS.map((minutes) => ({
    value: minutes,
    label: t("slot_interval.options.minutes", { count: minutes }),
  }));

  const {
    control,
    handleSubmit,
    formState: { isDirty },
  } = useForm<SlotIntervalFormValues>({
    defaultValues: {
      slotInterval: currentSlotInterval,
    },
  });

  function onSubmit(data: SlotIntervalFormValues) {
    setSuccess(false);
    startTransition(async () => {
      const result = await updateSlotInterval({
        beautyPageId,
        nickname,
        slotInterval: data.slotInterval,
      });

      if (result.success) {
        setSuccess(true);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <SettingsGroup
        title={t("slot_interval.title")}
        description={t("slot_interval.description")}
      >
        <SettingsRow noBorder>
          <div className="space-y-4">
            <Controller
              name="slotInterval"
              control={control}
              render={({ field }) => (
                <Field.Root name="slotInterval">
                  <Field.Label htmlFor={fieldId} className="sr-only">
                    {t("slot_interval.label")}
                  </Field.Label>
                  <Select.Root
                    value={field.value}
                    onValueChange={field.onChange}
                    items={options}
                  >
                    <Select.TriggerWrapper>
                      <Select.Trigger
                        id={fieldId}
                        placeholder={t("slot_interval.placeholder")}
                        items={options}
                      />
                    </Select.TriggerWrapper>
                    <Select.Content>
                      {options.map((option) => (
                        <Select.Item key={option.value} value={option.value}>
                          {option.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </Field.Root>
              )}
            />

            <div className="flex items-center gap-4">
              <Button
                type="submit"
                loading={isPending}
                disabled={!isDirty}
                size="sm"
              >
                {t("save")}
              </Button>
              {success && <p className="text-sm text-success">{t("saved")}</p>}
            </div>
          </div>
        </SettingsRow>
      </SettingsGroup>
    </form>
  );
}
