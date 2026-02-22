import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getUserBeautyPages } from "@/lib/queries";
import { CreateBeautyPageFlow } from "./_components/create-beauty-page-flow";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("create_beauty_page");
  return {
    title: t("page_title"),
  };
}

export default async function CreateBeautyPagePage() {
  const profile = await getProfile();

  // Redirect to auth if not logged in
  if (!profile) {
    redirect("/auth");
  }

  // Check if user already has beauty pages
  const ownedPages = await getUserBeautyPages(profile.id);

  // For now, allow creating multiple beauty pages
  // In the future, we might want to redirect to settings or show a different flow
  // if (ownedPages.length > 0) {
  //   redirect(`/${ownedPages[0].slug}/settings`);
  // }

  return <CreateBeautyPageFlow existingPagesCount={ownedPages.length} />;
}
