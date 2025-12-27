"use client";

import { ChevronRight, Pencil, UserCircle } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type {
  ServiceGroupWithServices,
  ServiceWithAssignments,
} from "@/lib/queries";
import { Avatar } from "@/lib/ui/avatar";
import { Button } from "@/lib/ui/button";
import { SettingsGroup, SettingsRow } from "@/lib/ui/settings-group";
import { AssignSpecialistDialog } from "./assign-specialist-dialog";
import { formatDuration, formatPrice } from "./constants";
import { DeleteServiceDialog } from "./delete-service-dialog";
import { EditServiceDialog } from "./edit-service-dialog";

type BeautyPageMemberWithProfile = {
  id: string;
  beauty_page_id: string;
  user_id: string;
  roles: ("admin" | "specialist")[];
  created_at: string;
  updated_at: string;
  profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
};

interface ServiceDetailsProps {
  service: ServiceWithAssignments;
  serviceGroup: ServiceGroupWithServices;
  nickname: string;
  specialists: BeautyPageMemberWithProfile[];
}

export function ServiceDetails({
  service,
  serviceGroup,
  nickname,
  specialists,
}: ServiceDetailsProps) {
  const t = useTranslations("service_groups");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const assignments = service.specialist_service_assignments;
  const assignedMemberIds = assignments.map((a) => a.member_id);

  return (
    <div className="space-y-6">
      {/* Service name with edit */}
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
        assignmentsCount={assignments.length}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />

      {/* Assigned specialists */}
      <SettingsGroup
        title={t("assigned_specialists")}
        description={t("assigned_specialists_description")}
        action={
          <AssignSpecialistDialog
            serviceId={service.id}
            serviceName={service.name}
            groupId={serviceGroup.id}
            nickname={nickname}
            specialists={specialists}
            assignedMemberIds={assignedMemberIds}
          />
        }
      >
        {assignments.length > 0 ? (
          assignments.map((assignment, index) => {
            const specialistName =
              assignment.beauty_page_members.profiles.full_name ||
              t("unnamed_specialist");
            const avatarUrl =
              assignment.beauty_page_members.profiles.avatar_url;

            return (
              <SettingsRow
                key={assignment.id}
                noBorder={index === assignments.length - 1}
              >
                <Link
                  href={`/${nickname}/settings/service-groups/${serviceGroup.id}/services/${service.id}/specialists/${assignment.id}`}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar url={avatarUrl} name={specialistName} size="md" />
                    <div>
                      <p className="font-medium">{specialistName}</p>
                      <p className="text-sm text-muted">
                        ${formatPrice(assignment.price_cents)} •{" "}
                        {formatDuration(assignment.duration_minutes)}
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
            <UserCircle className="mx-auto h-12 w-12 text-muted" />
            <h3 className="mt-4 font-semibold">
              {t("no_specialists_assigned_title")}
            </h3>
            <p className="mt-2 text-sm text-muted">
              {t("no_specialists_assigned_description")}
            </p>
            {specialists.length > 0 ? (
              <div className="mt-4">
                <AssignSpecialistDialog
                  serviceId={service.id}
                  serviceName={service.name}
                  groupId={serviceGroup.id}
                  nickname={nickname}
                  specialists={specialists}
                  assignedMemberIds={assignedMemberIds}
                  variant="primary"
                />
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted">
                {t("no_specialists_hint")}
              </p>
            )}
          </div>
        )}
      </SettingsGroup>
    </div>
  );
}
