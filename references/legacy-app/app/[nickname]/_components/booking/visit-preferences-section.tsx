"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { ChevronDown } from "lucide-react";
import type { AccessibilityNeed, CommunicationPreference } from "@/lib/types";
import { ACCESSIBILITY_OPTIONS, COMMUNICATION_OPTIONS } from "@/lib/types";
import { Checkbox } from "@/lib/ui/checkbox";
import { Select } from "@/lib/ui/select";

export interface VisitPreferencesTranslations {
  title: string;
  subtitle: string;
  communicationLabel: string;
  communicationQuiet: string;
  communicationFriendly: string;
  communicationChatty: string;
  accessibilityLabel: string;
  accessibilityWheelchair: string;
  accessibilityHearing: string;
  accessibilityVision: string;
  accessibilitySensory: string;
  allergiesLabel: string;
  allergiesPlaceholder: string;
}

interface VisitPreferencesSectionProps {
  translations: VisitPreferencesTranslations;
  communication: CommunicationPreference | undefined;
  onCommunicationChange: (value: CommunicationPreference | undefined) => void;
  accessibility: AccessibilityNeed[];
  onAccessibilityToggle: (need: AccessibilityNeed) => void;
  allergies: string;
  onAllergiesChange: (value: string) => void;
}

/**
 * Collapsible visit preferences section for booking confirmation.
 *
 * Includes:
 * - Communication style preference (quiet/friendly/chatty)
 * - Accessibility needs (wheelchair, hearing, vision, sensory)
 * - Allergies textarea
 */
export function VisitPreferencesSection({
  translations,
  communication,
  onCommunicationChange,
  accessibility,
  onAccessibilityToggle,
  allergies,
  onAllergiesChange,
}: VisitPreferencesSectionProps) {
  // Communication options with translations
  const communicationOptions = COMMUNICATION_OPTIONS.map((opt) => ({
    value: opt,
    label:
      opt === "quiet"
        ? translations.communicationQuiet
        : opt === "friendly"
          ? translations.communicationFriendly
          : translations.communicationChatty,
  }));

  // Accessibility options with translations
  const accessibilityOptions = ACCESSIBILITY_OPTIONS.map((opt) => ({
    value: opt,
    label:
      opt === "wheelchair"
        ? translations.accessibilityWheelchair
        : opt === "hearing_impaired"
          ? translations.accessibilityHearing
          : opt === "vision_impaired"
            ? translations.accessibilityVision
            : translations.accessibilitySensory,
  }));

  return (
    <Collapsible.Root>
      <Collapsible.Trigger className="group flex w-full items-center justify-between rounded-lg border border-border bg-surface-muted px-3 py-2.5 text-left transition-colors hover:bg-surface-hover data-[panel-open]:rounded-b-none data-[panel-open]:border-b-0">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground">
            {translations.title}
          </div>
          <div className="text-xs text-muted">{translations.subtitle}</div>
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform duration-200 group-data-[panel-open]:rotate-180" />
      </Collapsible.Trigger>

      <Collapsible.Panel className="overflow-hidden rounded-b-lg border border-t-0 border-border bg-surface transition-all duration-200 data-[ending-style]:h-0 data-[starting-style]:h-0">
        <div className="space-y-4 p-3">
          {/* Communication Style */}
          <CommunicationField
            label={translations.communicationLabel}
            value={communication}
            onChange={onCommunicationChange}
            options={communicationOptions}
          />

          {/* Accessibility Needs */}
          <AccessibilityField
            label={translations.accessibilityLabel}
            accessibility={accessibility}
            onToggle={onAccessibilityToggle}
            options={accessibilityOptions}
          />

          {/* Allergies */}
          <AllergiesField
            label={translations.allergiesLabel}
            placeholder={translations.allergiesPlaceholder}
            value={allergies}
            onChange={onAllergiesChange}
          />
        </div>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}

// Sub-components for better organization

interface CommunicationFieldProps {
  label: string;
  value: CommunicationPreference | undefined;
  onChange: (value: CommunicationPreference | undefined) => void;
  options: Array<{ value: string; label: string }>;
}

function CommunicationField({
  label,
  value,
  onChange,
  options,
}: CommunicationFieldProps) {
  return (
    <div>
      <div className="mb-1.5 text-sm font-medium text-foreground">{label}</div>
      <Select.Root
        value={value ?? null}
        onValueChange={(val) =>
          onChange(val ? (val as CommunicationPreference) : undefined)
        }
      >
        <Select.Trigger placeholder={label} items={options} />
        <Select.Content>
          {options.map((opt) => (
            <Select.Item key={opt.value} value={opt.value}>
              {opt.label}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </div>
  );
}

interface AccessibilityFieldProps {
  label: string;
  accessibility: AccessibilityNeed[];
  onToggle: (need: AccessibilityNeed) => void;
  options: Array<{ value: AccessibilityNeed; label: string }>;
}

function AccessibilityField({
  label,
  accessibility,
  onToggle,
  options,
}: AccessibilityFieldProps) {
  return (
    <div>
      <div className="mb-2 text-sm font-medium text-foreground">{label}</div>
      <div className="space-y-2">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex cursor-pointer items-center gap-2"
          >
            <Checkbox
              checked={accessibility.includes(opt.value)}
              onCheckedChange={() => onToggle(opt.value)}
            />
            <span className="text-sm text-foreground">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

interface AllergiesFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

function AllergiesField({
  label,
  placeholder,
  value,
  onChange,
}: AllergiesFieldProps) {
  return (
    <div>
      <label
        htmlFor="allergies-textarea"
        className="mb-1.5 block text-sm font-medium text-foreground"
      >
        {label}
      </label>
      <textarea
        id="allergies-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        maxLength={500}
        placeholder={placeholder}
        className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}
