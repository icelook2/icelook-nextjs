"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useId, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/lib/ui/button";
import { Combobox } from "@/lib/ui/combobox";
import { Field } from "@/lib/ui/field";
import { SettingsGroup, SettingsRow } from "@/lib/ui/settings-group";
import { getAllTimezones, type TimezoneOption } from "@/lib/utils/timezones";
import { updateTimezone } from "../_actions/settings.actions";

interface TimezoneFormValues {
  timezone: TimezoneOption | null;
}

interface TimezoneFormProps {
  beautyPageId: string;
  nickname: string;
  currentTimezone: string;
}

export function TimezoneForm({
  beautyPageId,
  nickname,
  currentTimezone,
}: TimezoneFormProps) {
  const t = useTranslations("time_settings");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const timezoneFieldId = useId();

  // Get all IANA timezones
  const timezones = getAllTimezones();

  // Find the initial timezone option
  const initialTimezone =
    timezones.find((tz) => tz.value === currentTimezone) ?? null;

  const {
    control,
    handleSubmit,
    formState: { isDirty },
  } = useForm<TimezoneFormValues>({
    defaultValues: {
      timezone: initialTimezone,
    },
  });

  function onSubmit(data: TimezoneFormValues) {
    if (!data.timezone) {
      return;
    }

    setSuccess(false);
    startTransition(async () => {
      const result = await updateTimezone({
        beautyPageId,
        nickname,
        timezone: data.timezone!.value,
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
        title={t("timezone.title")}
        description={t("timezone.description")}
      >
        <SettingsRow noBorder>
          <div className="space-y-4">
            <Controller
              name="timezone"
              control={control}
              render={({ field }) => (
                <Field.Root name="timezone">
                  <Field.Label htmlFor={timezoneFieldId} className="sr-only">
                    {t("timezone.label")}
                  </Field.Label>
                  <Combobox.Root<TimezoneOption>
                    items={timezones}
                    value={field.value}
                    onValueChange={field.onChange}
                    itemToStringLabel={(item) => item.label}
                    isItemEqualToValue={(item, value) =>
                      item.value === value.value
                    }
                    filter={(item, query) =>
                      item.label.toLowerCase().includes(query.toLowerCase()) ||
                      item.value.toLowerCase().includes(query.toLowerCase()) ||
                      item.region.toLowerCase().includes(query.toLowerCase())
                    }
                  >
                    <Combobox.InputWrapper>
                      <Combobox.Input
                        placeholder={tCommon("search")}
                        id={timezoneFieldId}
                      />
                      <Combobox.Actions>
                        <Combobox.Trigger />
                      </Combobox.Actions>
                    </Combobox.InputWrapper>

                    <Combobox.Content>
                      <Combobox.Empty>{tCommon("no_results")}</Combobox.Empty>
                      <Combobox.List>
                        {(item: TimezoneOption) => (
                          <Combobox.Item key={item.value} value={item}>
                            <Combobox.ItemIndicator />
                            <Combobox.ItemText>{item.label}</Combobox.ItemText>
                          </Combobox.Item>
                        )}
                      </Combobox.List>
                    </Combobox.Content>
                  </Combobox.Root>
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
