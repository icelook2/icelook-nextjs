import type { ReactNode } from "react";
import type { Profile } from "@/lib/auth/session";
import type { UserBeautyPage } from "@/lib/queries/beauty-pages";
import { ActiveBeautyPageProvider } from "./active-beauty-page-context";
import { BottomNav } from "./bottom-nav";
import { BottomNavVisibilityProvider } from "./bottom-nav-visibility-context";
import { MobileHeader } from "./mobile-header";
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
      <BottomNavVisibilityProvider>
        <div className="min-h-screen bg-background">
          {/* Sidebar - hidden on mobile, visible on md+ */}
          <Sidebar className="hidden md:flex" profile={profile} />

          {/* Main content area - add bottom padding for fixed nav on mobile (includes iOS safe area) */}
          <main className="min-h-screen pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-8 md:pl-[72px]">
            {/* space-y-4 for consistent gap between elements */}
            {/* Desktop: pt-4 for top padding since no mobile header */}
            <div className="space-y-4 md:pt-4">
              {/* Mobile header - visible on mobile, hidden on md+ */}
              <MobileHeader className="md:hidden" />
              {children}
            </div>
          </main>

          {/* Bottom nav - visible on mobile, hidden on md+ */}
          <BottomNav className="md:hidden" profile={profile} />
        </div>
      </BottomNavVisibilityProvider>
    </ActiveBeautyPageProvider>
  );
}
