"use client";

import { Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import type { LabelWithAssignmentCount } from "@/lib/queries";
import { SettingsGroup, SettingsRow } from "@/lib/ui/settings-group";
import { CreateLabelDialog } from "./create-label-dialog";
import { DeleteLabelDialog } from "./delete-label-dialog";
import { EditLabelDialog } from "./edit-label-dialog";
import { LabelBadge } from "./label-badge";

interface LabelsListProps {
  labels: LabelWithAssignmentCount[];
  beautyPageId: string;
  nickname: string;
}

export function LabelsList({ labels, beautyPageId, nickname }: LabelsListProps) {
  const t = useTranslations("labels");

  return (
    <SettingsGroup
      title={t("title")}
      description={t("description")}
      action={<CreateLabelDialog beautyPageId={beautyPageId} nickname={nickname} />}
    >
      {labels.length > 0 ? (
        labels.map((label, index) => (
          <SettingsRow key={label.id} noBorder={index === labels.length - 1}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LabelBadge name={label.name} color={label.color} />
                <span className="text-sm text-muted">
                  {label.assignment_count}{" "}
                  {label.assignment_count === 1
                    ? t("specialist_singular")
                    : t("specialist_plural")}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <EditLabelDialog
                  label={label}
                  beautyPageId={beautyPageId}
                  nickname={nickname}
                />
                <DeleteLabelDialog
                  label={label}
                  beautyPageId={beautyPageId}
                  nickname={nickname}
                />
              </div>
            </div>
          </SettingsRow>
        ))
      ) : (
        <div className="p-8 text-center">
          <Tag className="mx-auto h-12 w-12 text-muted" />
          <h3 className="mt-4 font-semibold">{t("empty_title")}</h3>
          <p className="mt-2 text-sm text-muted">{t("empty_description")}</p>
          <div className="mt-4">
            <CreateLabelDialog
              beautyPageId={beautyPageId}
              nickname={nickname}
              variant="primary"
            />
          </div>
        </div>
      )}
    </SettingsGroup>
  );
}
