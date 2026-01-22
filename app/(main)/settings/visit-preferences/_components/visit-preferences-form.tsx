"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { updateVisitPreferences } from "@/app/(main)/settings/_actions";
import type { AccessibilityNeed, CommunicationPreference } from "@/lib/types";
import { Button } from "@/lib/ui/button";
import { Checkbox } from "@/lib/ui/checkbox";
import { Select } from "@/lib/ui/select";
import { SettingsGroup, SettingsRow } from "@/lib/ui/settings-group";
import { Textarea } from "@/lib/ui/textarea";

// Schema for form validation
const visitPreferencesSchema = z.object({
  communication: z.enum(["quiet", "friendly", "chatty"]).nullable().optional(),
  accessibility: z.array(
    z.enum([
      "wheelchair",
      "hearing_impaired",
      "vision_impaired",
      "sensory_sensitivity",
    ]),
  ),
  allergies: z.string().max(500).optional(),
});

type FormData = z.infer<typeof visitPreferencesSchema>;

interface VisitPreferencesFormProps {
  initialPreferences?: {
    communication?: CommunicationPreference;
    accessibility?: AccessibilityNeed[];
    allergies?: string;
  } | null;
}

export function VisitPreferencesForm({
  initialPreferences,
}: VisitPreferencesFormProps) {
  const t = useTranslations("settings");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // react-hook-form handles isDirty automatically
  const {
    control,
    handleSubmit,
    formState: { isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(visitPreferencesSchema),
    defaultValues: {
      communication: initialPreferences?.communication ?? null,
      accessibility: initialPreferences?.accessibility ?? [],
      allergies: initialPreferences?.allergies ?? "",
    },
  });

  const communicationItems = [
    {
      value: "quiet",
      label: `${t("communication_quiet")} - ${t("communication_quiet_description")}`,
    },
    {
      value: "friendly",
      label: `${t("communication_friendly")} - ${t("communication_friendly_description")}`,
    },
    {
      value: "chatty",
      label: `${t("communication_chatty")} - ${t("communication_chatty_description")}`,
    },
  ];

  function onSubmit(data: FormData) {
    setServerError(null);
    setSaveSuccess(false);

    startTransition(async () => {
      const result = await updateVisitPreferences({
        communication: data.communication ?? undefined,
        accessibility:
          data.accessibility.length > 0 ? data.accessibility : undefined,
        allergies: data.allergies?.trim() || undefined,
      });

      if (result.success) {
        setSaveSuccess(true);
        router.refresh();
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setServerError(result.error);
      }
    });
  }

  return (
    <SettingsGroup>
      <form onSubmit={handleSubmit(onSubmit)}>
        <SettingsRow>
          <div className="space-y-6">
            {/* Communication Style */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                {t("communication_label")}
              </label>
              <p className="text-sm text-muted">
                {t("communication_description")}
              </p>
              <Controller
                name="communication"
                control={control}
                render={({ field }) => (
                  <Select.Root
                    value={field.value ?? null}
                    onValueChange={(value) =>
                      field.onChange(value as CommunicationPreference | null)
                    }
                  >
                    <Select.TriggerWrapper>
                      <Select.Trigger
                        placeholder={t("communication_friendly")}
                        items={communicationItems}
                      />
                    </Select.TriggerWrapper>
                    <Select.Content>
                      {communicationItems.map((item) => (
                        <Select.Item key={item.value} value={item.value}>
                          {item.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                )}
              />
            </div>

            {/* Accessibility Needs */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                {t("accessibility_label")}
              </label>
              <p className="text-sm text-muted">
                {t("accessibility_description")}
              </p>
              <Controller
                name="accessibility"
                control={control}
                render={({ field }) => (
                  <div className="space-y-3 pt-1">
                    <AccessibilityCheckbox
                      need="wheelchair"
                      label={t("accessibility_wheelchair")}
                      checked={field.value.includes("wheelchair")}
                      onChange={() => {
                        const newValue = field.value.includes("wheelchair")
                          ? field.value.filter((n) => n !== "wheelchair")
                          : [...field.value, "wheelchair" as const];
                        field.onChange(newValue);
                      }}
                    />
                    <AccessibilityCheckbox
                      need="hearing_impaired"
                      label={t("accessibility_hearing")}
                      checked={field.value.includes("hearing_impaired")}
                      onChange={() => {
                        const newValue = field.value.includes(
                          "hearing_impaired",
                        )
                          ? field.value.filter((n) => n !== "hearing_impaired")
                          : [...field.value, "hearing_impaired" as const];
                        field.onChange(newValue);
                      }}
                    />
                    <AccessibilityCheckbox
                      need="vision_impaired"
                      label={t("accessibility_vision")}
                      checked={field.value.includes("vision_impaired")}
                      onChange={() => {
                        const newValue = field.value.includes("vision_impaired")
                          ? field.value.filter((n) => n !== "vision_impaired")
                          : [...field.value, "vision_impaired" as const];
                        field.onChange(newValue);
                      }}
                    />
                    <AccessibilityCheckbox
                      need="sensory_sensitivity"
                      label={t("accessibility_sensory")}
                      checked={field.value.includes("sensory_sensitivity")}
                      onChange={() => {
                        const newValue = field.value.includes(
                          "sensory_sensitivity",
                        )
                          ? field.value.filter(
                              (n) => n !== "sensory_sensitivity",
                            )
                          : [...field.value, "sensory_sensitivity" as const];
                        field.onChange(newValue);
                      }}
                    />
                  </div>
                )}
              />
            </div>

            {/* Allergies */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                {t("allergies_label")}
              </label>
              <Controller
                name="allergies"
                control={control}
                render={({ field }) => (
                  <Textarea
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder={t("allergies_placeholder")}
                    rows={3}
                    maxLength={500}
                  />
                )}
              />
              <p className="text-xs text-muted">{t("allergies_max_length")}</p>
            </div>

            {/* Error */}
            {serverError && (
              <p className="text-sm text-danger">{serverError}</p>
            )}

            {/* Submit */}
            <div className="flex items-center gap-3">
              <Button
                type="submit"
                loading={isPending}
                disabled={!isDirty}
                size="sm"
              >
                {t("save")}
              </Button>
              {saveSuccess && (
                <span className="text-sm text-foreground">
                  {t("preferences_saved")}
                </span>
              )}
            </div>
          </div>
        </SettingsRow>
      </form>
    </SettingsGroup>
  );
}

// ============================================================================
// Accessibility Checkbox
// ============================================================================

interface AccessibilityCheckboxProps {
  need: AccessibilityNeed;
  label: string;
  checked: boolean;
  onChange: () => void;
}

function AccessibilityCheckbox({
  need,
  label,
  checked,
  onChange,
}: AccessibilityCheckboxProps) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <Checkbox
        name={need}
        checked={checked}
        onCheckedChange={onChange}
        className="border-border data-[checked]:border-accent data-[checked]:bg-accent data-[checked]:text-white"
      />
      <span className="text-sm text-foreground">{label}</span>
    </label>
  );
}
