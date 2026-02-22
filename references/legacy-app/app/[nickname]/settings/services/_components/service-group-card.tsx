"use client";

import { FolderOpen, Plus, Scissors } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ServiceGroupWithServices } from "@/lib/queries";
import { Button } from "@/lib/ui/button";
import { Paper } from "@/lib/ui/paper";
import { SettingsRow } from "@/lib/ui/settings-group";
import { CreateServiceDialog } from "./create-service-dialog";
import { ServiceGroupMenu } from "./service-group-menu";
import { ServiceRow } from "./service-row";

interface ServiceGroupCardProps {
  serviceGroup: ServiceGroupWithServices;
  beautyPageId: string;
  nickname: string;
}

export function ServiceGroupCard({
  serviceGroup,
  beautyPageId,
  nickname,
}: ServiceGroupCardProps) {
  const t = useTranslations("service_groups");
  const [createServiceOpen, setCreateServiceOpen] = useState(false);

  const services = serviceGroup.services;
  const hasServices = services.length > 0;

  return (
    <Paper>
      {/* Group header */}
      <SettingsRow
        noBorder={!hasServices}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
            <FolderOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">{serviceGroup.name}</p>
            <p className="text-sm text-muted">
              {services.length}{" "}
              {services.length === 1
                ? t("service_singular")
                : t("service_plural")}
            </p>
          </div>
        </div>
        <ServiceGroupMenu
          serviceGroup={serviceGroup}
          beautyPageId={beautyPageId}
          nickname={nickname}
        />
      </SettingsRow>

      {/* Services list */}
      {hasServices ? (
        services.map((service, index) => (
          <ServiceRow
            key={service.id}
            service={service}
            nickname={nickname}
            isLast={index === services.length - 1}
          />
        ))
      ) : (
        <div className="p-6 text-center">
          <Scissors className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-2 text-sm text-muted">{t("no_services_in_group")}</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => setCreateServiceOpen(true)}
          >
            <Plus className="h-4 w-4" />
            {t("add_first_service")}
          </Button>
        </div>
      )}

      <CreateServiceDialog
        serviceGroupId={serviceGroup.id}
        nickname={nickname}
        open={createServiceOpen}
        onOpenChange={setCreateServiceOpen}
      />
    </Paper>
  );
}
