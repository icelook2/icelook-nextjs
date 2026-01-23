import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageProfile } from "@/lib/queries/beauty-page-profile";
import { PageHeader } from "@/lib/ui/page-header";
import { getProfileUrl } from "@/lib/utils/get-profile-url";
import { ShareProfileContent } from "./_components";

interface ShareProfilePageProps {
  params: Promise<{ nickname: string }>;
}

export default async function ShareProfilePage({
  params,
}: ShareProfilePageProps) {
  const { nickname } = await params;
  const t = await getTranslations("share_profile");

  const beautyPageProfile = await getBeautyPageProfile(nickname);

  if (!beautyPageProfile) {
    notFound();
  }

  const profile = await getProfile();

  if (!profile) {
    redirect(`/${nickname}`);
  }

  // Solo creator model: only owner can access settings
  const isOwner = profile.id === beautyPageProfile.info.owner_id;

  if (!isOwner) {
    redirect(`/${nickname}`);
  }

  const { info, ratingStats } = beautyPageProfile;
  const profileUrl = getProfileUrl(nickname);

  // Use creator avatar if available, otherwise fall back to logo
  const avatarUrl = info.creator_avatar_url || info.logo_url || null;

  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={info.name}
        backHref={`/${nickname}/settings`}
        containerClassName="mx-auto max-w-2xl"
      />

      <div className="mx-auto max-w-2xl px-4 pb-8">
        <ShareProfileContent
          name={info.name}
          nickname={nickname}
          avatarUrl={avatarUrl}
          rating={ratingStats.averageRating}
          reviewCount={ratingStats.totalReviews}
          profileUrl={profileUrl}
        />
      </div>
    </>
  );
}
