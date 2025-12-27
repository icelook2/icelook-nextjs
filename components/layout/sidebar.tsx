import type { Profile } from "@/lib/auth/session";
import { cn } from "@/lib/utils/cn";
import { Logo } from "./logo";
import { ProfileMenu } from "./profile-menu";
import { SidebarNav } from "./sidebar-nav";

interface SidebarProps {
  className?: string;
  beautyPagesCount?: number;
  profile: Profile | null;
}

export function Sidebar({
  className,
  beautyPagesCount = 0,
  profile,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 flex h-screen flex-col items-center py-4 pl-2",
        className,
      )}
    >
      {/* Logo at top */}
      <div className="flex items-center justify-center">
        <Logo />
      </div>

      {/* Navigation - centered vertically */}
      <nav className="flex flex-1 flex-col items-center justify-center">
        <SidebarNav beautyPagesCount={beautyPagesCount} />
      </nav>

      {/* Profile menu at bottom */}
      {profile && (
        <div className="mt-auto">
          <ProfileMenu profile={profile} />
        </div>
      )}
    </aside>
  );
}
