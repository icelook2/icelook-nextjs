import type { ReactNode } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { getProfile } from "@/lib/auth/session";
import { getActiveBeautyPageId } from "@/lib/beauty-page/active-beauty-page";
import { getUserBeautyPages } from "@/lib/queries";

interface BeautyPageLayoutProps {
  children: ReactNode;
}

export default async function BeautyPageLayout({
  children,
}: BeautyPageLayoutProps) {
  // Get profile and beauty pages if user is authenticated
  // This allows the nav to show the correct items for logged-in users
  const profile = await getProfile();

  // Fetch beauty pages and active ID if authenticated
  const [beautyPages, activeBeautyPageId] = profile
    ? await Promise.all([
        getUserBeautyPages(profile.id),
        getActiveBeautyPageId(),
      ])
    : [[], null];

  return (
    <MainLayout
      profile={profile}
      beautyPages={beautyPages}
      initialActiveBeautyPageId={activeBeautyPageId}
    >
      {children}
    </MainLayout>
  );
}
