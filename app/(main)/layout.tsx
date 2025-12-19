import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { getProfile, isOnboardingComplete } from "@/lib/auth/session";

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

  return <MainLayout>{children}</MainLayout>;
}
