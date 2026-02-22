import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { getProfile } from "@/lib/auth/session";
import { getActiveBeautyPageId } from "@/lib/beauty-page/active-beauty-page";
import { getUserBeautyPages } from "@/lib/queries/beauty-pages";

interface NicknameLayoutProps {
  children: ReactNode;
}

export default async function NicknameLayout({ children }: NicknameLayoutProps) {
  const profile = await getProfile();

  if (!profile) {
    redirect("/auth");
  }

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
