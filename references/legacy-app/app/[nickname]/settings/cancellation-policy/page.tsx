import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageByNickname } from "@/lib/queries";
import { getCancellationPolicy } from "@/lib/queries/cancellation-policy";
import { PageHeader } from "@/lib/ui/page-header";
import { CancellationPolicyForm } from "./_components/cancellation-policy-form";

interface CancellationPolicySettingsPageProps {
  params: Promise<{ nickname: string }>;
}

// Default values for new policies
const DEFAULT_POLICY = {
  allowCancellation: true,
  cancellationNoticeHours: 24,
  cancellationFeePercentage: 0,
  policyText: "",
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

  // Solo creator model: only owner can access settings
  const isOwner = profile.id === beautyPage.owner_id;

  if (!isOwner) {
    redirect(`/${nickname}`);
  }

  // Get existing policy or use defaults
  const existingPolicy = await getCancellationPolicy(beautyPage.id);

  const initialValues = existingPolicy
    ? {
        allowCancellation: existingPolicy.allow_cancellation,
        cancellationNoticeHours: existingPolicy.cancellation_notice_hours,
        cancellationFeePercentage: existingPolicy.cancellation_fee_percentage,
        policyText: existingPolicy.policy_text ?? "",
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

      <div className="mx-auto max-w-2xl space-y-6 px-4 pb-8">
        <CancellationPolicyForm
          beautyPageId={beautyPage.id}
          nickname={nickname}
          initialValues={initialValues}
        />
      </div>
    </>
  );
}
