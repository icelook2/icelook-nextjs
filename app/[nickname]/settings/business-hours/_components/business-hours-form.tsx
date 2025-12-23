"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/lib/ui/button";
import { Field } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { SettingsGroup } from "@/lib/ui/settings-group";
import { Switch } from "@/lib/ui/switch";
import { cn } from "@/lib/utils/cn";
import { updateBusinessHours } from "../_actions/business-hours.actions";

interface DayHours {
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface BusinessHoursFormValues {
  hours: DayHours[];
}

interface BusinessHoursFormProps {
  beautyPageId: string;
  nickname: string;
  initialHours: DayHours[];
}

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export function BusinessHoursForm({
  beautyPageId,
  nickname,
  initialHours,
}: BusinessHoursFormProps) {
  const t = useTranslations("business_hours");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { isDirty },
  } = useForm<BusinessHoursFormValues>({
    defaultValues: {
      hours: initialHours,
    },
  });

  const watchedHours = watch("hours");

  function onSubmit(data: BusinessHoursFormValues) {
    setServerError(null);
    startTransition(async () => {
      const result = await updateBusinessHours({
        beautyPageId,
        nickname,
        hours: data.hours,
      });

      if (result.success) {
        router.refresh();
      } else {
        setServerError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <SettingsGroup
        title={t("regular_hours.title")}
        description={t("regular_hours.description")}
      >
        <div className="space-y-2 px-4 pt-4">
          {initialHours.map((_, index) => (
            <DayRow
              key={index}
              index={index}
              control={control}
              dayName={t(`days.${DAY_KEYS[index]}`)}
              isOpen={watchedHours[index]?.isOpen ?? false}
            />
          ))}
        </div>

        <div className="flex items-center gap-4 p-4">
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
        </div>
      </SettingsGroup>
    </form>
  );
}

interface DayRowProps {
  index: number;
  control: ReturnType<typeof useForm<BusinessHoursFormValues>>["control"];
  dayName: string;
  isOpen: boolean;
}

function DayRow({ index, control, dayName, isOpen }: DayRowProps) {
  const t = useTranslations("business_hours");

  return (
    <div
      className="grid items-center gap-x-4"
      style={{
        gridTemplateColumns: "10rem 10rem 10rem",
      }}
    >
      {/* Switch + Day name as label - using Field.Label for implicit labeling */}
      <Controller
        name={`hours.${index}.isOpen`}
        control={control}
        render={({ field }) => (
          <Field.Root name={`hours.${index}.isOpen`}>
            <Field.Label className="flex cursor-pointer items-center gap-3">
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
              <span
                className={cn(
                  "font-medium",
                  !isOpen && "text-muted",
                )}
              >
                {dayName}
              </span>
            </Field.Label>
          </Field.Root>
        )}
      />

      {/* Time inputs or Closed */}
      {isOpen ? (
        <>
          <Controller
            name={`hours.${index}.openTime`}
            control={control}
            render={({ field }) => (
              <Field.Root name={`hours.${index}.openTime`} direction="row" gap="sm">
                <Field.Label className="text-sm text-muted">{t("from")}</Field.Label>
                <Input
                  type="time"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              </Field.Root>
            )}
          />

          <Controller
            name={`hours.${index}.closeTime`}
            control={control}
            render={({ field }) => (
              <Field.Root name={`hours.${index}.closeTime`} direction="row" gap="sm">
                <Field.Label className="text-sm text-muted">{t("to")}</Field.Label>
                <Input
                  type="time"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              </Field.Root>
            )}
          />
        </>
      ) : (
        <span className="col-span-2 text-muted">{t("closed")}</span>
      )}
    </div>
  );
}
