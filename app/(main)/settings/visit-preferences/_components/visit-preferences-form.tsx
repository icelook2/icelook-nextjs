"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { updateVisitPreferences } from "@/app/(main)/settings/_actions";
import type {
  AccessibilityNeed,
  CommunicationPreference,
  VisitPreferences,
} from "@/lib/types";
import { Button } from "@/lib/ui/button";
import { Checkbox } from "@/lib/ui/checkbox";
import { Select } from "@/lib/ui/select";
import { SettingsGroup, SettingsRow } from "@/lib/ui/settings-group";
import { Textarea } from "@/lib/ui/textarea";

interface VisitPreferencesFormProps {
  initialPreferences?: VisitPreferences | null;
}

export function VisitPreferencesForm({
  initialPreferences,
}: VisitPreferencesFormProps) {
  const t = useTranslations("settings");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Form state
  const [communication, setCommunication] = useState<
    CommunicationPreference | undefined
  >(initialPreferences?.communication);
  const [accessibility, setAccessibility] = useState<AccessibilityNeed[]>(
    initialPreferences?.accessibility ?? [],
  );
  const [allergies, setAllergies] = useState(
    initialPreferences?.allergies ?? "",
  );

  // Track if form is dirty
  const isDirty = useMemo(() => {
    const currentComm = communication;
    const initialComm = initialPreferences?.communication;
    const currentAcc = accessibility;
    const initialAcc = initialPreferences?.accessibility ?? [];
    const currentAll = allergies;
    const initialAll = initialPreferences?.allergies ?? "";

    return (
      currentComm !== initialComm ||
      JSON.stringify(currentAcc.sort()) !== JSON.stringify(initialAcc.sort()) ||
      currentAll !== initialAll
    );
  }, [communication, accessibility, allergies, initialPreferences]);

  // Communication options
  const communicationItems = useMemo(
    () => [
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
    ],
    [t],
  );

  function toggleAccessibility(need: AccessibilityNeed) {
    setAccessibility((prev) =>
      prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setSaveSuccess(false);

    startTransition(async () => {
      const result = await updateVisitPreferences({
        communication,
        accessibility: accessibility.length > 0 ? accessibility : undefined,
        allergies: allergies.trim() || undefined,
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
      <form onSubmit={handleSubmit}>
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
              <Select.Root
                value={communication ?? null}
                onValueChange={(value) =>
                  setCommunication(value as CommunicationPreference | undefined)
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
            </div>

            {/* Accessibility Needs */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                {t("accessibility_label")}
              </label>
              <p className="text-sm text-muted">
                {t("accessibility_description")}
              </p>
              <div className="space-y-3 pt-1">
                <AccessibilityCheckbox
                  need="wheelchair"
                  label={t("accessibility_wheelchair")}
                  checked={accessibility.includes("wheelchair")}
                  onChange={() => toggleAccessibility("wheelchair")}
                />
                <AccessibilityCheckbox
                  need="hearing_impaired"
                  label={t("accessibility_hearing")}
                  checked={accessibility.includes("hearing_impaired")}
                  onChange={() => toggleAccessibility("hearing_impaired")}
                />
                <AccessibilityCheckbox
                  need="vision_impaired"
                  label={t("accessibility_vision")}
                  checked={accessibility.includes("vision_impaired")}
                  onChange={() => toggleAccessibility("vision_impaired")}
                />
                <AccessibilityCheckbox
                  need="sensory_sensitivity"
                  label={t("accessibility_sensory")}
                  checked={accessibility.includes("sensory_sensitivity")}
                  onChange={() => toggleAccessibility("sensory_sensitivity")}
                />
              </div>
            </div>

            {/* Allergies */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                {t("allergies_label")}
              </label>
              <Textarea
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder={t("allergies_placeholder")}
                rows={3}
                maxLength={500}
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
