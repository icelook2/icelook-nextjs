"use client";

import { FolderOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ServiceGroupWithServices } from "@/lib/queries";
import { SettingsGroup } from "@/lib/ui/settings-group";
import { CreateServiceGroupDialog } from "./create-service-group-dialog";
import { ServiceGroupCard } from "./service-group-card";

interface ServicesManagerProps {
  serviceGroups: ServiceGroupWithServices[];
  beautyPageId: string;
  nickname: string;
}

export function ServicesManager({
  serviceGroups,
  beautyPageId,
  nickname,
}: ServicesManagerProps) {
  const t = useTranslations("service_groups");

  if (serviceGroups.length === 0) {
    return (
      <SettingsGroup
        title={t("services_page_title")}
        description={t("services_page_description")}
      >
        <div className="p-8 text-center">
          <FolderOpen className="mx-auto h-12 w-12 text-muted" />
          <h3 className="mt-4 font-semibold">{t("empty_title")}</h3>
          <p className="mt-2 text-sm text-muted">{t("empty_description")}</p>
          <div className="mt-4">
            <CreateServiceGroupDialog
              beautyPageId={beautyPageId}
              nickname={nickname}
              variant="primary"
            />
          </div>
        </div>
      </SettingsGroup>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("services_page_title")}</h2>
          <p className="text-sm text-muted">{t("services_page_description")}</p>
        </div>
        <CreateServiceGroupDialog
          beautyPageId={beautyPageId}
          nickname={nickname}
        />
      </div>

      <div className="space-y-4">
        {serviceGroups.map((group) => (
          <ServiceGroupCard
            key={group.id}
            serviceGroup={group}
            beautyPageId={beautyPageId}
            nickname={nickname}
          />
        ))}
      </div>
    </div>
  );
}
