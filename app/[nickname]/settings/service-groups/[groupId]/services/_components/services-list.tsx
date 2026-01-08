"use client";

import { ChevronRight, Pencil, Scissors } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ServiceGroupWithServices } from "@/lib/queries";
import { Button } from "@/lib/ui/button";
import { SettingsGroup, SettingsRow } from "@/lib/ui/settings-group";
import { formatDuration, formatPrice } from "./constants";
import { CreateServiceDialog } from "./create-service-dialog";
import { DeleteServiceGroupDialog } from "./delete-service-group-dialog";
import { EditServiceGroupDialog } from "./edit-service-group-dialog";

interface ServicesListProps {
  serviceGroup: ServiceGroupWithServices;
  beautyPageId: string;
  nickname: string;
}

export function ServicesList({
  serviceGroup,
  beautyPageId,
  nickname,
}: ServicesListProps) {
  const t = useTranslations("service_groups");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const services = serviceGroup.services;

  return (
    <div className="space-y-6">
      {/* Group name with edit */}
      <SettingsGroup
        title={t("group_settings")}
        description={t("group_settings_description")}
      >
        <SettingsRow className="flex items-center justify-between">
          <p className="font-medium">{serviceGroup.name}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditDialogOpen(true)}
            className="h-8 w-8 p-0"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </SettingsRow>
        <SettingsRow noBorder className="flex items-center justify-between">
          <div>
            <p className="font-medium text-danger">{t("delete_group")}</p>
            <p className="text-sm text-muted">{t("delete_group_hint")}</p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
          >
            {t("delete")}
          </Button>
        </SettingsRow>
      </SettingsGroup>

      <EditServiceGroupDialog
        serviceGroup={serviceGroup}
        beautyPageId={beautyPageId}
        nickname={nickname}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      <DeleteServiceGroupDialog
        serviceGroup={serviceGroup}
        beautyPageId={beautyPageId}
        nickname={nickname}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />

      {/* Services list */}
      <SettingsGroup
        title={t("services")}
        description={t("services_description")}
        action={
          <CreateServiceDialog
            serviceGroupId={serviceGroup.id}
            nickname={nickname}
          />
        }
      >
        {services.length > 0 ? (
          services.map((service, index) => (
            <SettingsRow
              key={service.id}
              noBorder={index === services.length - 1}
            >
              <Link
                href={`/${nickname}/settings/service-groups/${serviceGroup.id}/services/${service.id}`}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400">
                    <Scissors className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-sm text-muted">
                      {formatPrice(service.price_cents)} •{" "}
                      {formatDuration(service.duration_minutes)}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted" />
              </Link>
            </SettingsRow>
          ))
        ) : (
          <div className="p-8 text-center">
            <Scissors className="mx-auto h-12 w-12 text-muted" />
            <h3 className="mt-4 font-semibold">{t("no_services_title")}</h3>
            <p className="mt-2 text-sm text-muted">
              {t("no_services_description")}
            </p>
            <div className="mt-4">
              <CreateServiceDialog
                serviceGroupId={serviceGroup.id}
                nickname={nickname}
                variant="primary"
              />
            </div>
          </div>
        )}
      </SettingsGroup>
    </div>
  );
}
