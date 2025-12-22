"use client";

import { useTranslations } from "next-intl";
import type { ServiceGroupWithServices } from "@/lib/queries";
import { CreateServiceGroupDialog } from "./create-service-group-dialog";
import { ServiceGroupCard } from "./service-group-card";

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

interface ServicesListProps {
  serviceGroups: ServiceGroupWithServices[];
  beautyPageId: string;
  nickname: string;
  specialists: BeautyPageMemberWithProfile[];
}

export function ServicesList({
  serviceGroups,
  beautyPageId,
  nickname,
  specialists,
}: ServicesListProps) {
  const t = useTranslations("services");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">{t("title")}</h2>
          <p className="text-sm text-">{t("description")}</p>
        </div>
        <CreateServiceGroupDialog
          beautyPageId={beautyPageId}
          nickname={nickname}
        />
      </div>

      {/* Service Groups */}
      {serviceGroups.length > 0 ? (
        <div className="space-y-4">
          {serviceGroups.map((group) => (
            <ServiceGroupCard
              key={group.id}
              serviceGroup={group}
              beautyPageId={beautyPageId}
              nickname={nickname}
              specialists={specialists}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed p-8 text-center">
          <h3 className="text-lg font-semibold">{t("empty_title")}</h3>
          <p className="mt-2 text-sm text-">{t("empty_description")}</p>
        </div>
      )}

      {/* Specialists info */}
      {specialists.length === 0 && serviceGroups.length > 0 && (
        <div className="rounded-lg border p-3 text-sm">
          <p>{t("no_specialists_hint")}</p>
        </div>
      )}
    </div>
  );
}
