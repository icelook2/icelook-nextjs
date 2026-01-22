import type { Profile } from "@/lib/auth/session";
import { cn } from "@/lib/utils/cn";
import { Logo } from "./logo";
import { ProfileMenu } from "./profile-menu";
import { SidebarNav } from "./sidebar-nav";

interface SidebarProps {
  className?: string;
  profile: Profile | null;
}

export function Sidebar({ className, profile }: SidebarProps) {
  return (
    <aside
      style={{ height: "100dvh" }}
      className={cn(
        "fixed left-0 top-0 flex flex-col items-center justify-between py-4 pl-2",
        className,
      )}
    >
      {/* Logo at top */}
      <Logo />

      {/* Navigation - in the middle */}
      <nav className="flex flex-col items-center">
        <SidebarNav />
      </nav>

      {/* Profile menu at bottom */}
      {profile ? <ProfileMenu profile={profile} /> : <div />}
    </aside>
  );
}
