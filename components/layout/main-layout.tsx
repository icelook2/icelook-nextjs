import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen">
      {/* Sidebar - hidden on mobile, visible on md+ */}
      <Sidebar className="hidden md:flex" />

      {/* Main content area */}
      <main className="pb-16 md:pb-0 md:pl-16 lg:pl-64">{children}</main>

      {/* Bottom nav - visible on mobile, hidden on md+ */}
      <BottomNav className="md:hidden" />
    </div>
  );
}
