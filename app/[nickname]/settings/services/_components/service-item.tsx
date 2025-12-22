"use client";

import { useTranslations } from "next-intl";
import { AssignSpecialistDialog } from "./assign-specialist-dialog";
import { formatDuration, formatPrice } from "./constants";
import { DeleteServiceDialog } from "./delete-service-dialog";
import { EditAssignmentDialog } from "./edit-assignment-dialog";
import { EditServiceDialog } from "./edit-service-dialog";
import { RemoveAssignmentDialog } from "./remove-assignment-dialog";

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

type Assignment = {
  id: string;
  member_id: string;
  service_id: string;
  price_cents: number;
  duration_minutes: number;
  currency?: string;
  created_at: string;
  updated_at: string;
  beauty_page_members: BeautyPageMemberWithProfile;
};

interface ServiceItemProps {
  service: {
    id: string;
    name: string;
    specialist_service_assignments: Assignment[];
  };
  serviceGroupId: string;
  nickname: string;
  specialists: BeautyPageMemberWithProfile[];
}

export function ServiceItem({
  service,
  serviceGroupId,
  nickname,
  specialists,
}: ServiceItemProps) {
  const t = useTranslations("services");

  const assignments = service.specialist_service_assignments;
  const assignedMemberIds = assignments.map((a) => a.member_id);

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{service.name}</h4>
            <div className="flex items-center gap-1">
              <EditServiceDialog
                service={service}
                serviceGroupId={serviceGroupId}
                nickname={nickname}
              />
              <DeleteServiceDialog
                service={service}
                serviceGroupId={serviceGroupId}
                nickname={nickname}
                assignmentsCount={assignments.length}
              />
            </div>
          </div>

          {/* Assignments */}
          {assignments.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {assignments.map((assignment) => {
                const specialistName =
                  assignment.beauty_page_members.profiles.full_name ||
                  t("unnamed_specialist");
                return (
                  <div
                    key={assignment.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="text-sm">{specialistName}</span>
                    <span className="text-sm">•</span>
                    <span className="text-sm">
                      ${formatPrice(assignment.price_cents)}
                    </span>
                    <span className="text-sm">•</span>
                    <span className="text-sm">
                      {formatDuration(assignment.duration_minutes)}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <EditAssignmentDialog
                        assignment={assignment}
                        specialistName={specialistName}
                        serviceId={service.id}
                        nickname={nickname}
                      />
                      <RemoveAssignmentDialog
                        assignmentId={assignment.id}
                        specialistName={specialistName}
                        serviceName={service.name}
                        serviceId={service.id}
                        nickname={nickname}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Assign specialist button */}
          <div className="mt-2">
            <AssignSpecialistDialog
              serviceId={service.id}
              serviceName={service.name}
              nickname={nickname}
              specialists={specialists}
              assignedMemberIds={assignedMemberIds}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
