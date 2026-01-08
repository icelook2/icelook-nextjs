import type { ReactNode } from "react";
import type { Profile } from "@/lib/auth/session";
import type { UserBeautyPage } from "@/lib/queries/beauty-pages";
import { ActiveBeautyPageProvider } from "./active-beauty-page-context";
import { BottomNav } from "./bottom-nav";
import { Sidebar } from "./sidebar";

interface MainLayoutProps {
  children: ReactNode;
  profile: Profile | null;
  /** All beauty pages owned by the user */
  beautyPages: UserBeautyPage[];
  /** Initial active beauty page ID from cookie */
  initialActiveBeautyPageId: string | null;
}

export function MainLayout({
  children,
  profile,
  beautyPages,
  initialActiveBeautyPageId,
}: MainLayoutProps) {
  return (
    <ActiveBeautyPageProvider
      beautyPages={beautyPages}
      initialActiveId={initialActiveBeautyPageId}
    >
      <div className="min-h-screen bg-background">
        {/* Sidebar - hidden on mobile, visible on md+ */}
        <Sidebar className="hidden md:flex" profile={profile} />

        {/* Main content area */}
        <main className="min-h-screen pb-20 md:pb-8 md:pl-[72px]">
          {children}
        </main>

        {/* Bottom nav - visible on mobile, hidden on md+ */}
        <BottomNav className="md:hidden" profile={profile} />
      </div>
    </ActiveBeautyPageProvider>
  );
}
