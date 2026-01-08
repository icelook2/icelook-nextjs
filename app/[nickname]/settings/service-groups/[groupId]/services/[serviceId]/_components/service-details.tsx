"use client";

import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Service, ServiceGroupWithServices } from "@/lib/queries";
import { Button } from "@/lib/ui/button";
import { SettingsGroup, SettingsRow } from "@/lib/ui/settings-group";
import { formatDuration, formatPrice } from "./constants";
import { DeleteServiceDialog } from "./delete-service-dialog";
import { EditServiceDialog } from "./edit-service-dialog";

interface ServiceDetailsProps {
  service: Service;
  serviceGroup: ServiceGroupWithServices;
  nickname: string;
}

export function ServiceDetails({
  service,
  serviceGroup,
  nickname,
}: ServiceDetailsProps) {
  const t = useTranslations("service_groups");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Service settings */}
      <SettingsGroup
        title={t("service_settings")}
        description={t("service_settings_description")}
      >
        <SettingsRow className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">{t("service_name_label")}</p>
            <p className="font-medium">{service.name}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditDialogOpen(true)}
            className="h-8 w-8 p-0"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </SettingsRow>

        {service.description && (
          <SettingsRow>
            <div>
              <p className="text-sm text-muted">
                {t("service_description_label")}
              </p>
              <p className="font-medium">{service.description}</p>
            </div>
          </SettingsRow>
        )}

        <SettingsRow>
          <div>
            <p className="text-sm text-muted">{t("price_label")}</p>
            <p className="font-medium">{formatPrice(service.price_cents)} ₴</p>
          </div>
        </SettingsRow>

        <SettingsRow>
          <div>
            <p className="text-sm text-muted">{t("duration_label")}</p>
            <p className="font-medium">
              {formatDuration(service.duration_minutes)}
            </p>
          </div>
        </SettingsRow>

        <SettingsRow noBorder className="flex items-center justify-between">
          <div>
            <p className="font-medium text-danger">{t("delete_service")}</p>
            <p className="text-sm text-muted">{t("delete_service_hint")}</p>
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

      <EditServiceDialog
        service={service}
        groupId={serviceGroup.id}
        nickname={nickname}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      <DeleteServiceDialog
        service={service}
        groupId={serviceGroup.id}
        nickname={nickname}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </div>
  );
}
