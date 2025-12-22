import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import {
  getBeautyPageByNickname,
  getBeautyPageSpecialists,
  getServiceGroupsWithServices,
} from "@/lib/queries";
import { Button } from "@/lib/ui/button";
import { ServicesList } from "./_components";

interface ServicesPageProps {
  params: Promise<{ nickname: string }>;
}

export default async function ServicesPage({ params }: ServicesPageProps) {
  const { nickname } = await params;
  const t = await getTranslations("services");

  const beautyPage = await getBeautyPageByNickname(nickname);

  if (!beautyPage) {
    notFound();
  }

  const profile = await getProfile();

  // Only owner can access settings
  if (!profile || profile.id !== beautyPage.owner_id) {
    redirect(`/${nickname}`);
  }

  const [serviceGroups, specialists] = await Promise.all([
    getServiceGroupsWithServices(beautyPage.id),
    getBeautyPageSpecialists(beautyPage.id),
  ]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href={`/${nickname}/settings`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
                {t("back")}
              </Button>
            </Link>
            <div>
              <h1 className="font-semibold">{t("page_title")}</h1>
              <p className="text-sm text-">{beautyPage.name}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-2xl px-4 py-8">
        <ServicesList
          serviceGroups={serviceGroups}
          beautyPageId={beautyPage.id}
          nickname={nickname}
          specialists={specialists}
        />
      </main>
    </div>
  );
}
