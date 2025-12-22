"use client";

import { Scissors } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { SpecialistServiceAssignmentWithService } from "@/lib/queries/specialists";
import { Button } from "@/lib/ui/button";
import { SettingsRow } from "@/lib/ui/settings-group";

interface AssignedServicesProps {
  assignments: SpecialistServiceAssignmentWithService[];
  nickname: string;
}

export function AssignedServices({
  assignments,
  nickname,
}: AssignedServicesProps) {
  const t = useTranslations("specialists");

  if (assignments.length === 0) {
    return (
      <SettingsRow>
        <div className="py-8 text-center">
          <Scissors className="mx-auto h-8 w-8 text-muted" />
          <p className="mt-2 text-sm text-muted">{t("no_assigned_services")}</p>
          <Link href={`/${nickname}/settings/services`}>
            <Button variant="secondary" size="sm" className="mt-4">
              {t("go_to_services")}
            </Button>
          </Link>
        </div>
      </SettingsRow>
    );
  }

  // Group by service group
  const groupedAssignments = assignments.reduce(
    (acc, assignment) => {
      const groupName = assignment.services.service_groups.name;
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(assignment);
      return acc;
    },
    {} as Record<string, SpecialistServiceAssignmentWithService[]>,
  );

  return (
    <>
      {Object.entries(groupedAssignments).map(
        ([groupName, groupAssignments], groupIndex, groups) => (
          <div key={groupName}>
            {/* Group Header */}
            <SettingsRow
              noBorder={
                groupIndex === groups.length - 1 &&
                groupAssignments.length === 0
              }
              className="bg-accent-soft/20"
            >
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                {groupName}
              </h4>
            </SettingsRow>

            {/* Services in Group */}
            {groupAssignments.map((assignment, index) => (
              <SettingsRow
                key={assignment.id}
                noBorder={
                  groupIndex === groups.length - 1 &&
                  index === groupAssignments.length - 1
                }
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {assignment.services.name}
                    </p>
                    <p className="text-xs text-muted">
                      {assignment.duration_minutes} {t("minutes")}
                    </p>
                  </div>
                  <p className="ml-4 shrink-0 font-semibold">
                    {formatPrice(assignment.price_cents)}
                  </p>
                </div>
              </SettingsRow>
            ))}
          </div>
        ),
      )}

      <SettingsRow noBorder>
        <div className="py-2">
          <Link href={`/${nickname}/settings/services`}>
            <Button variant="secondary" size="sm">
              {t("manage_services")}
            </Button>
          </Link>
        </div>
      </SettingsRow>
    </>
  );
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
