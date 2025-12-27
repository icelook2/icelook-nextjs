"use client";

import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type {
  ServiceGroupWithServices,
  ServiceWithAssignments,
  SpecialistServiceAssignment,
} from "@/lib/queries";
import { Avatar } from "@/lib/ui/avatar";
import { Button } from "@/lib/ui/button";
import { SettingsGroup, SettingsRow } from "@/lib/ui/settings-group";
import { EditDurationDialog } from "./edit-duration-dialog";
import { EditPriceDialog } from "./edit-price-dialog";
import { RemoveAssignmentDialog } from "./remove-assignment-dialog";

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

type AssignmentWithMember = SpecialistServiceAssignment & {
  beauty_page_members: {
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
};

interface SpecialistServiceDetailsProps {
  assignment: AssignmentWithMember;
  service: ServiceWithAssignments;
  serviceGroup: ServiceGroupWithServices;
  nickname: string;
}

export function SpecialistServiceDetails({
  assignment,
  service,
  serviceGroup,
  nickname,
}: SpecialistServiceDetailsProps) {
  const t = useTranslations("service_groups");
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [durationDialogOpen, setDurationDialogOpen] = useState(false);

  const specialistName =
    assignment.beauty_page_members.profiles.full_name ||
    t("unnamed_specialist");
  const avatarUrl = assignment.beauty_page_members.profiles.avatar_url;

  return (
    <div className="space-y-6">
      {/* Specialist info */}
      <SettingsGroup
        title={t("specialist_info")}
        description={t("specialist_info_description")}
      >
        <SettingsRow noBorder>
          <div className="flex items-center gap-3">
            <Avatar url={avatarUrl} name={specialistName} size="lg" />
            <div>
              <p className="font-medium">{specialistName}</p>
              <p className="text-sm text-muted">{service.name}</p>
            </div>
          </div>
        </SettingsRow>
      </SettingsGroup>

      {/* Price and duration */}
      <SettingsGroup
        title={t("price_and_duration")}
        description={t("price_and_duration_description")}
      >
        <SettingsRow className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">{t("price_label")}</p>
            <p className="font-medium">
              ${formatPrice(assignment.price_cents)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPriceDialogOpen(true)}
            className="h-8 w-8 p-0"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </SettingsRow>
        <SettingsRow noBorder className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">{t("duration_label")}</p>
            <p className="font-medium">
              {formatDuration(assignment.duration_minutes)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDurationDialogOpen(true)}
            className="h-8 w-8 p-0"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </SettingsRow>
      </SettingsGroup>

      <EditPriceDialog
        assignmentId={assignment.id}
        currentPriceCents={assignment.price_cents}
        durationMinutes={assignment.duration_minutes}
        serviceId={service.id}
        groupId={serviceGroup.id}
        nickname={nickname}
        open={priceDialogOpen}
        onOpenChange={setPriceDialogOpen}
      />

      <EditDurationDialog
        assignmentId={assignment.id}
        priceCents={assignment.price_cents}
        currentDurationMinutes={assignment.duration_minutes}
        serviceId={service.id}
        groupId={serviceGroup.id}
        nickname={nickname}
        open={durationDialogOpen}
        onOpenChange={setDurationDialogOpen}
      />

      {/* Danger zone */}
      <SettingsGroup
        title={t("danger_zone")}
        description={t("danger_zone_description")}
      >
        <SettingsRow noBorder className="flex items-center justify-between">
          <div>
            <p className="font-medium text-danger">
              {t("unassign_specialist")}
            </p>
            <p className="text-sm text-muted">
              {t("unassign_specialist_hint", {
                specialist: specialistName,
                service: service.name,
              })}
            </p>
          </div>
          <RemoveAssignmentDialog
            assignmentId={assignment.id}
            specialistName={specialistName}
            serviceName={service.name}
            serviceId={service.id}
            groupId={serviceGroup.id}
            nickname={nickname}
          />
        </SettingsRow>
      </SettingsGroup>
    </div>
  );
}
