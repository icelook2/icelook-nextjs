"use client";

import { ChevronRight, FolderOpen } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ServiceGroupWithServices } from "@/lib/queries";
import { SettingsGroup, SettingsRow } from "@/lib/ui/settings-group";
import { CreateServiceGroupDialog } from "./create-service-group-dialog";

interface ServiceGroupsListProps {
  serviceGroups: ServiceGroupWithServices[];
  beautyPageId: string;
  nickname: string;
}

export function ServiceGroupsList({
  serviceGroups,
  beautyPageId,
  nickname,
}: ServiceGroupsListProps) {
  const t = useTranslations("service_groups");

  return (
    <SettingsGroup
      title={t("title")}
      description={t("description")}
      action={
        <CreateServiceGroupDialog
          beautyPageId={beautyPageId}
          nickname={nickname}
        />
      }
    >
      {serviceGroups.length > 0 ? (
        serviceGroups.map((group, index) => {
          const servicesCount = group.services.length;
          return (
            <SettingsRow
              key={group.id}
              noBorder={index === serviceGroups.length - 1}
            >
              <Link
                href={`/${nickname}/settings/service-groups/${group.id}/services`}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                    <FolderOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{group.name}</p>
                    <p className="text-sm text-muted">
                      {servicesCount}{" "}
                      {servicesCount === 1
                        ? t("service_singular")
                        : t("service_plural")}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted" />
              </Link>
            </SettingsRow>
          );
        })
      ) : (
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
      )}
    </SettingsGroup>
  );
}
