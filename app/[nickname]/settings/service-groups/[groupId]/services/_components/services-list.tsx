"use client";

import { ChevronRight, Pencil, Scissors, Trash2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ServiceGroupWithServices } from "@/lib/queries";
import { SettingsGroup, SettingsRow } from "@/lib/ui/settings-group";
import { formatDuration, formatPrice } from "./constants";
import { CreateServiceDialog } from "./create-service-dialog";
import { DeleteServiceGroupDialog } from "./delete-service-group-dialog";

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const services = serviceGroup.services;

  return (
    <div className="space-y-6">
      {/* Group name with edit */}
      <SettingsGroup
        title={t("group_settings")}
        description={t("group_settings_description")}
      >
        <SettingsRow noBorder>
          <Link
            href={`/${nickname}/settings/service-groups/${serviceGroup.id}/services/name`}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                <Pencil className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">{t("group_name_label")}</p>
                <p className="text-sm text-muted">{serviceGroup.name}</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted" />
          </Link>
        </SettingsRow>
      </SettingsGroup>

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

      {/* Danger Zone - destructive actions separated at bottom */}
      <SettingsGroup
        title={t("danger_zone")}
        description={t("danger_zone_description")}
      >
        <SettingsRow noBorder className="flex items-center justify-between">
          <div>
            <p className="font-medium">{t("delete_group")}</p>
            <p className="text-sm text-muted">{t("delete_group_hint")}</p>
          </div>
          <button
            type="button"
            onClick={() => setDeleteDialogOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100/30 text-danger transition-colors hover:bg-red-100 dark:bg-red-500/5 dark:hover:bg-red-500/15"
            aria-label={t("delete_group")}
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </SettingsRow>
      </SettingsGroup>
    </div>
  );
}
