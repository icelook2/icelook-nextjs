import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getServiceGroupsWithServices } from "@/lib/queries/services";
import { Paper } from "@/lib/ui/paper";

interface ServiceSettingsLinkProps {
  beautyPageId: string;
  serviceName: string;
  nickname: string;
}

export async function ServiceSettingsLink({
  beautyPageId,
  serviceName,
  nickname,
}: ServiceSettingsLinkProps) {
  const t = await getTranslations("clients.service_detail");

  // Find the service by name to get its ID and group ID
  const serviceGroups = await getServiceGroupsWithServices(beautyPageId);

  let serviceId: string | null = null;
  let groupId: string | null = null;

  for (const group of serviceGroups) {
    const service = group.services.find((s) => s.name === serviceName);
    if (service) {
      serviceId = service.id;
      groupId = group.id;
      break;
    }
  }

  // If service not found (might have been deleted), don't show the link
  if (!serviceId || !groupId) {
    return null;
  }

  const settingsUrl = `/${nickname}/settings/service-groups/${groupId}/services/${serviceId}`;

  return (
    <Paper className="p-4">
      <Link
        href={settingsUrl}
        className="flex items-center justify-between text-sm transition-colors hover:text-primary"
      >
        <span>{t("view_service_settings")}</span>
        <ExternalLink className="h-4 w-4" />
      </Link>
    </Paper>
  );
}
