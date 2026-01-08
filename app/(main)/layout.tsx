import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { getProfile, isOnboardingComplete } from "@/lib/auth/session";
import { getActiveBeautyPageId } from "@/lib/beauty-page/active-beauty-page";
import { getUserBeautyPages } from "@/lib/queries";

interface MainLayoutWrapperProps {
  children: ReactNode;
}

export default async function MainLayoutWrapper({
  children,
}: MainLayoutWrapperProps) {
  const profile = await getProfile();

  // Redirect to auth if not authenticated
  if (!profile) {
    redirect("/auth");
  }

  // Redirect to onboarding if profile incomplete
  if (!isOnboardingComplete(profile)) {
    redirect("/onboarding");
  }

  // Fetch beauty pages and active beauty page ID in parallel
  const [beautyPages, activeBeautyPageId] = await Promise.all([
    getUserBeautyPages(profile.id),
    getActiveBeautyPageId(),
  ]);

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
