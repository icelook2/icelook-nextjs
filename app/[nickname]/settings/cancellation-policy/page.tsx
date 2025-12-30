import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageAdmins, getBeautyPageByNickname } from "@/lib/queries";
import { getCancellationPolicy } from "@/lib/queries/cancellation-policy";
import { PageHeader } from "@/lib/ui/page-header";
import { CancellationPolicyForm } from "./_components/cancellation-policy-form";

interface CancellationPolicySettingsPageProps {
  params: Promise<{ nickname: string }>;
}

// Default values for new policies
const DEFAULT_POLICY = {
  isEnabled: false,
  maxCancellations: 3,
  periodDays: 30,
  blockDurationDays: 30,
  noShowMultiplier: 2,
};

export default async function CancellationPolicySettingsPage({
  params,
}: CancellationPolicySettingsPageProps) {
  const { nickname } = await params;
  const t = await getTranslations("cancellation_policy_settings");

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

  // Get existing policy or use defaults
  const existingPolicy = await getCancellationPolicy(beautyPage.id);

  const initialValues = existingPolicy
    ? {
        isEnabled: existingPolicy.is_enabled,
        maxCancellations: existingPolicy.max_cancellations,
        periodDays: existingPolicy.period_days,
        blockDurationDays: existingPolicy.block_duration_days,
        noShowMultiplier: existingPolicy.no_show_multiplier,
      }
    : DEFAULT_POLICY;

  return (
    <>
      <PageHeader
        title={t("page_title")}
        subtitle={beautyPage.name}
        backHref={`/${nickname}/settings`}
        containerClassName="mx-auto max-w-2xl"
      />

      <main className="mx-auto max-w-2xl space-y-6 px-4 pb-8">
        <CancellationPolicyForm
          beautyPageId={beautyPage.id}
          nickname={nickname}
          initialValues={initialValues}
        />
      </main>
    </>
  );
}
