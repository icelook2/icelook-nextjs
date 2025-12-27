"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { SpecialistLabel } from "@/lib/queries";
import { Button } from "@/lib/ui/button";
import { Checkbox } from "@/lib/ui/checkbox";
import { SettingsGroup, SettingsRow } from "@/lib/ui/settings-group";
import { LabelBadge } from "../../../../labels/_components/label-badge";
import { updateSpecialistLabels } from "../../../../labels/_actions";

interface LabelsSectionProps {
  specialistId: string;
  availableLabels: SpecialistLabel[];
  assignedLabelIds: string[];
  beautyPageId: string;
  nickname: string;
}

export function LabelsSection({
  specialistId,
  availableLabels,
  assignedLabelIds,
  beautyPageId,
  nickname,
}: LabelsSectionProps) {
  const t = useTranslations("labels");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(assignedLabelIds),
  );

  function toggleLabel(labelId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(labelId)) {
        next.delete(labelId);
      } else {
        next.add(labelId);
      }
      return next;
    });
  }

  function handleSave() {
    setServerError(null);

    startTransition(async () => {
      const result = await updateSpecialistLabels({
        specialistId,
        labelIds: Array.from(selectedIds),
        beautyPageId,
        nickname,
      });

      if (result.success) {
        router.refresh();
      } else {
        setServerError(result.error);
      }
    });
  }

  // Check if there are changes to save
  const hasChanges =
    selectedIds.size !== assignedLabelIds.length ||
    !assignedLabelIds.every((id) => selectedIds.has(id));

  return (
    <SettingsGroup
      title={t("specialist_labels_title")}
      description={t("specialist_labels_description")}
    >
      <SettingsRow noBorder>
        <div className="space-y-4">
          <div className="space-y-2">
            {availableLabels.map((label) => (
              <label
                key={label.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Checkbox
                  checked={selectedIds.has(label.id)}
                  onCheckedChange={() => toggleLabel(label.id)}
                />
                <LabelBadge name={label.name} color={label.color} />
              </label>
            ))}
          </div>

          <div className="flex items-center justify-between border-t pt-4 dark:border-gray-800">
            <Link
              href={`/${nickname}/settings/labels`}
              className="text-sm text-primary hover:underline"
            >
              {t("manage_labels")}
            </Link>

            <Button
              onClick={handleSave}
              variant="primary"
              size="sm"
              loading={isPending}
              disabled={!hasChanges}
            >
              {t("save")}
            </Button>
          </div>

          {serverError && <p className="text-sm text-danger">{serverError}</p>}
        </div>
      </SettingsRow>
    </SettingsGroup>
  );
}
