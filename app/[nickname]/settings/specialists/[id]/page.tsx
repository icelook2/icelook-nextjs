import { Calendar, ChevronRight, Scissors, User } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageAdmins, getBeautyPageByNickname } from "@/lib/queries";
import { getSpecialistProfileById } from "@/lib/queries/specialists";
import { Avatar } from "@/lib/ui/avatar";
import { PageHeader } from "@/lib/ui/page-header";
import { Paper } from "@/lib/ui/paper";
import { SettingsGroup } from "@/lib/ui/settings-group";
import {
  ActiveToggle,
  BusinessHoursRestrictionToggle,
  RemoveSpecialistButton,
} from "./_components";

interface SpecialistDetailPageProps {
  params: Promise<{ nickname: string; id: string }>;
}

export default async function SpecialistDetailPage({
  params,
}: SpecialistDetailPageProps) {
  const { nickname, id } = await params;
  const t = await getTranslations("specialists");

  const beautyPage = await getBeautyPageByNickname(nickname);

  if (!beautyPage) {
    notFound();
  }

  const profile = await getProfile();

  if (!profile) {
    redirect(`/${nickname}`);
  }

  // Check if user is owner or admin
  const isOwner = profile.id === beautyPage.owner_id;
  const admins = await getBeautyPageAdmins(beautyPage.id);
  const userIsAdmin = admins.some((a) => a.user_id === profile.id);

  if (!isOwner && !userIsAdmin) {
    redirect(`/${nickname}`);
  }

  const specialist = await getSpecialistProfileById(id);

  if (!specialist) {
    notFound();
  }

  const member = specialist.beauty_page_members;
  const userProfile = member.profiles;
  const isAlsoAdmin = member.roles.includes("admin");

  // Use specialist's custom display name if set, otherwise user's name
  const displayName =
    specialist.display_name ||
    userProfile?.full_name ||
    t("unnamed_specialist");
  const avatarUrl = specialist.avatar_url || userProfile?.avatar_url;

  const assignmentCount =
    specialist.specialist_service_assignments?.length ?? 0;

  return (
    <>
      <PageHeader
        title={displayName}
        subtitle={userProfile?.email ?? t("no_email")}
        backHref={`/${nickname}/settings/specialists`}
        containerClassName="mx-auto max-w-2xl"
      />

      <main className="mx-auto max-w-2xl px-4 pb-8">
        <div className="space-y-6">
          {/* Specialist Info Card */}
          <Paper className="p-6">
            <div className="flex items-center gap-4">
              <Avatar url={avatarUrl} name={displayName} size="lg" />
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-semibold">{displayName}</h2>
                <p className="text-sm text-muted">
                  {userProfile?.email ?? t("no_email")}
                </p>
                {specialist.bio && (
                  <p className="mt-2 text-sm text-muted">{specialist.bio}</p>
                )}
              </div>
            </div>
          </Paper>

          {/* Navigation Links */}
          <SettingsGroup>
            <Link
              href={`/${nickname}/settings/specialists/${id}/profile`}
              className="flex items-center justify-between px-4 py-4 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{t("personal_details")}</p>
                  <p className="text-sm text-muted">
                    {t("personal_details_description")}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted" />
            </Link>

            <Link
              href={`/${nickname}/settings/specialists/${id}/services`}
              className="flex items-center justify-between border-t border-border px-4 py-4 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400">
                  <Scissors className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">
                    {t("assigned_services")} ({assignmentCount})
                  </p>
                  <p className="text-sm text-muted">
                    {t("assigned_services_description")}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted" />
            </Link>

            <Link
              href={`/${nickname}/settings/specialists/${id}/schedule`}
              className="flex items-center justify-between border-t border-border px-4 py-4 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{t("schedule")}</p>
                  <p className="text-sm text-muted">
                    {t("schedule_description")}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted" />
            </Link>
          </SettingsGroup>

          {/* Settings */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">{t("settings_section")}</h2>

            <Paper className="p-4">
              <BusinessHoursRestrictionToggle
                specialistId={specialist.id}
                restrictToBusinessHours={specialist.restrict_to_business_hours}
                beautyPageId={beautyPage.id}
                nickname={nickname}
              />
            </Paper>
          </div>

          {/* Danger Zone */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-danger">
              {t("danger_zone")}
            </h2>

            {/* Active Toggle */}
            <Paper className="p-4">
              <ActiveToggle
                specialistId={specialist.id}
                isActive={specialist.is_active}
                beautyPageId={beautyPage.id}
                nickname={nickname}
              />
            </Paper>

            {/* Remove Specialist */}
            <Paper className="p-4">
              <p className="mb-4 text-sm text-muted">
                {isAlsoAdmin
                  ? t("remove_warning_keeps_admin")
                  : t("remove_warning_removes_entirely")}
              </p>
              <RemoveSpecialistButton
                memberId={member.id}
                memberName={displayName}
                isAlsoAdmin={isAlsoAdmin}
                assignmentCount={assignmentCount}
                beautyPageId={beautyPage.id}
                nickname={nickname}
              />
            </Paper>
          </div>
        </div>
      </main>
    </>
  );
}
