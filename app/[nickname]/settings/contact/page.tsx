import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageAdmins, getBeautyPageByNickname } from "@/lib/queries";
import { PageHeader } from "@/lib/ui/page-header";
import { AddressForm, SocialMediaForm } from "./_components/contact-form";

interface ContactSettingsPageProps {
  params: Promise<{ nickname: string }>;
}

export default async function ContactSettingsPage({
  params,
}: ContactSettingsPageProps) {
  const { nickname } = await params;
  const t = await getTranslations("contact_settings");

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

  return (
    <>
      <PageHeader
        title={t("page_title")}
        subtitle={beautyPage.name}
        backHref={`/${nickname}/settings`}
        containerClassName="mx-auto max-w-2xl"
      />

      <main className="mx-auto max-w-2xl space-y-6 px-4 pb-8">
        <AddressForm
          beautyPageId={beautyPage.id}
          nickname={nickname}
          initialValues={{
            address: beautyPage.address,
            city: beautyPage.city,
            postal_code: beautyPage.postal_code,
          }}
        />

        <SocialMediaForm
          beautyPageId={beautyPage.id}
          nickname={nickname}
          initialValues={{
            instagram_url: beautyPage.instagram_url,
          }}
        />
      </main>
    </>
  );
}
