"use client";

import { useTranslations } from "next-intl";
import type { ServiceGroupWithServices } from "@/lib/queries";
import { CreateServiceDialog } from "./create-service-dialog";
import { DeleteServiceGroupDialog } from "./delete-service-group-dialog";
import { EditServiceGroupDialog } from "./edit-service-group-dialog";
import { ServiceItem } from "./service-item";

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

interface ServiceGroupCardProps {
  serviceGroup: ServiceGroupWithServices;
  beautyPageId: string;
  nickname: string;
  specialists: BeautyPageMemberWithProfile[];
}

export function ServiceGroupCard({
  serviceGroup,
  beautyPageId,
  nickname,
  specialists,
}: ServiceGroupCardProps) {
  const t = useTranslations("services");

  const services = serviceGroup.services;
  const servicesCount = services.length;

  // Count total assignments in this group
  const assignmentsCount = services.reduce(
    (acc, service) => acc + service.specialist_service_assignments.length,
    0,
  );

  return (
    <div className="rounded-xl border p-4">
      {/* Group Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{serviceGroup.name}</h3>
          <span className="text-sm text-">
            ({servicesCount}{" "}
            {servicesCount === 1 ? t("service") : t("services_plural")})
          </span>
        </div>
        <div className="flex items-center gap-1">
          <EditServiceGroupDialog
            serviceGroup={serviceGroup}
            beautyPageId={beautyPageId}
            nickname={nickname}
          />
          <DeleteServiceGroupDialog
            serviceGroup={serviceGroup}
            beautyPageId={beautyPageId}
            nickname={nickname}
            servicesCount={servicesCount}
            assignmentsCount={assignmentsCount}
          />
        </div>
      </div>

      {/* Services List */}
      <div className="mt-3 space-y-2">
        {services.map((service) => (
          <ServiceItem
            key={service.id}
            service={service}
            serviceGroupId={serviceGroup.id}
            nickname={nickname}
            specialists={specialists}
          />
        ))}

        {/* Empty state */}
        {services.length === 0 && (
          <div className="rounded-lg border border-dashed p-4 text-center">
            <p className="text-sm text-">{t("no_services")}</p>
          </div>
        )}
      </div>

      {/* Add Service Button */}
      <div className="mt-3">
        <CreateServiceDialog
          serviceGroupId={serviceGroup.id}
          nickname={nickname}
        />
      </div>
    </div>
  );
}
